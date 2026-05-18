"""Sync correctness tests.

1. Replaying a sync batch twice is a no-op (idempotency).
2. A newer client write wins over an older server record (LWW).
3. An older client write does NOT clobber a newer server record
   and surfaces the conflict in the response.
"""
import uuid
from datetime import datetime, timedelta, timezone

import pytest

from tests.conftest import HEADERS, USER_ID


def _ts(offset_seconds: int = 0) -> str:
    return (datetime.now(timezone.utc) + timedelta(seconds=offset_seconds)).isoformat()


def _workout(workout_id: str = None, client_ts: str = None, title: str = "Morning run"):
    return {
        "id": workout_id or str(uuid.uuid4()),
        "type": "run",
        "title": title,
        "started_at": _ts(-3600),
        "distance_km": 8.2,
        "privacy": "followers",
        "client_updated_at": client_ts or _ts(),
    }


# ── Test 1: idempotency ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_sync_replay_is_noop(client, demo_user):
    """Sending the same sync batch twice must produce identical server state."""
    wid = str(uuid.uuid4())
    change = _workout(workout_id=wid, client_ts=_ts(-10))
    payload = {"cursor": None, "changes": [change]}

    r1 = await client.post("/v1/sync", json=payload, headers=HEADERS)
    assert r1.status_code == 200
    d1 = r1.json()

    # The server_changes on first sync should include the workout we pushed
    versions_after_first = {w["id"]: w["version"] for w in d1["server_changes"]}
    assert wid in versions_after_first

    r2 = await client.post("/v1/sync", json=payload, headers=HEADERS)
    assert r2.status_code == 200
    d2 = r2.json()

    # Version should not have incremented — replay is a no-op
    versions_after_second = {w["id"]: w["version"] for w in d2["server_changes"]}
    assert versions_after_first.get(wid) == versions_after_second.get(wid), (
        "Re-sending the same record should not bump version"
    )
    assert d2["conflicts"] == [], "No conflict expected on replay"


# ── Test 2: newer client wins ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_newer_client_write_wins(client, demo_user):
    """If the client sends a record with a newer client_updated_at, it must win."""
    wid = str(uuid.uuid4())
    old_ts = _ts(-120)
    new_ts = _ts(-5)

    # First write: older timestamp
    r1 = await client.post(
        "/v1/workouts",
        json=_workout(workout_id=wid, client_ts=old_ts, title="Old title"),
        headers=HEADERS,
    )
    assert r1.status_code == 200
    assert r1.json()["version"] == 1

    # Second write: newer timestamp with updated title
    r2 = await client.post(
        "/v1/workouts",
        json=_workout(workout_id=wid, client_ts=new_ts, title="New title"),
        headers=HEADERS,
    )
    assert r2.status_code == 200
    data = r2.json()
    assert data["title"] == "New title", "Newer client write should overwrite title"
    assert data["version"] == 2, "Version should bump on overwrite"


# ── Test 3: older client does NOT clobber, surfaces conflict ─────────────────

@pytest.mark.asyncio
async def test_older_client_write_does_not_clobber(client, demo_user):
    """If the server already has a newer record, the older incoming write
    must be rejected and appear in the conflicts list."""
    wid = str(uuid.uuid4())
    newer_ts = _ts(-5)
    older_ts = _ts(-300)   # 5 minutes older

    # Establish a record with a recent timestamp (simulate server being ahead)
    r1 = await client.post(
        "/v1/workouts",
        json=_workout(workout_id=wid, client_ts=newer_ts, title="Server title"),
        headers=HEADERS,
    )
    assert r1.status_code == 200
    server_version = r1.json()["version"]

    # Now sync with an older client_updated_at — should conflict
    payload = {
        "cursor": None,
        "changes": [_workout(workout_id=wid, client_ts=older_ts, title="Stale client title")],
    }
    r2 = await client.post("/v1/sync", json=payload, headers=HEADERS)
    assert r2.status_code == 200
    d2 = r2.json()

    assert len(d2["conflicts"]) == 1, "Stale write must produce exactly one conflict"
    conflict = d2["conflicts"][0]
    assert conflict["id"] == wid
    assert conflict["server_record"]["title"] == "Server title", (
        "Conflict should expose the server's version, not the stale write"
    )
    assert conflict["server_record"]["version"] == server_version, (
        "Server record version must not have changed"
    )

    # Verify the title was NOT overwritten
    r3 = await client.get(f"/v1/workouts/{wid}", headers=HEADERS)
    assert r3.status_code == 200
    assert r3.json()["title"] == "Server title", "Stale write must not clobber server state"
