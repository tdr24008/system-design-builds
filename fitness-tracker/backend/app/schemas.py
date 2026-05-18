from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ─────────────────────────── User ───────────────────────────

class UserOut(BaseModel):
    id: str
    handle: str
    display_name: str
    avatar_hue: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────────────── Workout ───────────────────────────

class WorkoutIn(BaseModel):
    id: str = Field(description="Client-generated UUID")
    type: str
    title: str = "Workout"
    started_at: datetime
    ended_at: Optional[datetime] = None
    distance_km: Optional[float] = None
    notes: Optional[str] = None
    privacy: str = "followers"
    client_updated_at: datetime


class WorkoutOut(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    started_at: datetime
    ended_at: Optional[datetime]
    distance_km: Optional[float]
    notes: Optional[str]
    privacy: str
    client_updated_at: datetime
    server_updated_at: datetime
    version: int
    deleted: bool

    model_config = {"from_attributes": True}


class WorkoutPatch(BaseModel):
    privacy: Optional[str] = None
    notes: Optional[str] = None
    title: Optional[str] = None
    client_updated_at: datetime


# ─────────────────────────── Stats ───────────────────────────

class DailyBucket(BaseModel):
    date: str                 # ISO date "2026-05-18"
    distance_km: float
    duration_min: float
    workout_count: int


class StatsOut(BaseModel):
    period: str               # "week" | "month"
    workout_count: int
    total_distance_km: float
    total_duration_min: float
    by_type: dict[str, int]   # {"run": 3, "ride": 1, ...}
    daily: list[DailyBucket]  # ordered oldest→newest


# ─────────────────────────── Feed ───────────────────────────

class FeedItemOut(BaseModel):
    id: str                   # workout id
    user_id: str
    user_handle: str
    user_display_name: str
    user_avatar_hue: int
    type: str
    title: str
    started_at: datetime
    ended_at: Optional[datetime]
    distance_km: Optional[float]
    privacy: str
    kudos_count: int
    comment_count: int
    viewer_has_kudos: bool


class FeedOut(BaseModel):
    items: list[FeedItemOut]
    next_cursor: Optional[str]


# ─────────────────────────── Sync ───────────────────────────

class SyncChange(BaseModel):
    id: str
    type: str
    title: str = "Workout"
    started_at: datetime
    ended_at: Optional[datetime] = None
    distance_km: Optional[float] = None
    notes: Optional[str] = None
    privacy: str = "followers"
    client_updated_at: datetime
    deleted: bool = False


class SyncRequest(BaseModel):
    cursor: Optional[str] = None   # ISO timestamp or None for full sync
    changes: list[SyncChange] = []


class SyncConflict(BaseModel):
    id: str
    server_record: WorkoutOut


class SyncResponse(BaseModel):
    new_cursor: str
    server_changes: list[WorkoutOut]
    conflicts: list[SyncConflict]


# ─────────────────────────── Follow ───────────────────────────

class FollowIn(BaseModel):
    followee_id: str


# ─────────────────────────── Goals ───────────────────────────

class GoalOut(BaseModel):
    id: str
    metric: str
    target: float
    period: str

    model_config = {"from_attributes": True}
