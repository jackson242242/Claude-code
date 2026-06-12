"""Loads the shared data tables (airline-game/data/*.json) into engine types.

Kept outside ``app/engine`` so the engine stays free of I/O.
"""
from __future__ import annotations

import json
from pathlib import Path

from app.engine.state import AircraftModel, City, World

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


def load_world(data_dir: Path | None = None) -> World:
    base = data_dir or DATA_DIR
    with open(base / "cities.json", encoding="utf-8") as fh:
        cities_raw = json.load(fh)
    with open(base / "aircraft.json", encoding="utf-8") as fh:
        aircraft_raw = json.load(fh)

    cities = {
        row["id"]: City(
            id=row["id"],
            name=row["name"],
            name_zh=row["nameZh"],
            country=row["country"],
            lat=row["lat"],
            lon=row["lon"],
            demand_index=row["demandIndex"],
            slot_fee=row["slotFee"],
            slot_capacity=row["slotCapacity"],
        )
        for row in cities_raw
    }
    aircraft_models = {
        row["id"]: AircraftModel(
            id=row["id"],
            manufacturer=row["manufacturer"],
            name=row["name"],
            seats=row["seats"],
            range_km=row["rangeKm"],
            cruise_kmh=row["cruiseKmh"],
            price=row["price"],
            fuel_kg_per_km=row["fuelKgPerKm"],
            introduced=row["introduced"],
            badge=row.get("badge"),
        )
        for row in aircraft_raw
    }
    return World(cities=cities, aircraft_models=aircraft_models)


def load_events(data_dir: Path | None = None) -> list:
    """Load and validate the static event library from events-static.json.

    Returns a list of validated GameEvent objects.  Invalid entries are
    silently skipped (CONTRACT §3 M3.1).  The caller is responsible for
    passing this pool to GameService (or to settle_turn directly in tests).
    No global state is mutated here.
    """
    # Import here to avoid circular dependency (events.py imports from state.py
    # which is pure; data.py wires I/O to the engine).
    from app.engine.events import validate_event

    base = data_dir or DATA_DIR
    events_path = base / "events-static.json"
    if not events_path.exists():
        return []

    with open(events_path, encoding="utf-8") as fh:
        raw_list = json.load(fh)

    pool = []
    for raw in raw_list:
        ev = validate_event(raw)
        if ev is not None:
            pool.append(ev)

    return pool
