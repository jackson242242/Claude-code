"""Geo helpers: great-circle distance and nearest host cities."""
from __future__ import annotations

import math

from app import schemas
from app.services import schedule as schedule_service

_EARTH_RADIUS_KM = 6371.0


def distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return round(2 * _EARTH_RADIUS_KM * math.asin(math.sqrt(a)), 1)


def nearby_cities(city_id: str, limit: int = 3) -> list[schemas.NearbyCity]:
    cities = schedule_service.list_cities()
    target = next((city for city in cities if city.id == city_id), None)
    if target is None:
        return []
    others = [
        schemas.NearbyCity(
            id=city.id,
            name=city.name,
            country=city.country,
            distance_km=distance_km(target.lat, target.lng, city.lat, city.lng),
        )
        for city in cities
        if city.id != city_id
    ]
    others.sort(key=lambda city: city.distance_km)
    return others[: max(0, limit)]
