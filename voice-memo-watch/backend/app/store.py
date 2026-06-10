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
    forwarded_from: str | None = None
    created_at: str = field(default_factory=_now)


@dataclass
class CommentRecord:
    id: str
    post_id: str
    author: str
    body: str
    created_at: str = field(default_factory=_now)


@dataclass
class UserRecord:
    username: str
    display_name: str = ""
    bio: str = ""
    created_at: str = field(default_factory=_now)


@dataclass
class FollowRecord:
    follower: str
    followee: str


@dataclass
class MessageRecord:
    id: str
    from_user: str
    to_user: str
    body: str
    created_at: str = field(default_factory=_now)


@dataclass
class StreamRecord:
    id: str
    host: str
    title: str
    status: str = "live"
    created_at: str = field(default_factory=_now)


class Store:
    def __init__(self, storage_dir: Path) -> None:
        self.storage_dir = storage_dir
        storage_dir.mkdir(parents=True, exist_ok=True)
        self._memos: dict[str, MemoRecord] = {}
        self._renders: dict[str, RenderRecord] = {}
        self._posts: dict[str, PostRecord] = {}
        self._comments: dict[str, CommentRecord] = {}
        self._users: dict[str, UserRecord] = {}
        self._follows: list[FollowRecord] = []
        self._messages: list[MessageRecord] = []
        self._streams: dict[str, StreamRecord] = {}
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
            deleted_post_ids: set[str] = set()
            for post in [p for p in self._posts.values() if p.render_id in render_ids]:
                self._posts.pop(post.id, None)
                deleted_post_ids.add(post.id)
            for cid in [c.id for c in self._comments.values() if c.post_id in deleted_post_ids]:
                self._comments.pop(cid, None)
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

    def create_post(
        self,
        render: RenderRecord,
        author: str,
        caption: str,
        forwarded_from: str | None = None,
    ) -> PostRecord:
        self._ensure_user(author)
        record = PostRecord(
            id=new_id(),
            render_id=render.id,
            author=author,
            caption=caption,
            forwarded_from=forwarded_from,
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

    def list_posts_by_author(self, username: str) -> list[PostRecord]:
        with self._lock:
            posts = [p for p in self._posts.values() if p.author == username]
        return sorted(posts, key=lambda p: p.created_at, reverse=True)

    def list_posts_for_feed(self, username: str) -> list[PostRecord]:
        """Posts from users that *username* follows, newest first."""
        with self._lock:
            following = {f.followee for f in self._follows if f.follower == username}
            posts = [p for p in self._posts.values() if p.author in following]
        return sorted(posts, key=lambda p: p.created_at, reverse=True)

    def like_post(self, post_id: str) -> PostRecord | None:
        with self._lock:
            record = self._posts.get(post_id)
            if record is not None:
                record.likes += 1
            return record

    def delete_post(self, post_id: str) -> bool:
        with self._lock:
            if self._posts.pop(post_id, None) is None:
                return False
            for cid in [c.id for c in self._comments.values() if c.post_id == post_id]:
                self._comments.pop(cid, None)
        return True

    # ---- comments ----

    def add_comment(self, post_id: str, author: str, body: str) -> CommentRecord:
        self._ensure_user(author)
        record = CommentRecord(id=new_id(), post_id=post_id, author=author, body=body)
        with self._lock:
            self._comments[record.id] = record
        return record

    def get_comments(self, post_id: str) -> list[CommentRecord]:
        with self._lock:
            comments = [c for c in self._comments.values() if c.post_id == post_id]
        return sorted(comments, key=lambda c: c.created_at)

    def get_comment(self, comment_id: str) -> CommentRecord | None:
        with self._lock:
            return self._comments.get(comment_id)

    def delete_comment(self, comment_id: str) -> bool:
        with self._lock:
            return self._comments.pop(comment_id, None) is not None

    # ---- users ----

    def _ensure_user(self, username: str) -> None:
        """Auto-create a minimal user record if one doesn't exist yet."""
        with self._lock:
            if username not in self._users:
                self._users[username] = UserRecord(username=username)

    def upsert_user(self, username: str, display_name: str, bio: str) -> UserRecord:
        with self._lock:
            existing = self._users.get(username)
            if existing:
                existing.display_name = display_name
                existing.bio = bio
                return existing
            record = UserRecord(username=username, display_name=display_name, bio=bio)
            self._users[username] = record
            return record

    def get_user(self, username: str) -> UserRecord | None:
        with self._lock:
            return self._users.get(username)

    def follow_user(self, follower: str, followee: str) -> bool:
        """Returns False if already following."""
        self._ensure_user(follower)
        self._ensure_user(followee)
        with self._lock:
            for f in self._follows:
                if f.follower == follower and f.followee == followee:
                    return False
            self._follows.append(FollowRecord(follower=follower, followee=followee))
            return True

    def unfollow_user(self, follower: str, followee: str) -> bool:
        with self._lock:
            before = len(self._follows)
            self._follows = [
                f for f in self._follows
                if not (f.follower == follower and f.followee == followee)
            ]
            return len(self._follows) < before

    def get_followers(self, username: str) -> list[str]:
        with self._lock:
            return [f.follower for f in self._follows if f.followee == username]

    def get_following(self, username: str) -> list[str]:
        with self._lock:
            return [f.followee for f in self._follows if f.follower == username]

    def follower_count(self, username: str) -> int:
        with self._lock:
            return sum(1 for f in self._follows if f.followee == username)

    def following_count(self, username: str) -> int:
        with self._lock:
            return sum(1 for f in self._follows if f.follower == username)

    # ---- messages ----

    def add_message(self, from_user: str, to_user: str, body: str) -> MessageRecord:
        self._ensure_user(from_user)
        self._ensure_user(to_user)
        record = MessageRecord(id=new_id(), from_user=from_user, to_user=to_user, body=body)
        with self._lock:
            self._messages.append(record)
        return record

    def get_thread(self, user_a: str, user_b: str) -> list[MessageRecord]:
        with self._lock:
            return [
                m for m in self._messages
                if {m.from_user, m.to_user} == {user_a, user_b}
            ]

    def list_conversations(self, username: str) -> list[str]:
        """Returns the other party for each distinct conversation."""
        with self._lock:
            others: set[str] = set()
            for m in self._messages:
                if m.from_user == username:
                    others.add(m.to_user)
                elif m.to_user == username:
                    others.add(m.from_user)
        return sorted(others)

    # ---- streams ----

    def create_stream(self, host: str, title: str) -> StreamRecord:
        self._ensure_user(host)
        record = StreamRecord(id=new_id(), host=host, title=title)
        with self._lock:
            self._streams[record.id] = record
        return record

    def get_stream(self, stream_id: str) -> StreamRecord | None:
        with self._lock:
            return self._streams.get(stream_id)

    def list_streams(self, status: str | None = None) -> list[StreamRecord]:
        with self._lock:
            streams = list(self._streams.values())
        if status:
            streams = [s for s in streams if s.status == status]
        return sorted(streams, key=lambda s: s.created_at, reverse=True)

    def end_stream(self, stream_id: str) -> bool:
        with self._lock:
            record = self._streams.get(stream_id)
            if record is None:
                return False
            record.status = "ended"
            return True


_store: Store | None = None


def get_store() -> Store:
    global _store
    if _store is None:
        _store = Store(Path(os.environ.get("VOICEMEMO_STORAGE_DIR", "var/storage")))
    return _store


def reset_store_for_tests() -> None:
    global _store
    _store = None
