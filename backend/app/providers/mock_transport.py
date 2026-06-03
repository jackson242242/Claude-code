"""Deterministic mock transport provider."""
from __future__ import annotations

from app import schemas
from app.providers.base import TransportProvider
from app.providers.util import leg, seeded_int

TRANSPORT_MODES = ["train", "bus", "rideshare", "shuttle", "car-rental"]


class MockTransportProvider(TransportProvider):
    def search(
        self, query: schemas.TransportSearchQuery
    ) -> list[schemas.TransportOffer]:
        modes = [
            mode
            for mode in TRANSPORT_MODES
            if query.mode is None or mode == query.mode
        ]
        offers: list[schemas.TransportOffer] = []
        for i, mode in enumerate(modes):
            seed = f"{query.origin}-{query.destination}-{query.date}-{mode}"
            duration = seeded_int(seed, 30, 600)
            depart_utc, arrive_utc = leg(query.date, 7 + i, duration)
            offers.append(
                schemas.TransportOffer(
                    id=f"trn-{seed}",
                    provider="MockMove",
                    mode=mode,
                    origin=query.origin,
                    destination=query.destination,
                    depart_utc=depart_utc,
                    arrive_utc=arrive_utc,
                    duration_minutes=duration,
                    price_usd=float(seeded_int(seed, 15, 350)),
                )
            )
        return offers
