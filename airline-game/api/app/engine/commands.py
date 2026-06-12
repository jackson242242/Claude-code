"""Command validation + application (CONTRACT.md §2 `Command`, §3 rules).

Commands are applied in order; a failing command yields ``ok: false`` with a
message and does not affect the other commands (CONTRACT §1). Pure functions
over engine state; no FastAPI, no storage.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Mapping, Sequence

from app.engine import balance
from app.engine.simulate import assigned_models, mean_cruise_kmh, weekly_block_hours
from app.engine.state import (
    FleetAircraft,
    GameState,
    Route,
    World,
    ensure_active,
    find_route_between,
    get_aircraft,
    get_route,
    haversine_km,
    player_slots_used,
    pool_slots_taken,
)


class CommandError(Exception):
    """A single command failed validation; reported per-command, not raised
    out of ``apply_commands``."""


@dataclass
class CommandResult:
    index: int
    ok: bool
    message: str | None = None


def apply_commands(
    state: GameState, world: World, commands: Sequence[Mapping[str, Any]]
) -> list[CommandResult]:
    """Apply each command immediately (instant delivery in M1); a failure is
    recorded and the remaining commands still run."""
    ensure_active(state)
    results: list[CommandResult] = []
    for index, command in enumerate(commands):
        try:
            _apply_one(state, world, command)
            results.append(CommandResult(index=index, ok=True))
        except CommandError as exc:
            results.append(CommandResult(index=index, ok=False, message=str(exc)))
    return results


def _apply_one(state: GameState, world: World, command: Mapping[str, Any]) -> None:
    if not isinstance(command, Mapping):
        raise CommandError("command must be an object")
    command_type = command.get("type")
    handler = _HANDLERS.get(command_type)
    if handler is None:
        raise CommandError(f"unknown command type: {command_type!r}")
    handler(state, world, command)


# --- Field helpers -----------------------------------------------------------


def _require_str(command: Mapping[str, Any], key: str) -> str:
    value = command.get(key)
    if not isinstance(value, str) or not value:
        raise CommandError(f"missing or invalid field: {key}")
    return value


def _optional_number(command: Mapping[str, Any], key: str) -> float | None:
    value = command.get(key)
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise CommandError(f"field {key} must be a number")
    return float(value)


def _require_model(world: World, model_id: str):
    model = world.aircraft_models.get(model_id)
    if model is None:
        raise CommandError(f"unknown aircraft model: {model_id}")
    return model


def _require_city(world: World, city_id: str):
    city = world.cities.get(city_id)
    if city is None:
        raise CommandError(f"unknown city: {city_id}")
    return city


def _require_aircraft(state: GameState, aircraft_id: str) -> FleetAircraft:
    aircraft = get_aircraft(state, aircraft_id)
    if aircraft is None:
        raise CommandError(f"unknown aircraft: {aircraft_id}")
    return aircraft


def _require_route(state: GameState, route_id: str) -> Route:
    route = get_route(state, route_id)
    if route is None:
        raise CommandError(f"unknown route: {route_id}")
    return route


def _unassign(state: GameState, aircraft: FleetAircraft) -> None:
    if aircraft.route_id is not None:
        route = get_route(state, aircraft.route_id)
        if route is not None and aircraft.id in route.aircraft_ids:
            route.aircraft_ids.remove(aircraft.id)
        aircraft.route_id = None


def _add_aircraft(state: GameState, model_id: str, ownership: str) -> FleetAircraft:
    aircraft = FleetAircraft(
        id=f"ac-{state.next_aircraft_seq}", model_id=model_id, ownership=ownership
    )
    state.next_aircraft_seq += 1
    state.fleet.append(aircraft)
    return aircraft


# --- Handlers ----------------------------------------------------------------


def _buy_aircraft(state: GameState, world: World, command: Mapping[str, Any]) -> None:
    model = _require_model(world, _require_str(command, "modelId"))
    if state.cash < model.price:
        raise CommandError(
            f"insufficient cash: {model.name} costs ${model.price:,.0f}, "
            f"cash is ${state.cash:,.2f}"
        )
    state.cash = round(state.cash - model.price, 2)
    _add_aircraft(state, model.id, "owned")


def _lease_aircraft(state: GameState, world: World, command: Mapping[str, Any]) -> None:
    model = _require_model(world, _require_str(command, "modelId"))
    _add_aircraft(state, model.id, "leased")


def _sell_aircraft(state: GameState, world: World, command: Mapping[str, Any]) -> None:
    aircraft = _require_aircraft(state, _require_str(command, "aircraftId"))
    if aircraft.ownership != "owned":
        raise CommandError(f"aircraft {aircraft.id} is leased; use returnLease")
    _unassign(state, aircraft)
    model = world.aircraft_models[aircraft.model_id]
    state.cash = round(state.cash + model.price * balance.SELL_VALUE_RATIO, 2)
    state.fleet.remove(aircraft)


def _return_lease(state: GameState, world: World, command: Mapping[str, Any]) -> None:
    aircraft = _require_aircraft(state, _require_str(command, "aircraftId"))
    if aircraft.ownership != "leased":
        raise CommandError(f"aircraft {aircraft.id} is owned; use sellAircraft")
    _unassign(state, aircraft)
    state.fleet.remove(aircraft)


def _negotiate_slot(state: GameState, world: World, command: Mapping[str, Any]) -> None:
    """negotiateSlot (CONTRACT §3, M2.2): deterministic, no RNG. Failure checks
    in contract order — per-city per-turn cooldown, pool full, insufficient
    cash — then cost = slotFee × SLOT_COST_MULT × (1 + taken/capacity)."""
    city = _require_city(world, _require_str(command, "cityId"))
    if state.last_negotiation_turn.get(city.id) == state.turn:
        raise CommandError(
            f"already negotiated a slot at {city.id} this turn "
            "(one negotiation per city per turn); try again next quarter"
        )
    taken = pool_slots_taken(state, city.id)
    if taken >= city.slot_capacity:
        raise CommandError(
            f"slot pool at {city.id} is full ({taken}/{city.slot_capacity}); "
            "no slots left to negotiate"
        )
    cost = round(
        city.slot_fee * balance.SLOT_COST_MULT * (1 + taken / city.slot_capacity), 2
    )
    if state.cash < cost:
        raise CommandError(
            f"insufficient cash: a slot at {city.id} costs ${cost:,.2f}, "
            f"cash is ${state.cash:,.2f}"
        )
    state.cash = round(state.cash - cost, 2)
    state.slots_held[city.id] = state.slots_held.get(city.id, 0) + 1
    state.last_negotiation_turn[city.id] = state.turn


def _open_route(state: GameState, world: World, command: Mapping[str, Any]) -> None:
    city_a = _require_city(world, _require_str(command, "cityA"))
    city_b = _require_city(world, _require_str(command, "cityB"))
    if city_a.id == city_b.id:
        raise CommandError("a route needs two distinct cities")
    if state.hq_city_id not in (city_a.id, city_b.id):
        raise CommandError(
            f"one endpoint must be the HQ ({state.hq_city_id}) in M1 hub-and-spoke"
        )
    if find_route_between(state, city_a.id, city_b.id) is not None:
        raise CommandError(f"route between {city_a.id} and {city_b.id} already exists")
    # M2.2: a route occupies 1 held slot at each end — both endpoints need a
    # free held slot (playerHeld − playerUsed ≥ 1) before the route can open.
    for city in (city_a, city_b):
        held = state.slots_held.get(city.id, 0)
        used = player_slots_used(state, city.id)
        if held - used < 1:
            raise CommandError(
                f"no free held slot at {city.id} ({used} used of {held} held); "
                f"negotiate a slot there first (negotiateSlot {city.id})"
            )
    route = Route(
        id=f"rt-{state.next_route_seq}",
        city_a=city_a.id,
        city_b=city_b.id,
        distance_km=round(
            haversine_km(city_a.lat, city_a.lon, city_b.lat, city_b.lon), 1
        ),
    )
    state.next_route_seq += 1
    state.routes.append(route)


def _close_route(state: GameState, world: World, command: Mapping[str, Any]) -> None:
    # M2.2: closing frees the slot *usage* at both ends (usage is derived from
    # state.routes) while the held slots stay with the player for reuse.
    route = _require_route(state, _require_str(command, "routeId"))
    for aircraft_id in list(route.aircraft_ids):
        aircraft = get_aircraft(state, aircraft_id)
        if aircraft is not None:
            aircraft.route_id = None
    state.routes.remove(route)


def _assign_aircraft(state: GameState, world: World, command: Mapping[str, Any]) -> None:
    aircraft = _require_aircraft(state, _require_str(command, "aircraftId"))
    route_id = command.get("routeId")
    if route_id is None:
        _unassign(state, aircraft)
        return
    if not isinstance(route_id, str):
        raise CommandError("field routeId must be a string or null")
    route = _require_route(state, route_id)
    model = world.aircraft_models[aircraft.model_id]
    if model.range_km < route.distance_km:
        raise CommandError(
            f"{model.name} range {model.range_km:,.0f} km is short of the "
            f"{route.distance_km:,.0f} km route"
        )
    _unassign(state, aircraft)
    route.aircraft_ids.append(aircraft.id)
    aircraft.route_id = route.id


def _update_route(state: GameState, world: World, command: Mapping[str, Any]) -> None:
    route = _require_route(state, _require_str(command, "routeId"))
    weekly_flights = _optional_number(command, "weeklyFlights")
    fare_mult = _optional_number(command, "fareMult")

    if weekly_flights is not None and weekly_flights <= 0:
        raise CommandError("weeklyFlights must be positive")
    if fare_mult is not None and not (
        balance.FARE_MULT_MIN <= fare_mult <= balance.FARE_MULT_MAX
    ):
        raise CommandError(
            f"fareMult must be between {balance.FARE_MULT_MIN} and {balance.FARE_MULT_MAX}"
        )

    if weekly_flights is not None:
        # Utilization cap (CONTRACT §3): weeklyFlights × 2 × (d/cruise + 0.6)
        # ≤ 84 × nAircraft, checked against the currently assigned aircraft.
        n_aircraft = len(route.aircraft_ids)
        if n_aircraft > 0:
            models = assigned_models(state, route, world)
            hours = weekly_block_hours(
                route.distance_km, mean_cruise_kmh(models), weekly_flights
            )
            cap = balance.MAX_WEEKLY_BLOCK_HOURS_PER_AIRCRAFT * n_aircraft
            if hours > cap:
                raise CommandError(
                    f"utilization cap exceeded: {hours:,.1f} weekly block hours "
                    f"> {cap:,.1f} (84 h × {n_aircraft} aircraft)"
                )
        route.weekly_flights = weekly_flights
    if fare_mult is not None:
        route.fare_mult = fare_mult


_HANDLERS: dict[str, Callable[[GameState, World, Mapping[str, Any]], None]] = {
    "buyAircraft": _buy_aircraft,
    "leaseAircraft": _lease_aircraft,
    "sellAircraft": _sell_aircraft,
    "returnLease": _return_lease,
    "negotiateSlot": _negotiate_slot,
    "openRoute": _open_route,
    "closeRoute": _close_route,
    "assignAircraft": _assign_aircraft,
    "updateRoute": _update_route,
}
