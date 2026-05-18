"""GET /v1/users/{user_id}/stats — aggregate stats for a period."""
from datetime import date, datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..deps import get_user_id
from ..models import Workout
from ..schemas import DailyBucket, StatsOut

router = APIRouter(tags=["stats"])


def _period_bounds(period: str) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    if period == "week":
        # Monday of the current week
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        raise ValueError(f"Unknown period: {period}")
    return start, now


@router.get("/users/{target_user_id}/stats", response_model=StatsOut)
async def get_stats(
    target_user_id: str,
    period: str = "week",
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    start, end = _period_bounds(period)

    q = select(Workout).where(
        Workout.user_id == target_user_id,
        Workout.started_at >= start,
        Workout.started_at <= end,
        ~Workout.deleted,
    )
    result = await db.execute(q)
    workouts = result.scalars().all()

    total_distance = sum(w.distance_km or 0.0 for w in workouts)
    total_duration = sum(
        (
            (w.ended_at - w.started_at).total_seconds() / 60
            if w.ended_at
            else 0.0
        )
        for w in workouts
    )
    by_type: dict[str, int] = {}
    for w in workouts:
        by_type[w.type] = by_type.get(w.type, 0) + 1

    # Build daily buckets
    daily_map: dict[str, DailyBucket] = {}
    for w in workouts:
        day_str = w.started_at.date().isoformat()
        dur = (
            (w.ended_at - w.started_at).total_seconds() / 60 if w.ended_at else 0.0
        )
        if day_str not in daily_map:
            daily_map[day_str] = DailyBucket(
                date=day_str, distance_km=0.0, duration_min=0.0, workout_count=0
            )
        daily_map[day_str].distance_km += w.distance_km or 0.0
        daily_map[day_str].duration_min += dur
        daily_map[day_str].workout_count += 1

    # Fill in zero days for the period
    if period == "week":
        days = [start.date() + timedelta(days=i) for i in range(7)]
    else:
        month_end = end.date()
        days = [start.date() + timedelta(days=i) for i in range((month_end - start.date()).days + 1)]

    daily = []
    for d in days:
        ds = d.isoformat()
        daily.append(
            daily_map.get(
                ds,
                DailyBucket(date=ds, distance_km=0.0, duration_min=0.0, workout_count=0),
            )
        )

    return StatsOut(
        period=period,
        workout_count=len(workouts),
        total_distance_km=round(total_distance, 2),
        total_duration_min=round(total_duration, 1),
        by_type=by_type,
        daily=daily,
    )
