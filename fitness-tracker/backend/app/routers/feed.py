"""GET /v1/feed — hybrid push/pull social feed.

Algorithm:
  1. Load up to `limit` workout IDs from Redis ZSET `feed:{user_id}` (scored
     by started_at Unix timestamp), newest first.
  2. Determine which followed accounts are "celebrities"
     (follower_count >= FANOUT_THRESHOLD) — their workouts were NOT pushed.
  3. For each celebrity, fetch their latest `limit` public/followers workouts
     directly from Postgres.
  4. Merge, deduplicate, sort, paginate.
  5. Hydrate workout rows → FeedItemOut (join users table, count kudos/comments).
  6. Filter: drop private workouts; drop followers-only workouts if viewer
     doesn't follow the author.
"""
from datetime import datetime, timezone
from typing import Optional

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, Request
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..database import get_db
from ..deps import get_user_id
from ..models import Follow, User, Workout
from ..schemas import FeedItemOut, FeedOut

router = APIRouter(tags=["feed"])

# Temporary kudos table via in-memory dict (replace with DB table in prod)
# In a real build this would be a kudos table; we keep it simple for the demo.
_kudos: dict[str, set[str]] = {}   # workout_id → set of user_ids


@router.post("/feed/kudos/{workout_id}", status_code=200)
async def toggle_kudos(
    workout_id: str,
    user_id: str = Depends(get_user_id),
):
    bucket = _kudos.setdefault(workout_id, set())
    if user_id in bucket:
        bucket.discard(user_id)
        return {"liked": False, "count": len(bucket)}
    bucket.add(user_id)
    return {"liked": True, "count": len(bucket)}


@router.get("/feed", response_model=FeedOut)
async def get_feed(
    cursor: Optional[str] = None,
    limit: int = 50,
    request: Request = None,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    redis: aioredis.Redis = request.app.state.redis

    # Parse cursor as max score (Unix ts) for pagination
    max_score = float(cursor) if cursor else "+inf"

    # 1. IDs from Redis push cache
    raw = await redis.zrevrangebyscore(
        f"feed:{user_id}", max_score, "-inf", start=0, num=limit, withscores=True
    )
    cached_ids = [item[0] for item in raw]
    min_score = raw[-1][1] if raw else 0.0

    # 2. Followed celebrities (pull-on-read)
    following_q = select(Follow.followee_id).where(Follow.follower_id == user_id)
    following_result = await db.execute(following_q)
    following_ids = [r[0] for r in following_result.all()]

    # Count followers for each followed user
    celebrity_ids: list[str] = []
    for fid in following_ids:
        cnt_q = select(func.count()).where(Follow.followee_id == fid)
        cnt = (await db.execute(cnt_q)).scalar_one()
        if cnt >= settings.fanout_threshold:
            celebrity_ids.append(fid)

    # 3. Fetch celebrity workouts from Postgres
    celebrity_workout_ids: list[str] = []
    if celebrity_ids:
        cel_q = (
            select(Workout.id)
            .where(Workout.user_id.in_(celebrity_ids), ~Workout.deleted)
            .order_by(Workout.started_at.desc())
            .limit(limit)
        )
        cel_result = await db.execute(cel_q)
        celebrity_workout_ids = [r[0] for r in cel_result.all()]

    # 4. Merge and deduplicate
    all_ids = list(dict.fromkeys(cached_ids + celebrity_workout_ids))[:limit]

    if not all_ids:
        return FeedOut(items=[], next_cursor=None)

    # 5. Hydrate
    workout_q = (
        select(Workout, User)
        .join(User, Workout.user_id == User.id)
        .where(Workout.id.in_(all_ids))
    )
    rows = (await db.execute(workout_q)).all()

    # Build following set for privacy check
    following_set = set(following_ids)

    items: list[FeedItemOut] = []
    for workout, user in rows:
        # Privacy filter
        if workout.privacy == "private":
            continue
        if workout.privacy == "followers" and workout.user_id != user_id:
            if workout.user_id not in following_set:
                continue

        kudos_bucket = _kudos.get(workout.id, set())
        items.append(FeedItemOut(
            id=workout.id,
            user_id=user.id,
            user_handle=user.handle,
            user_display_name=user.display_name,
            user_avatar_hue=user.avatar_hue,
            type=workout.type,
            title=workout.title,
            started_at=workout.started_at,
            ended_at=workout.ended_at,
            distance_km=workout.distance_km,
            privacy=workout.privacy,
            kudos_count=len(kudos_bucket),
            comment_count=0,
            viewer_has_kudos=user_id in kudos_bucket,
        ))

    # Sort newest first
    items.sort(key=lambda x: x.started_at, reverse=True)

    next_cursor = str(min_score) if len(raw) == limit else None
    return FeedOut(items=items, next_cursor=next_cursor)
