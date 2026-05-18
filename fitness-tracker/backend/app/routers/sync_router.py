"""POST /v1/sync — batch LWW sync endpoint.

Protocol:
  Client sends: { cursor: ISO | null, changes: WorkoutChange[] }
  Server:
    1. Apply each change with LWW (same logic as individual POST /workouts).
    2. Query server_changes = workouts where server_updated_at > cursor.
    3. Identify conflicts = changes where server's client_updated_at > incoming.
  Server returns: { new_cursor: ISO, server_changes: [], conflicts: [] }
"""
from datetime import datetime, timezone
from typing import Optional


def _as_utc(dt: datetime) -> datetime:
    """Normalise a possibly naive datetime to UTC-aware."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..deps import get_user_id
from ..fanout import fan_out
from ..models import Workout
from ..schemas import SyncConflict, SyncRequest, SyncResponse, WorkoutOut

router = APIRouter(tags=["sync"])


@router.post("/sync", response_model=SyncResponse)
async def sync(
    body: SyncRequest,
    request: Request,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    conflicts: list[SyncConflict] = []

    for change in body.changes:
        existing = await db.get(Workout, change.id)

        if existing is None:
            workout = Workout(
                id=change.id,
                user_id=user_id,
                type=change.type,
                title=change.title,
                started_at=change.started_at,
                ended_at=change.ended_at,
                distance_km=change.distance_km,
                notes=change.notes,
                privacy=change.privacy,
                deleted=change.deleted,
                client_updated_at=change.client_updated_at,
                server_updated_at=now,
                version=1,
            )
            db.add(workout)
        elif _as_utc(change.client_updated_at) > _as_utc(existing.client_updated_at):
            # Incoming is newer — apply LWW
            existing.type = change.type
            existing.title = change.title
            existing.started_at = change.started_at
            existing.ended_at = change.ended_at
            existing.distance_km = change.distance_km
            existing.notes = change.notes
            existing.privacy = change.privacy
            existing.deleted = change.deleted
            existing.client_updated_at = change.client_updated_at
            existing.server_updated_at = now
            existing.version += 1
        elif _as_utc(change.client_updated_at) == _as_utc(existing.client_updated_at):
            # Same timestamp — idempotent replay, skip
            pass
        else:
            # Server is strictly newer — conflict
            conflicts.append(SyncConflict(id=change.id, server_record=WorkoutOut.model_validate(existing)))

    await db.commit()

    # Fan-out each applied change in background
    for change in body.changes:
        if not any(c.id == change.id for c in conflicts):
            workout = await db.get(Workout, change.id)
            if workout:
                await fan_out(workout, db, request.app.state.redis)

    # Fetch server changes since cursor
    cursor_dt = datetime.fromisoformat(body.cursor) if body.cursor else None
    q = select(Workout).where(Workout.user_id == user_id)
    if cursor_dt:
        q = q.where(Workout.server_updated_at > cursor_dt)
    q = q.order_by(Workout.server_updated_at.asc())
    result = await db.execute(q)
    server_changes = result.scalars().all()

    return SyncResponse(
        new_cursor=now.isoformat(),
        server_changes=[WorkoutOut.model_validate(w) for w in server_changes],
        conflicts=conflicts,
    )
