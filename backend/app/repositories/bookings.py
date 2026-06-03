"""Booking persistence: in-memory by default, PostgreSQL when configured."""
from __future__ import annotations

import json
import threading
from abc import ABC, abstractmethod
from typing import Any

from sqlalchemy import text

from app import schemas
from app.db import get_engine


class BookingRepository(ABC):
    @abstractmethod
    def save(self, booking: schemas.Booking) -> None:
        raise NotImplementedError

    @abstractmethod
    def get(self, booking_id: str) -> schemas.Booking | None:
        raise NotImplementedError

    @abstractmethod
    def list_for_user(self, user_id: str) -> list[schemas.Booking]:
        raise NotImplementedError


class InMemoryBookingRepository(BookingRepository):
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._store: dict[str, schemas.Booking] = {}

    def save(self, booking: schemas.Booking) -> None:
        with self._lock:
            self._store[booking.id] = booking.model_copy(deep=True)

    def get(self, booking_id: str) -> schemas.Booking | None:
        booking = self._store.get(booking_id)
        return booking.model_copy(deep=True) if booking else None

    def list_for_user(self, user_id: str) -> list[schemas.Booking]:
        bookings = [
            booking.model_copy(deep=True)
            for booking in self._store.values()
            if booking.user_id == user_id
        ]
        bookings.sort(key=lambda booking: booking.created_at, reverse=True)
        return bookings


class SqlBookingRepository(BookingRepository):
    def save(self, booking: schemas.Booking) -> None:
        engine = get_engine()
        if engine is None:  # pragma: no cover - registry guards this
            raise RuntimeError("SqlBookingRepository requires a database")
        lines = json.dumps([line.model_dump(by_alias=True) for line in booking.lines])
        with engine.begin() as conn:
            conn.execute(
                text(
                    "INSERT INTO bookings (id, user_id, trip_id, trip_name, status, "
                    "confirmation_code, currency, total_usd, payment_provider, lines, created_at) "
                    "VALUES (:id, :user_id, :trip_id, :trip_name, :status, "
                    ":confirmation_code, :currency, :total_usd, :payment_provider, "
                    "CAST(:lines AS JSONB), :created_at)"
                ),
                {
                    "id": booking.id,
                    "user_id": booking.user_id,
                    "trip_id": booking.trip_id,
                    "trip_name": booking.trip_name,
                    "status": booking.status,
                    "confirmation_code": booking.confirmation_code,
                    "currency": booking.currency,
                    "total_usd": booking.total_usd,
                    "payment_provider": booking.payment_provider,
                    "lines": lines,
                    "created_at": booking.created_at,
                },
            )

    @staticmethod
    def _from_row(row: dict[str, Any]) -> schemas.Booking:
        raw_lines = row.get("lines") or []
        if isinstance(raw_lines, str):
            raw_lines = json.loads(raw_lines)
        return schemas.Booking(
            id=row["id"],
            user_id=row["user_id"],
            trip_id=row["trip_id"],
            trip_name=row["trip_name"],
            status=row["status"],
            confirmation_code=row["confirmation_code"],
            currency=row["currency"],
            total_usd=row["total_usd"],
            payment_provider=row["payment_provider"],
            created_at=row["created_at"],
            lines=[schemas.BookingLine(**line) for line in raw_lines],
        )

    def get(self, booking_id: str) -> schemas.Booking | None:
        engine = get_engine()
        if engine is None:  # pragma: no cover
            raise RuntimeError("SqlBookingRepository requires a database")
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT * FROM bookings WHERE id = :id"), {"id": booking_id}
            ).mappings().first()
        return self._from_row(dict(row)) if row else None

    def list_for_user(self, user_id: str) -> list[schemas.Booking]:
        engine = get_engine()
        if engine is None:  # pragma: no cover
            raise RuntimeError("SqlBookingRepository requires a database")
        with engine.connect() as conn:
            rows = conn.execute(
                text(
                    "SELECT * FROM bookings WHERE user_id = :user_id "
                    "ORDER BY created_at DESC"
                ),
                {"user_id": user_id},
            ).mappings().all()
        return [self._from_row(dict(row)) for row in rows]


_memory_repository = InMemoryBookingRepository()


def booking_repository() -> BookingRepository:
    if get_engine() is not None:
        return SqlBookingRepository()
    return _memory_repository
