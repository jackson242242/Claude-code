"""Pluggable game-state stores for M5.1.

Store selection (CONTRACT §1):
  - No env vars set              → MemoryStore  (test mode; g-1, g-2 ids)
  - GAMES_FILE set               → JsonFileStore (uuid4 ids; dir auto-created)
  - DATABASE_URL set             → PostgresStore  (uuid4 ids; overrides GAMES_FILE)

All stores expose the same AbstractStore interface:
  next_id()        → str
  add(state)       → None   (create; also persists for file/pg stores)
  get(game_id)     → GameState | None
  save(state)      → None   (persist existing; upsert for file/pg stores)
"""
from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import TYPE_CHECKING
from uuid import uuid4

if TYPE_CHECKING:
    from app.engine.state import GameState

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Serialization helpers
# ---------------------------------------------------------------------------

DEFAULT_GAMES_FILE = Path(__file__).resolve().parents[1] / "var" / "games.json"


def state_to_dict(state: "GameState") -> dict:
    """Serialize an engine GameState to a JSON-safe camelCase dict.

    The Pydantic schema handles the main payload; internal engine-only fields
    (negative_cash_quarters, next_aircraft_seq, next_route_seq, seen_news_ids)
    are stored in a '_internal' sub-key.
    """
    from app import schemas

    schema = schemas.GameState.model_validate(state, from_attributes=True)
    d = schema.model_dump(by_alias=True, mode="json")
    d["_internal"] = {
        "negativeCashQuarters": state.negative_cash_quarters,
        "nextAircraftSeq": state.next_aircraft_seq,
        "nextRouteSeq": state.next_route_seq,
        "seenNewsIds": list(state.seen_news_ids),
        "slotsHeld": state.slots_held,
        "lastNegotiationTurn": state.last_negotiation_turn,
    }
    return d


