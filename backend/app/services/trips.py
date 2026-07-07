"""Trip / itinerary business logic.

Wraps the trip repository with ownership checks, derived totals, and an
itinerary "suggestions" engine that turns the matches in a trip into suggested
city hotel stays and inter-city travel legs using the provider adapters.
"""
from __future__ import annotations

import secrets
import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException

from app import schemas
from app.providers import registry as providers
from app.repositories.registry import trip_repository
from app.services import schedule as schedule_service


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def _new_id() -> str:
    return uuid.uuid4().hex


def _finalize(trip: schemas.Trip) -> schemas.Trip:
    trip.item_count = len(trip.items)
    trip.total_usd = round(sum(item.price_usd for item in trip.items), 2)
    trip.items.sort(key=lambda item: (item.starts_at or "", item.created_at))
    return trip


def _summary(trip: schemas.Trip) -> schemas.TripSummary:
    return schemas.TripSummary(
        id=trip.id,
        name=trip.name,
        share_token=trip.share_token,
        item_count=len(trip.items),
        total_usd=round(sum(item.price_usd for item in trip.items), 2),
        updated_at=trip.updated_at,
    )


# --- users ----------------------------------------------------------------

def get_or_create_user(user_id: str) -> schemas.User:
    repo = trip_repository()
    user = repo.get_user(user_id)
    if user is None:
        user = schemas.User(
            id=user_id,
            display_name=f"Guest {user_id[:6]}",
            created_at=_now(),
        )
        repo.save_user(user)
    return user


# --- trips ----------------------------------------------------------------

def list_trips(user_id: str) -> list[schemas.TripSummary]:
    get_or_create_user(user_id)
    return [_summary(trip) for trip in trip_repository().list_trips_for_user(user_id)]


def create_trip(user_id: str, name: str) -> schemas.Trip:
    get_or_create_user(user_id)
    now = _now()
    trip = schemas.Trip(
        id=_new_id(),
        user_id=user_id,
        name=name.strip() or "My World Cup trip",
        share_token=secrets.token_urlsafe(9),
        created_at=now,
        updated_at=now,
    )
    trip_repository().save_trip(trip)
    return _finalize(trip)


def _owned_trip(user_id: str, trip_id: str) -> schemas.Trip:
    trip = trip_repository().get_trip(trip_id)
    if trip is None or trip.user_id != user_id:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def get_trip(user_id: str, trip_id: str) -> schemas.Trip:
    return _finalize(_owned_trip(user_id, trip_id))


def rename_trip(user_id: str, trip_id: str, name: str) -> schemas.Trip:
    trip = _owned_trip(user_id, trip_id)
    trip.name = name.strip() or trip.name
    trip.updated_at = _now()
    trip_repository().update_trip(trip)
    return _finalize(trip)


def delete_trip(user_id: str, trip_id: str) -> None:
    _owned_trip(user_id, trip_id)
    trip_repository().delete_trip(trip_id)


def get_shared_trip(share_token: str) -> schemas.SharedTrip:
    trip = trip_repository().get_trip_by_share_token(share_token)
    if trip is None:
        raise HTTPException(status_code=404, detail="Shared trip not found")
    trip = _finalize(trip)
    # Project to the public shape — never expose user_id (the auth credential)
    # or the share_token itself through the public link.
    return schemas.SharedTrip(
        id=trip.id,
        name=trip.name,
        items=trip.items,
        item_count=trip.item_count,
        total_usd=trip.total_usd,
    )


# --- items ----------------------------------------------------------------

def add_item(
    user_id: str, trip_id: str, request: schemas.AddTripItemRequest
) -> schemas.Trip:
    trip = _owned_trip(user_id, trip_id)
    repo = trip_repository()
    item = schemas.TripItem(
        id=_new_id(),
        trip_id=trip_id,
        kind=request.kind,
        match_id=request.match_id,
        city_id=request.city_id,
        title=request.title,
        subtitle=request.subtitle,
        price_usd=request.price_usd,
        starts_at=request.starts_at,
        sort_order=len(trip.items),
        payload=request.payload,
        created_at=_now(),
    )
    repo.add_item(item)
    trip.updated_at = _now()
    repo.update_trip(trip)
    return get_trip(user_id, trip_id)


