import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, DateTime, Double, ForeignKey,
    Integer, String, Text, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .database import Base


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    handle = Column(String, unique=True, nullable=False)
    display_name = Column(String, nullable=False)
    avatar_hue = Column(Integer, default=240)
    created_at = Column(DateTime(timezone=True), default=_now)

    workouts = relationship("Workout", back_populates="user", lazy="select")
    following = relationship(
        "Follow", foreign_keys="Follow.follower_id", back_populates="follower"
    )
    followers = relationship(
        "Follow", foreign_keys="Follow.followee_id", back_populates="followee"
    )
    goals = relationship("Goal", back_populates="user")
    records = relationship("PersonalRecord", back_populates="user")


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (UniqueConstraint("follower_id", "followee_id"),)

    follower_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), primary_key=True)
    followee_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), primary_key=True)
    created_at = Column(DateTime(timezone=True), default=_now)

    follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    followee = relationship("User", foreign_keys=[followee_id], back_populates="followers")


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)          # run | ride | lift | swim | other
    title = Column(String, nullable=False, default="Workout")
    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    distance_km = Column(Double, nullable=True)
    notes = Column(Text, nullable=True)
    privacy = Column(String, nullable=False, default="followers")  # private|followers|public
    client_updated_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    server_updated_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    version = Column(Integer, nullable=False, default=1)
    deleted = Column(Boolean, nullable=False, default=False)

    user = relationship("User", back_populates="workouts")
    # Note: workout_samples is a partitioned table — accessed via raw SQL


class Goal(Base):
    __tablename__ = "goals"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    metric = Column(String, nullable=False)        # distance_km | duration_min | workouts
    target = Column(Double, nullable=False)
    period = Column(String, nullable=False)        # week | month
    created_at = Column(DateTime(timezone=True), default=_now)

    user = relationship("User", back_populates="goals")


class PersonalRecord(Base):
    __tablename__ = "personal_records"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    label = Column(String, nullable=False)         # "5K", "10K", "Longest ride", etc.
    value = Column(String, nullable=False)         # "21:48", "84 km", etc.
    icon = Column(String, nullable=False)          # "run" | "ride" | "lift"
    date_achieved = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="records")
