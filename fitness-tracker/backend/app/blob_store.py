"""BlobStore — local filesystem implementation behind an interface.

Swap out the LocalBlobStore for an S3BlobStore by implementing
the same interface and changing the dependency injection in main.py.
"""
import os
from pathlib import Path


class BlobStore:
    async def put(self, key: str, data: bytes) -> str:
        raise NotImplementedError

    async def get(self, key: str) -> bytes:
        raise NotImplementedError

    async def delete(self, key: str) -> None:
        raise NotImplementedError


class LocalBlobStore(BlobStore):
    def __init__(self, base_dir: str):
        self.base = Path(base_dir)
        self.base.mkdir(parents=True, exist_ok=True)

    async def put(self, key: str, data: bytes) -> str:
        path = self.base / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return key

    async def get(self, key: str) -> bytes:
        return (self.base / key).read_bytes()

    async def delete(self, key: str) -> None:
        p = self.base / key
        if p.exists():
            p.unlink()