def remove_item(user_id: str, trip_id: str, item_id: str) -> schemas.Trip:
    _owned_trip(user_id, trip_id)
    repo = trip_repository()
    if not repo.remove_item(trip_id, item_id):
        raise HTTPException(status_code=404, detail="Trip item not found")
    refreshed = trip_repository().get_trip(trip_id)
    if refreshed is not None:
        refreshed.updated_at = _now()
        repo.update_trip(refreshed)
    return get_trip(user_id, trip_id)


# --- itinerary suggestions ------------------------------------------------

def _add_day(ymd: str) -> str:
    year, month, day = (int(part) for part in ymd.split("-"))
    return (date(year, month, day) + timedelta(days=1)).isoformat()


def _diff_days(start: str, end: str) -> int:
    sy, sm, sd = (int(part) for part in start.split("-"))
    ey, em, ed = (int(part) for part in end.split("-"))
    return (date(ey, em, ed) - date(sy, sm, sd)).days


def suggest_itinerary(user_id: str, trip_id: str) -> schemas.TripSuggestions:
    trip = _owned_trip(user_id, trip_id)

    # One schedule/city load for the whole suggestion pass — per-item
    # get_match/get_city calls would re-read the full dataset every time.
    match_by_id = {match.id: match for match in schedule_service.list_matches()}
    city_by_id = {city.id: city for city in schedule_service.list_cities()}

    matches = []
    for item in trip.items:
        if item.kind == "match" and item.match_id:
            match = match_by_id.get(item.match_id)
            if match is not None:
                matches.append(match)
    matches.sort(key=lambda match: match.kickoff_utc)

    # Collapse consecutive matches in the same city into a single stay.
    grouped: list[dict[str, object]] = []
    for match in matches:
        local_date = match.kickoff_local[:10]
        if grouped and grouped[-1]["city_id"] == match.venue_id:
            dates = grouped[-1]["dates"]
            assert isinstance(dates, list)
            dates.append(local_date)
        else:
            grouped.append({"city_id": match.venue_id, "dates": [local_date]})

    hotel_provider = providers.hotel_provider()
    flight_provider = providers.flight_provider()
    transport_provider = providers.transport_provider()

    city_stays: list[schemas.CityStay] = []
    for group in grouped:
        city_id = str(group["city_id"])
        dates = group["dates"]
        assert isinstance(dates, list)
        city = city_by_id.get(city_id)
        check_in = min(dates)
        check_out = _add_day(max(dates))
        hotels = hotel_provider.search(
            schemas.HotelSearchQuery(
                city_id=city_id, check_in=check_in, check_out=check_out, guests=2
            )
        )
        city_stays.append(
            schemas.CityStay(
                city_id=city_id,
                city_name=city.name if city else city_id,
                check_in=check_in,
                check_out=check_out,
                nights=max(1, _diff_days(check_in, check_out)),
                hotel=hotels[0] if hotels else None,
            )
        )

    legs: list[schemas.TravelLeg] = []
    for index in range(1, len(grouped)):
        previous = grouped[index - 1]
        current = grouped[index]
        from_city = city_by_id.get(str(previous["city_id"]))
        to_city = city_by_id.get(str(current["city_id"]))
        current_dates = current["dates"]
        assert isinstance(current_dates, list)
        travel_date = min(current_dates)

        flight = None
        if from_city and to_city and from_city.airports and to_city.airports:
            flights = flight_provider.search(
                schemas.FlightSearchQuery(
                    origin=from_city.airports[0],
                    destination=to_city.airports[0],
                    date=travel_date,
                    passengers=1,
                )
            )
            flight = flights[0] if flights else None

        transports = transport_provider.search(
            schemas.TransportSearchQuery(
                origin=from_city.name if from_city else str(previous["city_id"]),
                destination=to_city.name if to_city else str(current["city_id"]),
                date=travel_date,
            )
        )

        legs.append(
            schemas.TravelLeg(
                from_city_id=str(previous["city_id"]),
                from_city_name=from_city.name if from_city else str(previous["city_id"]),
                to_city_id=str(current["city_id"]),
                to_city_name=to_city.name if to_city else str(current["city_id"]),
                date=travel_date,
                flight=flight,
                transport=transports[0] if transports else None,
            )
        )

    return schemas.TripSuggestions(city_stays=city_stays, legs=legs)
