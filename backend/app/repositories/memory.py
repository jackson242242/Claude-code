"""In-memory trip repository (default when no database is configured).

State lives for the lifetime of the process — fine for local development and a
demo, but durable persistence requires PostgreSQL (see ``sql``).
"""
from __future__ import annotations

import threading

from app import schemas
from app.repositories.base import TripRepository


class InMemoryTripRepository(TripRepository):
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._users: dict[str, schemas.User] = {}
        self._trips: dict[str, schemas.Trip] = {}

    def get_user(self, user_id: str) -> schemas.User | None:
        return self._users.get(user_id)

    def save_user(self, user: schemas.User) -> None:
        with self._lock:
            self._users[user.id] = user

    def save_trip(self, trip: schemas.Trip) -> None:
        with self._lock:
            self._trips[trip.id] = trip.model_copy(deep=True)

    def update_trip(self, trip: schemas.Trip) -> None:
        with self._lock:
            existing = self._trips.get(trip.id)
            if existing is None:
                return
            existing.name = trip.name
            existing.updated_at = trip.updated_at

    def get_trip(self, trip_id: str) -> schemas.Trip | None:
        trip = self._trips.get(trip_id)
        return trip.model_copy(deep=True) if trip else None

    def get_trip_by_share_token(self, share_token: str) -> schemas.Trip | None:
        for trip in self._trips.values():
            if trip.share_token == share_token:
                return trip.model_copy(deep=True)
        return None

    def list_trips_for_user(self, user_id: str) -> list[schemas.Trip]:
        trips = [
            trip.model_copy(deep=True)
            for trip in self._trips.values()
            if trip.user_id == user_id
        ]
        trips.sort(key=lambda trip: trip.updated_at, reverse=True)
        return trips

    def delete_trip(self, trip_id: str) -> None:
        with self._lock:
            self._trips.pop(trip_id, None)

    def add_item(self, item: schemas.TripItem) -> None:
        with self._lock:
            trip = self._trips.get(item.trip_id)
            if trip is None:
                return
            trip.items.append(item.model_copy(deep=True))

    def remove_item(self, trip_id: str, item_id: str) -> bool:
        with self._lock:
            trip = self._trips.get(trip_id)
            if trip is None:
                return False
            before = len(trip.items)
            trip.items = [item for item in trip.items if item.id != item_id]
            return len(trip.items) != before
