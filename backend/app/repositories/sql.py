"""PostgreSQL trip repository (used when DATABASE_URL is configured)."""
from __future__ import annotations

import json
from typing import Any

from sqlalchemy import text

from app import schemas
from app.db import get_engine
from app.repositories.base import TripRepository


def _require_engine() -> Any:
    engine = get_engine()
    if engine is None:  # pragma: no cover - registry guards this
        raise RuntimeError("SqlTripRepository requires a configured database")
    return engine


def _item_from_row(row: dict[str, Any]) -> schemas.TripItem:
    payload = row.get("payload")
    if isinstance(payload, str):
        payload = json.loads(payload)
    return schemas.TripItem(
        id=row["id"],
        trip_id=row["trip_id"],
        kind=row["kind"],
        match_id=row["match_id"],
        city_id=row["city_id"],
        title=row["title"],
        subtitle=row["subtitle"],
        price_usd=row["price_usd"],
        starts_at=row["starts_at"],
        sort_order=row["sort_order"],
        payload=payload or {},
        created_at=row["created_at"],
    )


class SqlTripRepository(TripRepository):
    def get_user(self, user_id: str) -> schemas.User | None:
        engine = _require_engine()
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT id, display_name, created_at FROM users WHERE id = :id"),
                {"id": user_id},
            ).mappings().first()
        return schemas.User(**row) if row else None

    def save_user(self, user: schemas.User) -> None:
        engine = _require_engine()
        with engine.begin() as conn:
            conn.execute(
                text(
                    "INSERT INTO users (id, display_name, created_at) "
                    "VALUES (:id, :display_name, :created_at) "
                    "ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name"
                ),
                {
                    "id": user.id,
                    "display_name": user.display_name,
                    "created_at": user.created_at,
                },
            )

    def save_trip(self, trip: schemas.Trip) -> None:
        engine = _require_engine()
        with engine.begin() as conn:
            conn.execute(
                text(
                    "INSERT INTO trips (id, user_id, name, share_token, created_at, updated_at) "
                    "VALUES (:id, :user_id, :name, :share_token, :created_at, :updated_at)"
                ),
                {
                    "id": trip.id,
                    "user_id": trip.user_id,
                    "name": trip.name,
                    "share_token": trip.share_token,
                    "created_at": trip.created_at,
                    "updated_at": trip.updated_at,
                },
            )

    def update_trip(self, trip: schemas.Trip) -> None:
        engine = _require_engine()
        with engine.begin() as conn:
            conn.execute(
                text(
                    "UPDATE trips SET name = :name, updated_at = :updated_at WHERE id = :id"
                ),
                {"id": trip.id, "name": trip.name, "updated_at": trip.updated_at},
            )

    def _items_for(self, conn: Any, trip_id: str) -> list[schemas.TripItem]:
        rows = conn.execute(
            text(
                "SELECT id, trip_id, kind, match_id, city_id, title, subtitle, "
                "price_usd, starts_at, sort_order, payload, created_at "
                "FROM trip_items WHERE trip_id = :trip_id ORDER BY sort_order, created_at"
            ),
            {"trip_id": trip_id},
        ).mappings()
        return [_item_from_row(dict(row)) for row in rows]

    def _assemble(self, conn: Any, row: dict[str, Any]) -> schemas.Trip:
        return schemas.Trip(
            id=row["id"],
            user_id=row["user_id"],
            name=row["name"],
            share_token=row["share_token"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            items=self._items_for(conn, row["id"]),
        )

    def get_trip(self, trip_id: str) -> schemas.Trip | None:
        engine = _require_engine()
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT * FROM trips WHERE id = :id"), {"id": trip_id}
            ).mappings().first()
            return self._assemble(conn, dict(row)) if row else None

    def get_trip_by_share_token(self, share_token: str) -> schemas.Trip | None:
        engine = _require_engine()
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT * FROM trips WHERE share_token = :token"),
                {"token": share_token},
            ).mappings().first()
            return self._assemble(conn, dict(row)) if row else None

    def list_trips_for_user(self, user_id: str) -> list[schemas.Trip]:
        engine = _require_engine()
        with engine.connect() as conn:
            rows = conn.execute(
                text(
                    "SELECT * FROM trips WHERE user_id = :user_id "
                    "ORDER BY updated_at DESC"
                ),
                {"user_id": user_id},
            ).mappings().all()
            return [self._assemble(conn, dict(row)) for row in rows]

    def delete_trip(self, trip_id: str) -> None:
        engine = _require_engine()
        with engine.begin() as conn:
            conn.execute(text("DELETE FROM trips WHERE id = :id"), {"id": trip_id})

    def add_item(self, item: schemas.TripItem) -> None:
        engine = _require_engine()
        with engine.begin() as conn:
            conn.execute(
                text(
                    "INSERT INTO trip_items (id, trip_id, kind, match_id, city_id, "
                    "title, subtitle, price_usd, starts_at, sort_order, payload, created_at) "
                    "VALUES (:id, :trip_id, :kind, :match_id, :city_id, :title, "
                    ":subtitle, :price_usd, :starts_at, :sort_order, "
                    "CAST(:payload AS JSONB), :created_at)"
                ),
                {
                    "id": item.id,
                    "trip_id": item.trip_id,
                    "kind": item.kind,
                    "match_id": item.match_id,
                    "city_id": item.city_id,
                    "title": item.title,
                    "subtitle": item.subtitle,
                    "price_usd": item.price_usd,
                    "starts_at": item.starts_at,
                    "sort_order": item.sort_order,
                    "payload": json.dumps(item.payload),
                    "created_at": item.created_at,
                },
            )

    def remove_item(self, trip_id: str, item_id: str) -> bool:
        engine = _require_engine()
        with engine.begin() as conn:
            result = conn.execute(
                text(
                    "DELETE FROM trip_items WHERE trip_id = :trip_id AND id = :id"
                ),
                {"trip_id": trip_id, "id": item_id},
            )
            return result.rowcount > 0
