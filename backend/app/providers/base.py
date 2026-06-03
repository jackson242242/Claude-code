"""Abstract provider interfaces. Routers depend only on these, so swapping a
mock for a real integration requires no changes outside this package."""
from __future__ import annotations

from abc import ABC, abstractmethod

from app import schemas


class FlightProvider(ABC):
    @abstractmethod
    def search(
        self, query: schemas.FlightSearchQuery
    ) -> list[schemas.FlightOffer]:
        raise NotImplementedError


class HotelProvider(ABC):
    @abstractmethod
    def search(
        self, query: schemas.HotelSearchQuery
    ) -> list[schemas.HotelOffer]:
        raise NotImplementedError


class TransportProvider(ABC):
    @abstractmethod
    def search(
        self, query: schemas.TransportSearchQuery
    ) -> list[schemas.TransportOffer]:
        raise NotImplementedError
