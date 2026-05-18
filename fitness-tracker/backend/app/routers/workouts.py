import asyncio
from datetime import datetime, timezone
from typing import Optional


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..deps import get_user_id
from ..fanout import fan_out
from ..models import Workout
from ..schemas import WorkoutIn, WorkoutOut, WorkoutPatch

router = APIRouter(tags=["workouts"])


@router.post("/workouts", response_model=WorkoutOut, status_code=200)
async def upsert_workout(
    body: WorkoutIn,
    request: Request,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Idempotent upsert — last-write-wins on client_updated_at."""
    now = datetime.now(timezone.utc)
    existing = await db.get(Workout, body.id)

    if existing is None:
        workout = Workout(
            id=body.id,
            user_id=user_id,
            type=body.type,
            title=body.title,
            started_at=body.started_at,
            ended_at=body.ended_at,
            distance_km=body.distance_km,
            notes=body.notes,
            privacy=body.privacy,
            client_updated_at=body.client_updated_at,
            server_updated_at=now,
            version=1,
        )
        db.add(workout)
        await db.commit()
        await db.refresh(workout)
        background_tasks.add_task(fan_out, workout, db, request.app.state.redis)
        return workout

    # Existing record: apply LWW
    if _as_utc(body.client_updated_at) <= _as_utc(existing.client_updated_at):
        # Incoming is older or same — return stored unchanged
        return existing

    # Incoming is newer — overwrite
    existing.type = body.type
    existing.title = body.title
    existing.started_at = body.started_at
    existing.ended_at = body.ended_at
    existing.distance_km = body.distance_km
    existing.notes = body.notes
    existing.privacy = body.privacy
    existing.client_updated_at = body.client_updated_at
    existing.server_updated_at = now
    existing.version += 1
    await db.commit()
    await db.refresh(existing)
    background_tasks.add_task(fan_out, existing, db, request.app.state.redis)
    return existing


@router.get("/workouts", response_model=list[WorkoutOut])
async def list_workouts(
    since: Optional[str] = None,
    limit: int = 200,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Return workouts where server_updated_at > since (for delta sync)."""
    q = select(Workout).where(Workout.user_id == user_id)
    if since:
        since_dt = datetime.fromisoformat(since)
        q = q.where(Workout.server_updated_at > since_dt)
    q = q.order_by(Workout.server_updated_at.asc()).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/workouts/{workout_id}", response_model=WorkoutOut)
async def get_workout(
    workout_id: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    workout = await db.get(Workout, workout_id)
    if not workout:
        raise HTTPException(404, "Not found")
    # Enforce privacy: only owner can see private workouts
    if workout.privacy == "private" and workout.user_id != user_id:
        raise HTTPException(404, "Not found")
    return workout


@router.patch("/workouts/{workout_id}", response_model=WorkoutOut)
async def patch_workout(
    workout_id: str,
    body: WorkoutPatch,
    request: Request,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Partial update (used by privacy toggle in workout detail screen)."""
    workout = await db.get(Workout, workout_id)
    if not workout or workout.user_id != user_id:
        raise HTTPException(404, "Not found")

    now = datetime.now(timezone.utc)
    if body.privacy is not None:
        workout.privacy = body.privacy
    if body.notes is not None:
        workout.notes = body.notes
    if body.title is not None:
        workout.title = body.title
    workout.client_updated_at = body.client_updated_at
    workout.server_updated_at = now
    workout.version += 1
    await db.commit()
    await db.refresh(workout)
    background_tasks.add_task(fan_out, workout, db, request.app.state.redis)
    return workout


@router.delete("/workouts/{workout_id}", response_model=WorkoutOut)
async def delete_workout(
    workout_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete — sets deleted=true, propagates via sync."""
    workout = await db.get(Workout, workout_id)
    if not workout or workout.user_id != user_id:
        raise HTTPException(404, "Not found")
    now = datetime.now(timezone.utc)
    workout.deleted = True
    workout.server_updated_at = now
    workout.client_updated_at = now
    workout.version += 1
    await db.commit()
    await db.refresh(workout)
    background_tasks.add_task(fan_out, workout, db, request.app.state.redis)
    return workout