def state_from_dict(d: dict) -> "GameState":
    """Deserialize a dict produced by state_to_dict back to an engine GameState."""
    from app import schemas
    from app.engine.state import (
        ActiveEvent,
        CabinMix,
        ClassStats,
        Competitor,
        CompetitorRoute,
        EventEffect,
        EventScope,
        Finance,
        FinanceHistoryEntry,
        FinanceTotals,
        FinalResult,
        FleetAircraft,
        GameState,
        Lifetime,
        NewsItem,
        Route,
        RouteQuarterStats,
        StandingEntry,
    )

    # Separate internal fields from the schema payload.
    internal = d.get("_internal", {})
    # Build a copy without the _internal key for Pydantic validation.
    schema_dict = {k: v for k, v in d.items() if k != "_internal"}

    s = schemas.GameState.model_validate(schema_dict)

    # --- Fleet ----------------------------------------------------------------
    fleet = [
        FleetAircraft(
            id=fa.id,
            model_id=fa.model_id,
            ownership=fa.ownership,
            route_id=fa.route_id,
        )
        for fa in s.fleet
    ]

    # --- Routes ---------------------------------------------------------------
    def _build_class_stats(cs: schemas.ClassStats) -> ClassStats:
        return ClassStats(pax=cs.pax, capacity=cs.capacity, revenue=cs.revenue)

    def _build_route_quarter_stats(rqs: schemas.RouteQuarterStats) -> RouteQuarterStats:
        classes = None
        if rqs.classes is not None:
            classes = {k: _build_class_stats(v) for k, v in rqs.classes.items()}
        return RouteQuarterStats(
            pax=rqs.pax,
            capacity=rqs.capacity,
            load_factor=rqs.load_factor,
            revenue=rqs.revenue,
            cost=rqs.cost,
            profit=rqs.profit,
            classes=classes,
        )

    routes = []
    for r in s.routes:
        lq = _build_route_quarter_stats(r.last_quarter) if r.last_quarter else None
        routes.append(
            Route(
                id=r.id,
                city_a=r.city_a,
                city_b=r.city_b,
                distance_km=r.distance_km,
                aircraft_ids=list(r.aircraft_ids),
                weekly_flights=r.weekly_flights,
                fare_mult=r.fare_mult,
                cabin_mix=CabinMix(
                    economy=r.cabin_mix.economy,
                    business=r.cabin_mix.business,
                    first=r.cabin_mix.first,
                ),
                service_tier=r.service_tier,
                last_quarter=lq,
            )
        )

    # --- Competitors ----------------------------------------------------------
    competitors = []
    for c in s.competitors:
        comp_routes = [
            CompetitorRoute(
                city_a=cr.city_a,
                city_b=cr.city_b,
                weekly_seats=cr.weekly_seats,
            )
            for cr in c.routes
        ]
        competitors.append(
            Competitor(
                id=c.id,
                name=c.name,
                name_zh=c.name_zh,
                hq_city_id=c.hq_city_id,
                fare_mult=c.fare_mult,
                routes=comp_routes,
                market_share=c.market_share,
            )
        )

    # --- News -----------------------------------------------------------------
    news = [
        NewsItem(headline=n.headline, detail=n.detail, kind=n.kind)
        for n in s.news
    ]

    # --- Finance --------------------------------------------------------------
    fin_last = None
    if s.finance.last_quarter:
        lq = s.finance.last_quarter
        fin_last = FinanceTotals(revenue=lq.revenue, cost=lq.cost, profit=lq.profit)
    fin_history = [
        FinanceHistoryEntry(turn=h.turn, cash=h.cash, profit=h.profit)
        for h in s.finance.history
    ]
    finance = Finance(last_quarter=fin_last, history=fin_history)

    # --- Lifetime -------------------------------------------------------------
    lifetime = Lifetime(profit=s.lifetime.profit, pax=s.lifetime.pax)

    # --- FinalResult ----------------------------------------------------------
    final_result = None
    if s.final_result is not None:
        fr = s.final_result
        standings = [
            StandingEntry(
                name=st.name,
                is_player=st.is_player,
                market_share=st.market_share,
            )
            for st in fr.standings
        ]
        final_result = FinalResult(
            rank=fr.rank,
            victory=fr.victory,
            standings=standings,
            cumulative_profit=fr.cumulative_profit,
            cumulative_pax=fr.cumulative_pax,
            ended_turn=fr.ended_turn,
        )

    # --- ActiveEvents ---------------------------------------------------------
    active_events = []
    for ae in s.active_events:
        scope = EventScope(kind=ae.scope.kind, ids=list(ae.scope.ids))
        effects = [
            EventEffect(target=ef.target, mult=ef.mult) for ef in ae.effects
        ]
        active_events.append(
            ActiveEvent(
                id=ae.id,
                source=ae.source,
                headline=ae.headline,
                scope=scope,
                effects=effects,
                duration_turns=ae.duration_turns,
                severity=ae.severity,
                detail=ae.detail,
                source_url=ae.source_url,
                started_turn=ae.started_turn,
                remaining_turns=ae.remaining_turns,
            )
        )

    state = GameState(
        id=s.id,
        airline_name=s.airline_name,
        hq_city_id=s.hq_city_id,
        turn=s.turn,
        year=s.year,
        quarter=s.quarter,
        cash=s.cash,
        fleet=fleet,
        routes=routes,
        competitors=competitors,
        market_share=s.market_share,
        news=news,
        finance=finance,
        status=s.status,
        lifetime=lifetime,
        final_result=final_result,
        active_events=active_events,
    )

    # Restore internal fields from _internal block.
    state.negative_cash_quarters = internal.get("negativeCashQuarters", 0)
    state.next_aircraft_seq = internal.get("nextAircraftSeq", 1)
    state.next_route_seq = internal.get("nextRouteSeq", 1)
    state.seen_news_ids = set(internal.get("seenNewsIds", []))

    # slots_held and last_negotiation_turn are engine-internal; stored in _internal.
    state.slots_held = {str(k): int(v) for k, v in internal.get("slotsHeld", {}).items()}
    state.last_negotiation_turn = {
        str(k): int(v) for k, v in internal.get("lastNegotiationTurn", {}).items()
    }

    return state


# ---------------------------------------------------------------------------
# Abstract base
# ---------------------------------------------------------------------------


class AbstractStore(ABC):
    @abstractmethod
    def next_id(self) -> str: ...

    @abstractmethod
    def add(self, state: "GameState") -> None: ...

    @abstractmethod
    def get(self, game_id: str) -> "GameState | None": ...

    @abstractmethod
    def save(self, state: "GameState") -> None: ...


# ---------------------------------------------------------------------------
# MemoryStore — test / pure-memory mode
# ---------------------------------------------------------------------------


