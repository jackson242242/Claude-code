from __future__ import annotations

from fastapi import APIRouter, Depends

from app import schemas
from app.routers.trips import current_user_id
from app.services import bookings as bookings_service

router = APIRouter(tags=["bookings"])


@router.post(
    "/trips/{trip_id}/checkout", response_model=schemas.Booking, status_code=201
)
def checkout(
    trip_id: str, user_id: str = Depends(current_user_id)
) -> schemas.Booking:
    return bookings_service.checkout_trip(user_id, trip_id)


@router.get("/bookings", response_model=list[schemas.BookingSummary])
def list_bookings(
    user_id: str = Depends(current_user_id),
) -> list[schemas.BookingSummary]:
    return bookings_service.list_bookings(user_id)


@router.get("/bookings/{booking_id}", response_model=schemas.Booking)
def get_booking(
    booking_id: str, user_id: str = Depends(current_user_id)
) -> schemas.Booking:
    return bookings_service.get_booking(user_id, booking_id)
