"""User profiles, follow/unfollow, per-user post feed, and user homepage."""
from __future__ import annotations

import html

from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import HTMLResponse

from app.routers.memos import _public_base_url
from app.schemas import Post, User, UserRequest
from app.store import PostRecord, UserRecord, get_store

router = APIRouter(tags=["users"])


def _user_out(record: UserRecord) -> User:
    store = get_store()
    return User(
        username=record.username,
        display_name=record.display_name or record.username,
        bio=record.bio,
        follower_count=store.follower_count(record.username),
        following_count=store.following_count(record.username),
        post_count=len(store.list_posts_by_author(record.username)),
        created_at=record.created_at,
    )


def _post_out(record: PostRecord) -> Post:
    from app.routers.posts import _post_out as posts_post_out
    return posts_post_out(record)


@router.post("/users", response_model=User, status_code=201)
def upsert_user(request: UserRequest) -> User:
    record = get_store().upsert_user(
        request.username, request.display_name.strip(), request.bio.strip()
    )
    return _user_out(record)


@router.get("/users/{username}", response_model=User)
def get_user(username: str) -> User:
    record = get_store().get_user(username)
    if record is None:
        raise HTTPException(404, "User not found")
    return _user_out(record)


@router.get("/users/{username}/posts", response_model=list[Post])
def get_user_posts(username: str) -> list[Post]:
    if get_store().get_user(username) is None:
        raise HTTPException(404, "User not found")
    return [_post_out(p) for p in get_store().list_posts_by_author(username)]


@router.get("/users/{username}/feed", response_model=list[Post])
def get_user_feed(username: str) -> list[Post]:
    """Posts from users that *username* follows."""
    if get_store().get_user(username) is None:
        raise HTTPException(404, "User not found")
    return [_post_out(p) for p in get_store().list_posts_for_feed(username)]


@router.post("/users/{username}/follow", status_code=204)
def follow_user(username: str, follower: str) -> Response:
    store = get_store()
    if store.get_user(username) is None:
        raise HTTPException(404, "User not found")
    store.follow_user(follower, username)
    return Response(status_code=204)


@router.delete("/users/{username}/follow", status_code=204)
def unfollow_user(username: str, follower: str) -> Response:
    store = get_store()
    if not store.unfollow_user(follower, username):
        raise HTTPException(404, "Follow relationship not found")
    return Response(status_code=204)


@router.get("/users/{username}/followers", response_model=list[str])
def get_followers(username: str) -> list[str]:
    if get_store().get_user(username) is None:
        raise HTTPException(404, "User not found")
    return get_store().get_followers(username)


@router.get("/users/{username}/following", response_model=list[str])
def get_following(username: str) -> list[str]:
    if get_store().get_user(username) is None:
        raise HTTPException(404, "User not found")
    return get_store().get_following(username)


