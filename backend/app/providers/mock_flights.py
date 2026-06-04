"""Deterministic mock flight provider."""
from __future__ import annotations

from urllib.parse import urlencode

from app import schemas
from app.providers.base import FlightProvider
from app.providers.util import leg, seeded_int

AIRLINES = ["Aeromexico", "United", "Delta", "Air Canada", "American", "JetBlue"]


class MockFlightProvider(FlightProvider):
    def search(
        self, query: schemas.FlightSearchQuery
    ) -> list[schemas.FlightOffer]:
        offers: list[schemas.FlightOffer] = []
        for i in range(5):
            seed = f"{query.origin}-{query.destination}-{query.date}-{i}"
            duration = seeded_int(seed, 75, 360)
            stops = seeded_int(f"{seed}-stops", 0, 2)
            depart_utc, arrive_utc = leg(
                query.date, 6 + seeded_int(seed, 0, 12), duration
            )
            offers.append(
                schemas.FlightOffer(
                    id=f"flt-{seed}",
                    provider="MockAir",
                    airline=AIRLINES[seeded_int(seed, 0, len(AIRLINES) - 1)],
                    origin=query.origin.upper(),
                    destination=query.destination.upper(),
                    depart_utc=depart_utc,
                    arrive_utc=arrive_utc,
                    duration_minutes=duration,
                    stops=stops,
                    price_usd=float(
                        seeded_int(seed, 120, 900) * max(1, query.passengers)
                    ),
                    deep_link=(
                        f"https://www.kayak.com/flights/"
                        f"{query.origin.upper()}-{query.destination.upper()}/"
                        f"{query.date}/{max(1, query.passengers)}adults"
                    ),
                )
            )
        return offers
