# Pulse — Fitness Tracker

> System design portfolio build. See `design.md` for the full write-up.

## Quick start

```bash
cp .env.example .env
make up      # starts Postgres 15, Redis 7, FastAPI backend, Vite frontend
make seed    # loads 50 users + ~500 workouts (two demo accounts for feed)
```

Frontend: http://localhost:5173  
API docs: http://localhost:8000/docs

## Development (local, no Docker)

```bash
# Terminal 1 — backend
cd backend && pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

## Tests

```bash
make test
# or locally:
cd backend && pytest ../tests -v
```

The three sync-correctness tests are in `tests/test_sync.py`.