_PROFILE_PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{display_name} · VoiceMemoBot</title>
<meta property="og:title" content="{display_name} on VoiceMemoBot">
<meta property="og:description" content="{bio}">
<style>
  :root {{ --bg: #0d1117; --card: #161b22; --line: #2d333b;
           --text: #e6edf3; --muted: #8b949e; --accent: #b364f7; --accent2: #f76489; }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; background: var(--bg); color: var(--text);
          font-family: system-ui, -apple-system, sans-serif; }}
  header {{ padding: 2rem 1.5rem 1rem; border-bottom: 1px solid var(--line); }}
  header h1 {{ margin: 0 0 0.3rem;
               background: linear-gradient(90deg, var(--accent), var(--accent2));
               -webkit-background-clip: text; background-clip: text; color: transparent; }}
  .bio {{ color: var(--muted); font-size: 0.9rem; margin: 0.4rem 0 0.8rem; }}
  .stats {{ display: flex; gap: 1.5rem; font-size: 0.85rem; }}
  .stats span b {{ color: var(--text); }}
  main {{ max-width: 42rem; margin: 0 auto; padding: 1.5rem; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }}
  .sound-card {{
    background: var(--card); border: 1px solid var(--line); border-radius: 12px;
    padding: 0.8rem; cursor: pointer; transition: border-color 0.15s;
    position: relative; overflow: hidden;
  }}
  .sound-card:hover {{ border-color: var(--accent); }}
  .sound-card canvas {{ width: 100%; height: 48px; display: block; border-radius: 6px; margin-bottom: 0.5rem; }}
  .sound-card .style {{ font-size: 0.72rem; color: var(--accent); border: 1px solid var(--accent);
                        border-radius: 999px; padding: 0 0.5rem; display: inline-block; margin-bottom: 0.3rem; }}
  .sound-card .caption {{ font-size: 0.82rem; color: var(--text);
                           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}
  .sound-card .likes {{ font-size: 0.78rem; color: var(--accent2); margin-top: 0.3rem; }}
  .sound-card audio {{ display: none; }}
  .playing {{ border-color: var(--accent2) !important; }}
  h2 {{ font-size: 1rem; margin: 0 0 1rem; }}
  a.back {{ color: var(--accent); text-decoration: none; font-size: 0.9rem; }}
</style>
</head>
<body>
<header>
  <a class="back" href="/">← VoiceMemoBot</a>
  <h1>{display_name}</h1>
  <p class="bio">{bio_text}</p>
  <div class="stats">
    <span><b>{follower_count}</b> followers</span>
    <span><b>{following_count}</b> following</span>
    <span><b>{post_count}</b> posts</span>
  </div>
</header>
<main>
  <h2>Sound clips</h2>
  <div class="grid" id="grid"></div>
  <p id="empty" style="color:#8b949e; display:none">No posts yet.</p>
</main>
<script>
const posts = {posts_json};
const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
let currentAudio = null;
let currentCard = null;

function drawWaveform(canvas, audioEl) {{
  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.offsetWidth * devicePixelRatio;
  const h = canvas.height = 48 * devicePixelRatio;
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, w, h);
  audioEl.addEventListener("loadedmetadata", () => {{
    const bars = 40;
    for (let i = 0; i < bars; i++) {{
      const x = (i / bars) * w;
      const barH = (0.3 + 0.7 * Math.random()) * h;
      ctx.fillStyle = "rgba(179,100,247,0.6)";
      ctx.fillRect(x, (h - barH) / 2, w / bars - 2, barH);
    }}
  }});
}}

if (posts.length === 0) {{
  empty.style.display = "";
}} else {{
  for (const post of posts) {{
    const card = document.createElement("div");
    card.className = "sound-card";
    const canvas = document.createElement("canvas");
    const audio = document.createElement("audio");
    audio.src = post.fileUrl;
    audio.preload = "metadata";
    const styleTag = document.createElement("span");
    styleTag.className = "style";
    styleTag.textContent = post.style;
    const caption = document.createElement("div");
    caption.className = "caption";
    caption.textContent = post.caption || "—";
    const likes = document.createElement("div");
    likes.className = "likes";
    likes.textContent = "♥ " + post.likes;
    card.append(canvas, audio, styleTag, caption, likes);
    drawWaveform(canvas, audio);

    card.onclick = () => {{
      if (currentAudio && currentAudio !== audio) {{
        currentAudio.pause();
        currentCard && currentCard.classList.remove("playing");
      }}
      if (audio.paused) {{
        audio.play();
        card.classList.add("playing");
        currentAudio = audio;
        currentCard = card;
      }} else {{
        audio.pause();
        card.classList.remove("playing");
        currentAudio = null;
        currentCard = null;
      }}
    }};
    audio.onended = () => {{ card.classList.remove("playing"); currentAudio = null; }};
    grid.appendChild(card);
  }}
}}
</script>
</body>
</html>"""


@router.get("/users/{username}/page", response_class=HTMLResponse)
def user_homepage(username: str) -> HTMLResponse:
    """Spotify-style user homepage with sound clip grid and waveform previews."""
    import json

    store = get_store()
    record = store.get_user(username)
    if record is None:
        raise HTTPException(404, "User not found")
    user = _user_out(record)
    posts = [_post_out(p) for p in store.list_posts_by_author(username)]
    posts_data = [
        {
            "fileUrl": p.file_url,
            "style": p.style,
            "caption": p.caption,
            "likes": p.likes,
            "id": p.id,
        }
        for p in posts
    ]
    return HTMLResponse(
        _PROFILE_PAGE.format(
            display_name=html.escape(user.display_name),
            bio=html.escape(user.bio or ""),
            bio_text=html.escape(user.bio or "VoiceMemoBot creator"),
            follower_count=user.follower_count,
            following_count=user.following_count,
            post_count=user.post_count,
            posts_json=json.dumps(posts_data),
        )
    )
