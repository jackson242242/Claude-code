"""Checkout: snapshot a trip's items into an immutable booking."""
from __future__ import annotations

import secrets
import string
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException

from app import schemas
from app.repositories.bookings import booking_repository
from app.services import deeplinks, payments
from app.services import trips as trips_service


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def _confirmation_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "WC-" + "".join(secrets.choice(alphabet) for _ in range(6))


def checkout_trip(user_id: str, trip_id: str) -> schemas.Booking:
    trip = trips_service.get_trip(user_id, trip_id)  # enforces ownership
    if not trip.items:
        raise HTTPException(status_code=400, detail="Cannot check out an empty trip")

    lines = [
        schemas.BookingLine(
            kind=item.kind,
            title=item.title,
            subtitle=item.subtitle,
            price_usd=item.price_usd,
            deep_link=deeplinks.deep_link_for(item),
        )
        for item in trip.items
    ]
    payment = payments.payment_gateway().charge(
        trip.total_usd, "USD", f"World Cup trip: {trip.name}"
    )
    booking = schemas.Booking(
        id=uuid.uuid4().hex,
        user_id=user_id,
        trip_id=trip.id,
        trip_name=trip.name,
        status=payment.status,
        confirmation_code=_confirmation_code(),
        currency="USD",
        total_usd=trip.total_usd,
        payment_provider=payment.provider,
        created_at=_now(),
        lines=lines,
    )
    booking_repository().save(booking)
    return booking


def list_bookings(user_id: str) -> list[schemas.BookingSummary]:
    return [
        schemas.BookingSummary(
            id=booking.id,
            trip_name=booking.trip_name,
            status=booking.status,
            confirmation_code=booking.confirmation_code,
            total_usd=booking.total_usd,
            line_count=len(booking.lines),
            created_at=booking.created_at,
        )
        for booking in booking_repository().list_for_user(user_id)
    ]


def get_booking(user_id: str, booking_id: str) -> schemas.Booking:
    booking = booking_repository().get(booking_id)
    if booking is None or booking.user_id != user_id:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking
