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


class Tweaks(CamelModel):
    """One-click adjustments applied on top of a style, always re-rendered
    from the original memo (tools never stack on a previous render)."""

    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    echo: float = Field(default=0.0, ge=0.0, le=1.0)
    volume: float = Field(default=1.0, ge=0.1, le=2.0)
    reverse: bool = False


class RenderRequest(CamelModel):
    style: str
    tweaks: Tweaks = Field(default_factory=Tweaks)


class Render(CamelModel):
    id: str
    memo_id: str
    style: str
    tweaks: Tweaks
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
    file_url: str
    permalink: str
    created_at: str