class MemoryStore(AbstractStore):
    """In-memory store with auto-increment ids (g-1, g-2, …). Used in tests."""

    def __init__(self) -> None:
        self._games: dict[str, "GameState"] = {}
        self._seq = 0

    def next_id(self) -> str:
        self._seq += 1
        return f"g-{self._seq}"

    def add(self, state: "GameState") -> None:
        self._games[state.id] = state

    def get(self, game_id: str) -> "GameState | None":
        return self._games.get(game_id)

    def save(self, state: "GameState") -> None:
        self._games[state.id] = state


# ---------------------------------------------------------------------------
# JsonFileStore — default app-runtime persistence mode
# ---------------------------------------------------------------------------


class JsonFileStore(AbstractStore):
    """Persists all games to a single JSON file (GAMES_FILE env var).

    IDs: uuid4 strings.
    Startup: load from file if it exists; missing file = clean start.
    Save: write entire store after every mutation; failures are logged only
          (in-memory state is preserved so the process continues working).
    """

    def __init__(self, path: Path | None = None) -> None:
        self._path: Path = path or DEFAULT_GAMES_FILE
        self._games: dict[str, "GameState"] = {}
        self._load()

    # --- I/O helpers ----------------------------------------------------------

    def _load(self) -> None:
        """Restore all games from file at startup. Missing/corrupt → clean start."""
        if not self._path.exists():
            return
        try:
            with open(self._path, encoding="utf-8") as fh:
                raw: dict = json.load(fh)
            for game_id, game_dict in raw.items():
                try:
                    self._games[game_id] = state_from_dict(game_dict)
                except Exception as exc:
                    logger.warning("store: skipping corrupt game %s: %s", game_id, exc)
        except Exception as exc:
            logger.warning("store: could not load %s, starting fresh: %s", self._path, exc)

    def _persist(self) -> None:
        """Write entire store to disk. Failures are non-fatal (log only)."""
        try:
            self._path.parent.mkdir(parents=True, exist_ok=True)
            tmp = self._path.with_suffix(".tmp")
            payload = {gid: state_to_dict(gs) for gid, gs in self._games.items()}
            with open(tmp, "w", encoding="utf-8") as fh:
                json.dump(payload, fh, ensure_ascii=False)
            tmp.replace(self._path)
        except Exception as exc:
            logger.warning("store: write failure (degraded to memory-only): %s", exc)

    # --- AbstractStore interface ----------------------------------------------

    def next_id(self) -> str:
        return str(uuid4())

    def add(self, state: "GameState") -> None:
        self._games[state.id] = state
        self._persist()

    def get(self, game_id: str) -> "GameState | None":
        return self._games.get(game_id)

    def save(self, state: "GameState") -> None:
        self._games[state.id] = state
        self._persist()


# ---------------------------------------------------------------------------
# PostgresStore — DATABASE_URL mode
# ---------------------------------------------------------------------------


class PostgresStore(AbstractStore):
    """Persists games to PostgreSQL via psycopg (psycopg[binary]).

    Schema: CREATE TABLE games (id TEXT PK, state JSONB, updated_at TIMESTAMPTZ).
    IDs: uuid4 strings.
    """

    def __init__(self, dsn: str) -> None:
        self._dsn = dsn
        self._conn = None  # lazy connection

    def _connect(self):
        if self._conn is None or self._conn.closed:
            import psycopg  # type: ignore[import-untyped]
            self._conn = psycopg.connect(self._dsn, autocommit=True)
        return self._conn

    def next_id(self) -> str:
        return str(uuid4())

    def add(self, state: "GameState") -> None:
        self.save(state)

    def get(self, game_id: str) -> "GameState | None":
        conn = self._connect()
        row = conn.execute(
            "SELECT state FROM games WHERE id = %s", (game_id,)
        ).fetchone()
        if row is None:
            return None
        return state_from_dict(dict(row[0]))

    def save(self, state: "GameState") -> None:
        import json as _json

        payload = state_to_dict(state)
        conn = self._connect()
        conn.execute(
            """
            INSERT INTO games (id, state, updated_at)
            VALUES (%s, %s::jsonb, now())
            ON CONFLICT (id) DO UPDATE
                SET state = EXCLUDED.state,
                    updated_at = now()
            """,
            (state.id, _json.dumps(payload)),
        )
