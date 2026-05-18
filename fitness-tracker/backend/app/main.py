import redis.asyncio as aioredis
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .blob_store import LocalBlobStore
from .config import settings
from .database import engine
from .routers import feed, follows, stats, sync_router, workouts


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Attach Redis pool to app state
    app.state.redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    app.state.blobs = LocalBlobStore(settings.blob_dir)
    yield
    await app.state.redis.aclose()
    await engine.dispose()


app = FastAPI(title="Pulse API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workouts.router, prefix="/v1")
app.include_router(sync_router.router, prefix="/v1")
app.include_router(follows.router, prefix="/v1")
app.include_router(feed.router, prefix="/v1")
app.include_router(stats.router, prefix="/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}
