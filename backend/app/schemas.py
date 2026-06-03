"""Pydantic models. Fields are snake_case in Python but serialize to camelCase
JSON (and accept camelCase input) so the API matches the TypeScript types."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class City(CamelModel):
    id: str
    name: str
    country: str
    lat: float
    lng: float
    airports: list[str]
    transport_notes: str


class Venue(CamelModel):
    id: str
    name: str
    city_id: str
    capacity: int
    lat: float
    lng: float
    nearest_airports: list[str]


class Team(CamelModel):
    id: str
    name: str
    group: str
    confederation: str


class Match(CamelModel):
    id: str
    match_number: int
    stage: str
    group: str | None
    home_team: str
    away_team: str
    venue_id: str
    kickoff_utc: str
    kickoff_local: str
    status: str


class FlightOffer(CamelModel):
    id: str
    type: str = "flight"
    provider: str
    price_usd: float
    origin: str
    destination: str
    airline: str
    depart_utc: str
    arrive_utc: str
    duration_minutes: int
    stops: int


class HotelOffer(CamelModel):
    id: str
    type: str = "hotel"
    provider: str
    price_usd: float
    name: str
    city_id: str
    rating: int
    distance_km: float
    price_per_night_usd: float
    nights: int


class TransportOffer(CamelModel):
    id: str
    type: str = "transport"
    provider: str
    price_usd: float
    mode: str
    origin: str
    destination: str
    depart_utc: str
    arrive_utc: str
    duration_minutes: int


class FlightSearchQuery(CamelModel):
    origin: str
    destination: str
    date: str
    passengers: int = 1


class HotelSearchQuery(CamelModel):
    city_id: str
    check_in: str
    check_out: str
    guests: int = 1


class TransportSearchQuery(CamelModel):
    origin: str
    destination: str
    date: str
    mode: str | None = None
