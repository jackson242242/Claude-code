"""Deterministic mock hotel provider."""
from __future__ import annotations

from datetime import date
from urllib.parse import urlencode

from app import schemas
from app.providers.base import HotelProvider
from app.providers.util import seeded_int

HOTEL_BRANDS = [
    "Grand Plaza",
    "City Center Inn",
    "Harbor Suites",
    "Stadium View Hotel",
    "Sunset Lodge",
    "Metropolitan",
]


def _nights(check_in: str, check_out: str) -> int:
    start = date(*(int(part) for part in check_in.split("-")))
    end = date(*(int(part) for part in check_out.split("-")))
    return max(1, (end - start).days)


class MockHotelProvider(HotelProvider):
    def search(self, query: schemas.HotelSearchQuery) -> list[schemas.HotelOffer]:
        nights = _nights(query.check_in, query.check_out)
        offers: list[schemas.HotelOffer] = []
        for i in range(5):
            seed = f"{query.city_id}-{query.check_in}-{i}"
            per_night = seeded_int(seed, 90, 480)
            offers.append(
                schemas.HotelOffer(
                    id=f"htl-{seed}",
                    provider="MockStay",
                    name=HOTEL_BRANDS[i % len(HOTEL_BRANDS)],
                    city_id=query.city_id,
                    rating=seeded_int(f"{seed}-r", 3, 5),
                    distance_km=seeded_int(f"{seed}-d", 3, 250) / 10,
                    price_per_night_usd=float(per_night),
                    nights=nights,
                    price_usd=float(
                        per_night * nights * (2 if query.guests > 2 else 1)
                    ),
                    deep_link=(
                        "https://www.booking.com/searchresults.html?"
                        + urlencode({
                            "ss": HOTEL_BRANDS[i % len(HOTEL_BRANDS)],
                            "checkin": query.check_in,
                            "checkout": query.check_out,
                            "group_adults": max(1, query.guests),
                        })
                    ),
                )
            )
        return offers
