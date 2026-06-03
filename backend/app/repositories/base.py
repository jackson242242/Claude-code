"""Abstract trip persistence interface."""
from __future__ import annotations

from abc import ABC, abstractmethod

from app import schemas


class TripRepository(ABC):
    @abstractmethod
    def get_user(self, user_id: str) -> schemas.User | None:
        raise NotImplementedError

    @abstractmethod
    def save_user(self, user: schemas.User) -> None:
        raise NotImplementedError

    @abstractmethod
    def save_trip(self, trip: schemas.Trip) -> None:
        raise NotImplementedError

    @abstractmethod
    def update_trip(self, trip: schemas.Trip) -> None:
        """Persist mutable trip fields (name, updated_at)."""
        raise NotImplementedError

    @abstractmethod
    def get_trip(self, trip_id: str) -> schemas.Trip | None:
        raise NotImplementedError

    @abstractmethod
    def get_trip_by_share_token(self, share_token: str) -> schemas.Trip | None:
        raise NotImplementedError

    @abstractmethod
    def list_trips_for_user(self, user_id: str) -> list[schemas.Trip]:
        raise NotImplementedError

    @abstractmethod
    def delete_trip(self, trip_id: str) -> None:
        raise NotImplementedError

    @abstractmethod
    def add_item(self, item: schemas.TripItem) -> None:
        raise NotImplementedError

    @abstractmethod
    def remove_item(self, trip_id: str, item_id: str) -> bool:
        raise NotImplementedError
