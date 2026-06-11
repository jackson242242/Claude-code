-- VoiceMemoBot — PostgreSQL schema (source of truth).
-- Replaces the dev in-memory store; the swap is contained to backend/app/store.py.
--
-- Two namespaces with a compliance boundary:
--   social.*  — product data + browse events; the long-term ranking profile
--               is built ONLY from these tables.
--   health.*  — mood snapshots derived on-watch from authorized health data.
--               Allowed reads: (a) music rendering, (b) the owner's own
--               journal, (c) the owner's own real-time "mood rail" feed
--               filter (current snapshot only, explicit opt-in, transparent
--               in the UI). Forbidden: longitudinal mood→engagement
--               profiling, ads, sharing, ranking other users' content for
--               third parties — per Apple HealthKit & Google Health Connect
--               terms (violations are an app-store rejection, not a fine).

CREATE SCHEMA IF NOT EXISTS social;
CREATE SCHEMA IF NOT EXISTS health;

-- ---------- social: identity ----------

CREATE TABLE social.users (
    username        TEXT PRIMARY KEY CHECK (username ~ '^[a-zA-Z0-9_]{2,30}$'),
    display_name    TEXT NOT NULL DEFAULT '',
    bio             TEXT NOT NULL DEFAULT '' CHECK (length(bio) <= 200),
    -- explicit, separately-toggled consents (never default-on):
    consent_health    BOOLEAN NOT NULL DEFAULT FALSE,  -- mood capture at all
    consent_mood_feed BOOLEAN NOT NULL DEFAULT FALSE,  -- mood may tune MY feed
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE social.follows (
    follower    TEXT NOT NULL REFERENCES social.users (username) ON DELETE CASCADE,
    followee    TEXT NOT NULL REFERENCES social.users (username) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (follower, followee),
    CHECK (follower <> followee)
);

-- ---------- social: content ----------

CREATE TABLE social.memos (
    id            TEXT PRIMARY KEY,
    owner         TEXT REFERENCES social.users (username) ON DELETE CASCADE,
    filename      TEXT NOT NULL,
    content_type  TEXT NOT NULL,
    size_bytes    BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 15728640),
    object_key    TEXT NOT NULL,  -- S3/R2 key (was a local path in dev)
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE social.renders (
    id             TEXT PRIMARY KEY,
    memo_id        TEXT NOT NULL REFERENCES social.memos (id) ON DELETE CASCADE,
    style          TEXT NOT NULL,
    tweaks         JSONB NOT NULL DEFAULT '{}'::jsonb,   -- speed/echo/volume/reverse
    instruments    TEXT[] NOT NULL DEFAULT '{}',
    backing_tracks TEXT[] NOT NULL DEFAULT '{}',
    prompt         TEXT NOT NULL DEFAULT '' CHECK (length(prompt) <= 200),
    -- mood used for THIS render only (owner-approved at render time)
    mood           JSONB,
    status         TEXT NOT NULL CHECK (status IN ('processing', 'ready', 'failed')),
    object_key     TEXT NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE social.posts (
    id             TEXT PRIMARY KEY,
    render_id      TEXT NOT NULL REFERENCES social.renders (id) ON DELETE CASCADE,
    author         TEXT NOT NULL REFERENCES social.users (username) ON DELETE CASCADE,
    caption        TEXT NOT NULL DEFAULT '' CHECK (length(caption) <= 280),
    likes          INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0),
    forwarded_from TEXT REFERENCES social.posts (id) ON DELETE SET NULL,
    -- opt-in public mood tag chosen by the author at post time (label only);
    -- doubles as the content-side key for mood-rail matching
    mood_tag       TEXT CHECK (mood_tag IS NULL OR mood_tag IN
                               ('calm', 'energetic', 'stressed', 'low')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX posts_created_idx ON social.posts (created_at DESC);
CREATE INDEX posts_author_idx ON social.posts (author, created_at DESC);
CREATE INDEX posts_mood_idx ON social.posts (mood_tag) WHERE mood_tag IS NOT NULL;

CREATE TABLE social.comments (
    id          TEXT PRIMARY KEY,
    post_id     TEXT NOT NULL REFERENCES social.posts (id) ON DELETE CASCADE,
    author      TEXT NOT NULL REFERENCES social.users (username) ON DELETE CASCADE,
    body        TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX comments_post_idx ON social.comments (post_id, created_at);

CREATE TABLE social.favorites (
    username    TEXT NOT NULL REFERENCES social.users (username) ON DELETE CASCADE,
    post_id     TEXT NOT NULL REFERENCES social.posts (id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (username, post_id)
);

CREATE TABLE social.messages (
    id          TEXT PRIMARY KEY,
    from_user   TEXT NOT NULL REFERENCES social.users (username) ON DELETE CASCADE,
    to_user     TEXT NOT NULL REFERENCES social.users (username) ON DELETE CASCADE,
    body        TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (from_user <> to_user)
);
CREATE INDEX messages_thread_idx
    ON social.messages (LEAST(from_user, to_user), GREATEST(from_user, to_user), created_at);

CREATE TABLE social.streams (
    id          TEXT PRIMARY KEY,
    host        TEXT NOT NULL REFERENCES social.users (username) ON DELETE CASCADE,
    title       TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
    status      TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'ended')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- social: browse events (fuel for the long-term ranking profile) ----------

CREATE TABLE social.browse_events (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username    TEXT NOT NULL REFERENCES social.users (username) ON DELETE CASCADE,
    post_id     TEXT REFERENCES social.posts (id) ON DELETE CASCADE,
    event       TEXT NOT NULL CHECK (event IN (
                    'impression', 'play', 'complete', 'like', 'favorite',
                    'comment', 'forward', 'profile_visit')),
    dwell_ms    INTEGER CHECK (dwell_ms IS NULL OR dwell_ms >= 0),
    session_id  TEXT,
    ranking_version TEXT,                 -- for A/B attribution later
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX browse_events_user_idx ON social.browse_events (username, created_at DESC);
CREATE INDEX browse_events_post_idx ON social.browse_events (post_id, event);

-- 90-day rolling retention (run daily, e.g. via pg_cron):
--   DELETE FROM social.browse_events WHERE created_at < now() - interval '90 days';

-- ---------- health: mood snapshots ----------

-- Only filtered, derived values ever reach this table — raw heart-rate
-- samples never leave the watch (see MOOD-AND-FEED-PLAN.md §1.2).

CREATE TABLE health.mood_snapshots (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username    TEXT NOT NULL REFERENCES social.users (username) ON DELETE CASCADE,
    energy      REAL NOT NULL CHECK (energy >= 0 AND energy <= 1),
    calm        REAL NOT NULL CHECK (calm >= 0 AND calm <= 1),
    label       TEXT NOT NULL CHECK (label IN ('calm', 'energetic', 'stressed', 'low')),
    source      TEXT NOT NULL CHECK (source IN ('watchos', 'wearos', 'manual')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX mood_user_idx ON health.mood_snapshots (username, created_at DESC);

CREATE OR REPLACE FUNCTION health.require_consent() RETURNS trigger AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM social.users
        WHERE username = NEW.username AND consent_health
    ) THEN
        RAISE EXCEPTION 'health consent not granted for %', NEW.username;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mood_requires_consent
    BEFORE INSERT ON health.mood_snapshots
    FOR EACH ROW EXECUTE FUNCTION health.require_consent();

-- The ONLY surface the feed service may touch: the caller's own current
-- mood, and only when they opted in to mood-tuned feeds. No history, no
-- other users, so longitudinal mood profiling is structurally impossible.
CREATE OR REPLACE FUNCTION health.current_mood_for_feed(p_username TEXT)
RETURNS TABLE (energy REAL, calm REAL, label TEXT) AS $$
    SELECT m.energy, m.calm, m.label
    FROM health.mood_snapshots m
    JOIN social.users u ON u.username = m.username
    WHERE m.username = p_username
      AND u.consent_health AND u.consent_mood_feed
      AND m.created_at > now() - interval '15 minutes'
    ORDER BY m.created_at DESC
    LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Grant-level enforcement once roles exist: the feed/analytics roles get
-- EXECUTE on health.current_mood_for_feed ONLY — never SELECT on health.*:
--   REVOKE ALL ON ALL TABLES IN SCHEMA health FROM feed_ranker_role, analytics_role;
--   GRANT EXECUTE ON FUNCTION health.current_mood_for_feed(TEXT) TO feed_ranker_role;
