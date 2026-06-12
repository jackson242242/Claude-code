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
