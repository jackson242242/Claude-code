"""Pydantic models. Fields are snake_case in Python but serialize to camelCase
JSON (and accept camelCase input) so they map 1:1 onto the Swift Codable types
in the watch app."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict
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


class RenderRequest(CamelModel):
    style: str


class Render(CamelModel):
    id: str
    memo_id: str
    style: str
    status: str
    file_url: str
    share_url: str
    created_at: str
