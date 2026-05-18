"""Seed script — 50 users, ~500 workouts, follows, goals.

Two demo users so the feed has real content:
  - tomr  (X-User-Id: see DEMO_USER_ID below) — the app's logged-in user
  - sarah_runs — followed by tomr, shows up in feed

Run: make seed  (or: cd fitness-tracker && python -m scripts.seed)
"""
import asyncio
import math
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Add backend to path when running directly
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.config import settings
from app.database import Base
from app.models import Follow, Goal, PersonalRecord, User, Workout

DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"
SARAH_ID = "00000000-0000-0000-0000-000000000002"

rng = random.Random(42)

ACTIVITY_TYPES = ["run", "ride", "lift", "swim", "other"]
ACTIVITY_WEIGHTS = [0.45, 0.25, 0.15, 0.10, 0.05]

RUN_TITLES = ["Morning loop", "Tempo intervals", "Easy jog", "Long run", "Track session", "Trail run"]
RIDE_TITLES = ["Hill repeats", "Long ride", "Recovery spin", "Group ride", "Commute"]
LIFT_TITLES = ["Leg day", "Upper body", "Full body", "Strength session", "Push day", "Pull day"]
SWIM_TITLES = ["Pool 2k", "Endurance swim", "Drills session", "Open water"]
OTHER_TITLES = ["CrossFit", "HIIT", "Yoga", "Rowing", "Stretching"]

TITLE_MAP = {
    "run": RUN_TITLES,
    "ride": RIDE_TITLES,
    "lift": LIFT_TITLES,
    "swim": SWIM_TITLES,
    "other": OTHER_TITLES,
}

HANDLES_AND_NAMES = [
    ("tomr", "Tom Richardson", 240),
    ("sarah_runs", "Sarah Chen", 320),
    ("mike.cycles", "Mike Tanaka", 200),
    ("ana.lifts", "Ana Marín", 30),
    ("dan_tri", "Dan Park", 160),
    ("james.r", "James Rivera", 60),
    ("lucia.f", "Lucia Fernández", 280),
    ("ben_watts", "Ben Watts", 100),
    ("priya.s", "Priya Sharma", 0),
    ("omar.h", "Omar Hassan", 180),
]

# Fill up to 50 users with generated handles
for i in range(10, 50):
    HANDLES_AND_NAMES.append((f"user_{i}", f"User {i}", (i * 37) % 360))


def _rand_workout(user_id: str, day_offset: int) -> Workout:
    wtype = rng.choices(ACTIVITY_TYPES, ACTIVITY_WEIGHTS)[0]
    title = rng.choice(TITLE_MAP[wtype])
    started = datetime.now(timezone.utc) - timedelta(days=day_offset, hours=rng.randint(5, 19))
    duration_min = rng.randint(20, 120)
    ended = started + timedelta(minutes=duration_min)
    distance = None
    if wtype in ("run", "ride", "swim"):
        distance = round(rng.uniform(2.0, 45.0 if wtype == "ride" else 12.0), 1)
    return Workout(
        id=str(uuid.uuid4()),
        user_id=user_id,
        type=wtype,
        title=title,
        started_at=started,
        ended_at=ended,
        distance_km=distance,
        privacy=rng.choice(["public", "followers", "followers", "followers"]),
        client_updated_at=started,
        server_updated_at=started,
        version=1,
    )


async def seed():
    engine = create_async_engine(settings.database_url)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with Session() as db:
        # ── users ──────────────────────────────────────────────────────
        users: list[User] = []
        for i, (handle, name, hue) in enumerate(HANDLES_AND_NAMES):
            uid = DEMO_USER_ID if handle == "tomr" else (SARAH_ID if handle == "sarah_runs" else str(uuid.uuid4()))
            u = User(id=uid, handle=handle, display_name=name, avatar_hue=hue)
            db.add(u)
            users.append(u)
        await db.commit()

        # ── follows: tomr follows first 8 users; sarah follows tomr ───
        for u in users[1:9]:
            db.add(Follow(follower_id=DEMO_USER_ID, followee_id=u.id))
        db.add(Follow(follower_id=SARAH_ID, followee_id=DEMO_USER_ID))
        await db.commit()

        # ── workouts ───────────────────────────────────────────────────
        for u in users:
            # Give each user between 5 and 15 workouts over the last 90 days
            count = rng.randint(5, 15)
            for _ in range(count):
                day = rng.randint(0, 90)
                db.add(_rand_workout(u.id, day))

        # Demo user: ensure recognisable recent workouts
        for title, wtype, dist, dur, offset in [
            ("Morning loop", "run", 8.2, 41, 0),
            ("Tempo intervals", "run", 6.0, 28, 1),
            ("Long ride", "ride", 42.0, 98, 2),
        ]:
            started = datetime.now(timezone.utc) - timedelta(days=offset, hours=7)
            ended = started + timedelta(minutes=dur)
            db.add(Workout(
                id=str(uuid.uuid4()),
                user_id=DEMO_USER_ID,
                type=wtype,
                title=title,
                started_at=started,
                ended_at=ended,
                distance_km=dist,
                privacy="followers",
                client_updated_at=started,
                server_updated_at=started,
                version=1,
            ))

        await db.commit()

        # ── weekly goal for demo user ──────────────────────────────────
        db.add(Goal(
            id=str(uuid.uuid4()),
            user_id=DEMO_USER_ID,
            metric="distance_km",
            target=50.0,
            period="week",
        ))
        await db.commit()

        # ── personal records for demo user ─────────────────────────────
        from datetime import date
        for label, value, icon, days_ago in [
            ("5K", "21:48", "run", 36),
            ("10K", "45:32", "run", 77),
            ("Longest ride", "84 km", "ride", 82),
            ("Heaviest lift", "120 kg", "lift", 14),
        ]:
            db.add(PersonalRecord(
                id=str(uuid.uuid4()),
                user_id=DEMO_USER_ID,
                label=label,
                value=value,
                icon=icon,
                date_achieved=datetime.now(timezone.utc) - timedelta(days=days_ago),
            ))
        await db.commit()

    await engine.dispose()
    print(f"Seeded {len(users)} users. Demo user ID: {DEMO_USER_ID}")


if __name__ == "__main__":
    asyncio.run(seed())
