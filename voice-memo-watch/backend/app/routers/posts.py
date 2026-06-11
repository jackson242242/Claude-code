"""VoiceMemoBot's own social platform: the feed.

Remixes are not shared out to existing social networks — they are posted to
this feed. JSON endpoints power the watch app and the web prototype; the
``/p/{post_id}`` HTML page is the public permalink for a single post.
"""
from __future__ import annotations

import html

from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import HTMLResponse

from app.routers.memos import _public_base_url
from app.schemas import Comment, CommentRequest, ForwardRequest, Post, PostRequest
from app.store import CommentRecord, PostRecord, get_store

router = APIRouter(tags=["posts"])


def _post_out(record: PostRecord) -> Post:
    render = get_store().get_render(record.render_id)
    base = _public_base_url()
    return Post(
        id=record.id,
        render_id=record.render_id,
        style=render.spec.style if render else "unknown",
        author=record.author,
        caption=record.caption,
        likes=record.likes,
        favorites=get_store().favorite_count(record.id),
        file_url=f"{base}/renders/{record.render_id}/file",
        permalink=f"{base}/p/{record.id}",
        forwarded_from=record.forwarded_from,
        created_at=record.created_at,
    )


def _comment_out(record: CommentRecord) -> Comment:
    return Comment(
        id=record.id,
        post_id=record.post_id,
        author=record.author,
        body=record.body,
        created_at=record.created_at,
    )


@router.post("/posts", response_model=Post, status_code=201)
def create_post(request: PostRequest) -> Post:
    store = get_store()
    render = store.get_render(request.render_id)
    if render is None or render.status != "ready":
        raise HTTPException(404, "Render not found")
    record = store.create_post(render, request.author.strip(), request.caption.strip())
    return _post_out(record)


@router.get("/posts", response_model=list[Post])
def list_posts() -> list[Post]:
    return [_post_out(record) for record in get_store().list_posts()]


@router.get("/posts/{post_id}", response_model=Post)
def get_post(post_id: str) -> Post:
    record = get_store().get_post(post_id)
    if record is None:
        raise HTTPException(404, "Post not found")
    return _post_out(record)


@router.post("/posts/{post_id}/like", response_model=Post)
def like_post(post_id: str) -> Post:
    record = get_store().like_post(post_id)
    if record is None:
        raise HTTPException(404, "Post not found")
    return _post_out(record)


@router.delete("/posts/{post_id}", status_code=204)
def delete_post(post_id: str) -> Response:
    if not get_store().delete_post(post_id):
        raise HTTPException(404, "Post not found")
    return Response(status_code=204)


@router.post("/posts/{post_id}/favorite", response_model=Post)
def favorite_post(post_id: str, user: str = "anonymous") -> Post:
    """Toggle 收藏: first call favorites the post for *user*, second
    removes it. Returns the post with the updated favorite count."""
    store = get_store()
    record = store.get_post(post_id)
    if record is None:
        raise HTTPException(404, "Post not found")
    store.toggle_favorite(post_id, user.strip() or "anonymous")
    return _post_out(record)


@router.post("/posts/{post_id}/forward", response_model=Post, status_code=201)
def forward_post(post_id: str, request: ForwardRequest) -> Post:
    store = get_store()
    original = store.get_post(post_id)
    if original is None:
        raise HTTPException(404, "Post not found")
    render = store.get_render(original.render_id)
    if render is None or render.status != "ready":
        raise HTTPException(404, "Render not found")
    record = store.create_post(
        render,
        request.author.strip() or "anonymous",
        request.caption.strip(),
        forwarded_from=post_id,
    )
    return _post_out(record)


@router.get("/posts/{post_id}/comments", response_model=list[Comment])
def list_comments(post_id: str) -> list[Comment]:
    if get_store().get_post(post_id) is None:
        raise HTTPException(404, "Post not found")
    return [_comment_out(c) for c in get_store().get_comments(post_id)]


@router.post("/posts/{post_id}/comments", response_model=Comment, status_code=201)
def add_comment(post_id: str, request: CommentRequest) -> Comment:
    store = get_store()
    if store.get_post(post_id) is None:
        raise HTTPException(404, "Post not found")
    record = store.add_comment(post_id, request.author.strip() or "anonymous", request.body.strip())
    return _comment_out(record)


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: str) -> Response:
    if not get_store().delete_comment(comment_id):
        raise HTTPException(404, "Comment not found")
    return Response(status_code=204)


_PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta property="og:title" content="{title}">
<meta property="og:description" content="{caption}">
<meta property="og:type" content="music.song">
<meta property="og:audio" content="{file_url}">
<meta property="og:url" content="{permalink}">
</head>
<body style="font-family: system-ui; max-width: 32rem; margin: 4rem auto; text-align: center;">
<h1>{title}</h1>
<p>by <strong>{author}</strong> · ♥ {likes}</p>
<p>{caption}</p>
<audio controls src="{file_url}" style="width: 100%"></audio>
<p><a href="/">Open VoiceMemoBot</a></p>
</body>
</html>"""


@router.get("/p/{post_id}", response_class=HTMLResponse)
def post_page(post_id: str) -> HTMLResponse:
    record = get_store().get_post(post_id)
    if record is None:
        raise HTTPException(404, "Post not found")
    post = _post_out(record)
    return HTMLResponse(
        _PAGE.format(
            title=html.escape(f"{post.style.title()} remix · VoiceMemoBot"),
            author=html.escape(post.author),
            caption=html.escape(post.caption or "A voice memo, remixed by AI."),
            likes=post.likes,
            file_url=post.file_url,
            permalink=post.permalink,
        )
    )
