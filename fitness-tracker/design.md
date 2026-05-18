# Pulse — System Design

## 1. Requirements

### Functional
- Users can log workouts (Run / Ride / Lift / Swim / Other) with type, distance, duration, notes, and privacy level.
- Workouts sync to a central backend; the app must work offline and sync when network returns.
- A social feed shows public/followers-only workouts from followed users.
- Users can follow/unfollow others. Kudos (likes) on feed items.
- Profile shows year-to-date stats and an activity heatmap.
- Workout detail includes heart-rate chart (from `workout_samples`) and per-km splits.
- Privacy toggle per workout (Private / Followers / Public) takes effect immediately.

### Non-functional
- **Scale target**: ~1M MAU, ~100k DAU, ~2 workouts/user/day → ~200k writes/day.
- **Offline-first**: the Log screen must work without network. Data must not be lost.
- **Eventual consistency** is acceptable for the social feed (a newly public workout can take seconds to appear in followers' feeds).
- **Strong consistency** is required for a user's own workout log (a saved workout must be visible on Home immediately after the toast).
- Mobile-first: minimize payload size and round-trips.

---

## 2. Back-of-Envelope

| Metric | Estimate |
|--------|----------|
| Writes (workouts) | 200k/day → ~2.3/s avg, ~50/s peak |
| Workout reads (GET /workouts) | 100k DAU × 2/day → 200k/day → ~2.3/s |
| Feed reads | 100k DAU × 2 opens/day × 50 items = 10M items/day → ~116/s |
| Workout samples | 200k workouts × ~100 samples = 20M rows/day |
| Postgres storage (workouts) | 200k × 365 × 1M MAU/100k DAU × ~500B ≈ 365M rows/year → ~180 GB/year |
| Workout samples | 20M rows/day × 365 ≈ 7.3B rows/year → ~300 GB/year (partitioned, cold data moved to object storage) |
| Redis memory | 100k DAU feeds × avg 50 IDs × 24B per entry = ~120 MB |

**Conclusion**: A single Postgres primary (with read replicas for feed hydration) and a single Redis instance comfortably handle these loads. The architecture is straightforward to shard if needed (partition workouts by user_id range).

---

## 3. Key Design Decisions

### Decision 1 — Sync strategy: Last-Write-Wins on `client_updated_at`

**Problem**: Mobile clients go offline, make changes, then reconnect. Multiple devices may have modified the same workout.

**Options considered**:
1. **Server-wins**: Easy to implement, bad UX — user's local edits vanish.
2. **CRDT (Conflict-free Replicated Data Type)**: Correct for concurrent edits, but complex to implement and serialise across clients.
3. **LWW on `client_updated_at`** *(chosen)*: The client timestamps each write. Server applies the change only if `incoming.client_updated_at > stored.client_updated_at`. Conflicts surface in the `/v1/sync` response so the client can display a notice.

**Trade-off**: LWW can lose data if two devices edit the same workout concurrently at nearly the same timestamp. For fitness logging (low contention, usually single-device per user) this is an acceptable trade-off. The conflict response gives the app a recovery path if needed.

**Implementation**:
- `workouts.client_updated_at` is set by the client and immutable once written (server never modifies it).
- `workouts.server_updated_at` is updated on every server write and used as the delta-sync cursor.
- `version` increments on every server write, useful for debugging and cache invalidation.

---

### Decision 2 — Feed architecture: hybrid push/pull fan-out

**Problem**: Building a per-user feed that's both fresh and cheap at scale.

**Options considered**:
1. **Pure pull (fan-in at read time)**: Query followed users' workouts on every feed load. Simple, but O(following count) queries per read. At 100k follows, this is a full table scan.
2. **Pure push fan-out**: On every workout write, insert into each follower's feed. O(followers) writes per save. Works for most users, but celebrities (10k+ followers) cause write storms: one Strava athlete with 1M followers posting = 1M Redis writes.
3. **Hybrid push/pull** *(chosen)*: Push to followers' Redis ZSETs for authors below `FANOUT_THRESHOLD` (default 10k). For celebrities, skip push; read their latest workouts directly from Postgres at feed-read time and merge.

**Trade-off**: Slightly more complex feed-read logic (union of ZSET + Postgres query). The boundary is tunable via the `FANOUT_THRESHOLD` env var. The Redis ZSET is scored by `started_at` Unix timestamp so it naturally sorts and paginates by time.

**Redis structure**: `feed:{user_id}` → ZSET scored by Unix timestamp, member = workout_id. TTL = 14 days. On feed fetch, `ZREVRANGEBYSCORE` for the page, then hydrate from Postgres.

---

### Decision 3 — Offline queue: IndexedDB outbox with optimistic UI

**Problem**: The Log screen's existing checkmark + "syncing…" toast UX implies an async save. The original prototype used `setTimeout`. We need to keep that UX while adding real persistence and handling network failures gracefully.

**Options considered**:
1. **Block save on network response**: Simplest, but breaks offline. The UI would spin indefinitely.
2. **Service Worker background sync**: Correct for progressive web apps, but adds significant complexity and browser support concerns.
3. **IndexedDB outbox with `drainQueue`** *(chosen)*: On save, write to IndexedDB immediately (synchronous from the user's perspective), show the toast, POST to the API in the background. On success, dequeue. On failure, keep the item in the queue — it will be retried on the next `drainQueue` call (app startup or manual retry).

**Trade-off**: IndexedDB is per-origin, per-browser. If the user clears browser data their queue is lost. For a portfolio demo this is acceptable; a production app would use a service worker for more robust retry and background sync.

**Frontend flow** (`App.jsx → handleSave`):
1. `enqueue(item)` → IndexedDB
2. Optimistically prepend to workout list
3. Show "syncing…" toast (existing UI)
4. `createWorkout(item)` → `POST /v1/workouts`
5. On success: `dequeue(id)`, refresh from server, toast → "Synced"
6. On failure: toast → "Saved offline · will sync", item stays in queue

---

## 4. Data Model Notes

### `workouts` table
- `id` is client-generated (UUID v4 from `crypto.randomUUID()`). This enables offline-first creation without a server round-trip and makes `POST /v1/workouts` naturally idempotent.
- `deleted = true` + bumped `version` is the tombstone pattern. Tombstones propagate via the sync endpoint so all clients eventually learn about deletions.

### `workout_samples` (partitioned)
- Monthly `PARTITION BY RANGE(ts)` keeps index sizes manageable. Old partitions can be detached and moved to cheap object storage without touching the hot path.
- Metrics stored: `heart_rate` (bpm), `pace` (s/km per split), `elevation` (m), `cadence` (rpm). The frontend's HR chart and splits table bind to these.

### Personal records
- PRs are stored as static strings (`value = "21:48"`) rather than being derived from `workout_samples`. This avoids an expensive full-scan query. In a production system a background job would recompute PRs after each sync.

---

## 5. Trade-offs Not Yet Addressed (documented, not built)

| Area | Current state | Production path |
|------|--------------|-----------------|
| Auth | Fake `X-User-Id` header | JWT (e.g. Supabase Auth or Auth0) |
| Personal records | Static seed data | Background recompute job after sync |
| HR chart / splits | Prototype data (not from DB) | Bind to `workout_samples` via `/v1/workouts/{id}/samples` |
| Streaks | Hardcoded "14" | Compute from consecutive workout days in stats endpoint |
| Avg pace | Hardcoded "5:08" | Derive from `workout_samples` pace metric |
| Follow counts | Hardcoded "182 / 204" | Count from `follows` table |
| Comment count | Always 0 | Add `comments` table |
| Route thumbnail | SVG placeholder | Store GPS track in `workout_samples` (lat/lon metric), render polyline |
| Read replicas | Single Postgres | PgBouncer + replica for feed hydration queries |
| Partition management | Manual migration | `pg_cron` job to create next month's partition |
