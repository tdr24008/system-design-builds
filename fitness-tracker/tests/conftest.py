"""Test fixtures — use an in-memory SQLite DB via aiosqlite so tests run
without Postgres. Redis calls are mocked.
"""
import asyncio
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import User


# ── in-memory SQLite engine ──────────────────────────────────────────────────
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSession = async_sessionmaker(test_engine, expire_on_commit=False)


@pytest_asyncio.fixture(scope="function")
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with TestSession() as session:
        yield session
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db: AsyncSession):
    async def override_db():
        yield db

    app.dependency_overrides[get_db] = override_db

    # Mock Redis
    mock_redis = AsyncMock()
    mock_redis.zrevrangebyscore = AsyncMock(return_value=[])
    mock_redis.pipeline = MagicMock(return_value=AsyncMock(
        __aenter__=AsyncMock(return_value=AsyncMock()),
        __aexit__=AsyncMock(return_value=False),
    ))

    app.state.redis = mock_redis
    app.state.blobs = MagicMock()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


USER_ID = str(uuid.uuid4())
OTHER_USER_ID = str(uuid.uuid4())

HEADERS = {"X-User-Id": USER_ID}


@pytest_asyncio.fixture
async def demo_user(db: AsyncSession) -> User:
    u = User(id=USER_ID, handle="tomr", display_name="Tom Richardson")
    db.add(u)
    await db.commit()
    await db.refresh(u)
    return u
