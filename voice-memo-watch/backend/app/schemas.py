"""Pydantic models. Fields are snake_case in Python but serialize to camelCase
JSON (and accept camelCase input) so they map 1:1 onto the Swift Codable types
in the watch app and the web prototype's JS."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Memo(CamelModel):
    id: str
    filename: str
    content_type: str
    size_bytes: int
    created_at: str


class Style(CamelModel):
    id: str
    label: str
    description: str


class Instrument(CamelModel):
    id: str
    label: str
    description: str


class LibraryTrack(CamelModel):
    """A backing track from the product's built-in music library that can
    be layered under a memo — multi-track composition without leaving the
    app. The mock provider synthesizes these offline; ``file_url`` serves a
    preview loop."""

    id: str
    label: str
    description: str
    file_url: str = ""


class PromptSuggestion(CamelModel):
    """A ready-made sound prompt the UI offers next to the free-text field,
    so users see how to phrase natural-language effects ("agent 提示词").
    Every suggestion uses keywords the mock provider genuinely reacts to."""

    label: str
    text: str


class Tweaks(CamelModel):
    """One-click adjustments applied on top of a style, always re-rendered
    from the original memo (tools never stack on a previous render)."""

    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    echo: float = Field(default=0.0, ge=0.0, le=1.0)
    volume: float = Field(default=1.0, ge=0.1, le=2.0)
    reverse: bool = False


class RenderRequest(CamelModel):
    """Everything that shapes a render: the style, one-click tweaks, the
    instruments to mix in, and a free-text prompt describing the sound
    (e.g. "a tired sigh", "an anime villain talking"). Providers receive
    this whole spec."""

    style: str
    tweaks: Tweaks = Field(default_factory=Tweaks)
    instruments: list[str] = Field(default_factory=list, max_length=5)
    backing_tracks: list[str] = Field(default_factory=list, max_length=3)
    prompt: str = Field(default="", max_length=200)


class Render(CamelModel):
    id: str
    memo_id: str
    style: str
    tweaks: Tweaks
    instruments: list[str]
    backing_tracks: list[str]
    prompt: str
    status: str
    file_url: str
    created_at: str


class PostRequest(CamelModel):
    render_id: str
    author: str = Field(default="anonymous", min_length=1, max_length=40)
    caption: str = Field(default="", max_length=280)


class Post(CamelModel):
    id: str
    render_id: str
    style: str
    author: str
    caption: str
    likes: int
    favorites: int
    file_url: str
    permalink: str
    forwarded_from: str | None
    created_at: str


class CommentRequest(CamelModel):
    author: str = Field(default="anonymous", min_length=1, max_length=40)
    body: str = Field(min_length=1, max_length=500)


class Comment(CamelModel):
    id: str
    post_id: str
    author: str
    body: str
    created_at: str


class ForwardRequest(CamelModel):
    author: str = Field(default="anonymous", min_length=1, max_length=40)
    caption: str = Field(default="", max_length=280)


class Transcription(CamelModel):
    memo_id: str
    text: str


class UserRequest(CamelModel):
    username: str = Field(min_length=2, max_length=30, pattern=r"^[a-zA-Z0-9_]+$")
    display_name: str = Field(default="", max_length=60)
    bio: str = Field(default="", max_length=200)


class User(CamelModel):
    username: str
    display_name: str
    bio: str
    follower_count: int
    following_count: int
    post_count: int
    created_at: str


class MessageRequest(CamelModel):
    from_user: str = Field(min_length=2, max_length=30)
    to_user: str = Field(min_length=2, max_length=30)
    body: str = Field(min_length=1, max_length=1000)


class Message(CamelModel):
    id: str
    from_user: str
    to_user: str
    body: str
    created_at: str


class StreamRequest(CamelModel):
    host: str = Field(min_length=2, max_length=40)
    title: str = Field(min_length=1, max_length=100)


class Stream(CamelModel):
    id: str
    host: str
    title: str
    status: str
    listener_count: int
    created_at: str
