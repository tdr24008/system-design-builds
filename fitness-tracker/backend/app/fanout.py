"""Feed fan-out logic.

Strategy (hybrid push/pull):
  - Authors with < FANOUT_THRESHOLD followers: push workout id into each
    follower's Redis ZSET `feed:{follower_id}` scored by Unix timestamp.
  - Authors with >= FANOUT_THRESHOLD followers ("celebrities"): skip push.
    On feed fetch, the caller unions the ZSET results with a direct Postgres
    query for followed celebrities (see routers/feed.py).

This keeps Redis writes O(followers) for most users while bounding the
fan-out cost for popular accounts.
"""
import asyncio
import logging
from datetime import datetime, timezone

import redis.asyncio as aioredis
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from .config import settings
from .models import Follow, Workout

logger = logging.getLogger(__name__)

FEED_TTL = 60 * 60 * 24 * 14  # keep feed items for 14 days


async def fan_out(
    workout: Workout,
    db: AsyncSession,
    redis: aioredis.Redis,
) -> None:
    """Called in the background after a workout is created/updated."""
    if workout.privacy == "private" or workout.deleted:
        # Remove from all feeds if it was previously visible
        await _remove_from_feeds(workout.id, db, redis)
        return

    # Count followers
    follower_count_row = await db.execute(
        select(func.count()).where(Follow.followee_id == workout.user_id)
    )
    follower_count = follower_count_row.scalar_one()

    if follower_count >= settings.fanout_threshold:
        logger.info(
            "Skipping fan-out for %s (celebrity, %d followers)", workout.user_id, follower_count
        )
        return

    # Fetch follower IDs
    rows = await db.execute(
        select(Follow.follower_id).where(Follow.followee_id == workout.user_id)
    )
    follower_ids = [r[0] for r in rows.all()]

    if not follower_ids:
        return

    score = workout.started_at.replace(tzinfo=timezone.utc).timestamp()
    pipe = redis.pipeline()
    for fid in follower_ids:
        key = f"feed:{fid}"
        pipe.zadd(key, {workout.id: score})
        pipe.expire(key, FEED_TTL)
    await pipe.execute()
    logger.debug("Fan-out workout %s to %d followers", workout.id, len(follower_ids))


async def _remove_from_feeds(
    workout_id: str,
    db: AsyncSession,
    redis: aioredis.Redis,
) -> None:
    rows = await db.execute(select(Follow.follower_id))
    follower_ids = [r[0] for r in rows.all()]
    if not follower_ids:
        return
    pipe = redis.pipeline()
    for fid in follower_ids:
        pipe.zrem(f"feed:{fid}", workout_id)
    await pipe.execute()
