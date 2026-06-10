"""In-memory metadata store + on-disk audio storage.

Mirrors the main backend's in-memory repository pattern (thread-safe dicts,
process-local state). The interface is intentionally narrow so the production
swap — S3/R2 for files, Postgres for metadata — stays contained to this module.
"""
from __future__ import annotations

import os
import threading
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from app.schemas import RenderRequest


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return uuid.uuid4().hex[:12]


@dataclass
class MemoRecord:
    id: str
    filename: str
    content_type: str
    size_bytes: int
    path: Path
    created_at: str = field(default_factory=_now)


@dataclass
class RenderRecord:
    id: str
    memo_id: str
    spec: RenderRequest
    status: str
    path: Path
    created_at: str = field(default_factory=_now)


@dataclass
class PostRecord:
    id: str
    render_id: str
    author: str
    caption: str
    likes: int = 0
    created_at: str = field(default_factory=_now)


class Store:
    def __init__(self, storage_dir: Path) -> None:
        self.storage_dir = storage_dir
        storage_dir.mkdir(parents=True, exist_ok=True)
        self._memos: dict[str, MemoRecord] = {}
        self._renders: dict[str, RenderRecord] = {}
        self._posts: dict[str, PostRecord] = {}
        self._lock = threading.Lock()

    def save_memo(self, filename: str, content_type: str, data: bytes) -> MemoRecord:
        memo_id = new_id()
        suffix = Path(filename).suffix or ".bin"
        path = self.storage_dir / f"memo-{memo_id}{suffix}"
        path.write_bytes(data)
        record = MemoRecord(
            id=memo_id,
            filename=filename,
            content_type=content_type,
            size_bytes=len(data),
            path=path,
        )
        with self._lock:
            self._memos[memo_id] = record
        return record

    def get_memo(self, memo_id: str) -> MemoRecord | None:
        with self._lock:
            return self._memos.get(memo_id)

    def delete_memo(self, memo_id: str) -> bool:
        with self._lock:
            record = self._memos.pop(memo_id, None)
            renders = [r for r in self._renders.values() if r.memo_id == memo_id]
            render_ids = {render.id for render in renders}
            for render in renders:
                self._renders.pop(render.id, None)
            for post in [
                p for p in self._posts.values() if p.render_id in render_ids
            ]:
                self._posts.pop(post.id, None)
        if record is None:
            return False
        record.path.unlink(missing_ok=True)
        for render in renders:
            render.path.unlink(missing_ok=True)
        return True

    def create_render(self, memo: MemoRecord, spec: RenderRequest) -> RenderRecord:
        render_id = new_id()
        path = self.storage_dir / f"render-{render_id}{memo.path.suffix}"
        record = RenderRecord(
            id=render_id,
            memo_id=memo.id,
            spec=spec,
            status="processing",
            path=path,
        )
        with self._lock:
            self._renders[render_id] = record
        return record

    def mark_render(self, render_id: str, status: str) -> None:
        with self._lock:
            record = self._renders.get(render_id)
            if record is not None:
                record.status = status

    def get_render(self, render_id: str) -> RenderRecord | None:
        with self._lock:
            return self._renders.get(render_id)

    def create_post(self, render: RenderRecord, author: str, caption: str) -> PostRecord:
        record = PostRecord(
            id=new_id(),
            render_id=render.id,
            author=author,
            caption=caption,
        )
        with self._lock:
            self._posts[record.id] = record
        return record

    def get_post(self, post_id: str) -> PostRecord | None:
        with self._lock:
            return self._posts.get(post_id)

    def list_posts(self) -> list[PostRecord]:
        with self._lock:
            posts = list(self._posts.values())
        return sorted(posts, key=lambda p: p.created_at, reverse=True)

    def like_post(self, post_id: str) -> PostRecord | None:
        with self._lock:
            record = self._posts.get(post_id)
            if record is not None:
                record.likes += 1
            return record

    def delete_post(self, post_id: str) -> bool:
        with self._lock:
            return self._posts.pop(post_id, None) is not None


_store: Store | None = None


def get_store() -> Store:
    global _store
    if _store is None:
        _store = Store(Path(os.environ.get("VOICEMEMO_STORAGE_DIR", "var/storage")))
    return _store


def reset_store_for_tests() -> None:
    global _store
    _store = None
