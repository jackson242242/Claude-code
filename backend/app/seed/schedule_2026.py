"""The real 2026 World Cup host data plus a deterministically generated
104-match schedule. The generation algorithm mirrors the TypeScript mock layer
(src/mocks/matches.ts) so the API and the frontend fallback agree.

Venues, kickoff dates and knockout pairings are representative for this
foundation build; the tournament window, the Mexico City opener and the MetLife
final are accurate. Reconcile fixture details with the official FIFA schedule
before production use.
"""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any

CITIES: list[dict[str, Any]] = [
    {"id": "mexico-city", "name": "Mexico City", "country": "Mexico", "lat": 19.303, "lng": -99.15, "airports": ["MEX", "NLU"], "transport_notes": "Metro Línea 2 and Metrobús connect central Mexico City to Estadio Azteca."},
    {"id": "guadalajara", "name": "Guadalajara", "country": "Mexico", "lat": 20.681, "lng": -103.463, "airports": ["GDL"], "transport_notes": "Mi Macro Periférico BRT and rideshare serve Estadio Akron in Zapopan."},
    {"id": "monterrey", "name": "Monterrey", "country": "Mexico", "lat": 25.669, "lng": -100.244, "airports": ["MTY"], "transport_notes": "Rideshare and event shuttles are the main options to Estadio BBVA."},
    {"id": "atlanta", "name": "Atlanta", "country": "USA", "lat": 33.755, "lng": -84.401, "airports": ["ATL"], "transport_notes": "MARTA rail links the airport directly to Mercedes-Benz Stadium."},
    {"id": "boston", "name": "Boston", "country": "USA", "lat": 42.091, "lng": -71.264, "airports": ["BOS"], "transport_notes": "Special-event commuter rail runs from Boston to Foxborough on match days."},
    {"id": "dallas", "name": "Dallas", "country": "USA", "lat": 32.747, "lng": -97.093, "airports": ["DFW", "DAL"], "transport_notes": "No rail to Arlington; use event shuttles or rideshare."},
    {"id": "houston", "name": "Houston", "country": "USA", "lat": 29.685, "lng": -95.411, "airports": ["IAH", "HOU"], "transport_notes": "METRORail Red Line and park-and-ride buses serve NRG Stadium."},
    {"id": "kansas-city", "name": "Kansas City", "country": "USA", "lat": 39.049, "lng": -94.484, "airports": ["MCI"], "transport_notes": "Transit is limited; rideshare and event shuttles reach Arrowhead Stadium."},
    {"id": "los-angeles", "name": "Los Angeles", "country": "USA", "lat": 33.953, "lng": -118.339, "airports": ["LAX"], "transport_notes": "Metro K Line and shuttles serve SoFi Stadium in Inglewood."},
    {"id": "miami", "name": "Miami", "country": "USA", "lat": 25.958, "lng": -80.239, "airports": ["MIA", "FLL"], "transport_notes": "Tri-Rail plus event shuttles connect to Hard Rock Stadium."},
    {"id": "new-york", "name": "New York / New Jersey", "country": "USA", "lat": 40.814, "lng": -74.074, "airports": ["EWR", "JFK", "LGA"], "transport_notes": "NJ Transit rail runs to the Meadowlands / MetLife Stadium on event days."},
    {"id": "philadelphia", "name": "Philadelphia", "country": "USA", "lat": 39.901, "lng": -75.168, "airports": ["PHL"], "transport_notes": "SEPTA Broad Street Line runs directly to the stadium complex."},
    {"id": "san-francisco", "name": "San Francisco Bay Area", "country": "USA", "lat": 37.403, "lng": -121.97, "airports": ["SFO", "SJC", "OAK"], "transport_notes": "VTA light rail and Caltrain serve Levi's Stadium in Santa Clara."},
    {"id": "seattle", "name": "Seattle", "country": "USA", "lat": 47.595, "lng": -122.331, "airports": ["SEA"], "transport_notes": "Link light rail connects Sea-Tac airport to Lumen Field downtown."},
    {"id": "toronto", "name": "Toronto", "country": "Canada", "lat": 43.633, "lng": -79.418, "airports": ["YYZ"], "transport_notes": "TTC streetcar and GO Transit serve BMO Field at Exhibition Place."},
    {"id": "vancouver", "name": "Vancouver", "country": "Canada", "lat": 49.277, "lng": -123.112, "airports": ["YVR"], "transport_notes": "SkyTrain connects YVR airport to BC Place downtown."},
]

VENUES: list[dict[str, Any]] = [
    {"id": "mexico-city", "name": "Estadio Azteca", "city_id": "mexico-city", "capacity": 83264, "lat": 19.303, "lng": -99.15, "nearest_airports": ["MEX", "NLU"]},
    {"id": "guadalajara", "name": "Estadio Akron", "city_id": "guadalajara", "capacity": 46232, "lat": 20.681, "lng": -103.463, "nearest_airports": ["GDL"]},
    {"id": "monterrey", "name": "Estadio BBVA", "city_id": "monterrey", "capacity": 53500, "lat": 25.669, "lng": -100.244, "nearest_airports": ["MTY"]},
    {"id": "atlanta", "name": "Mercedes-Benz Stadium", "city_id": "atlanta", "capacity": 71000, "lat": 33.755, "lng": -84.401, "nearest_airports": ["ATL"]},
    {"id": "boston", "name": "Gillette Stadium", "city_id": "boston", "capacity": 65878, "lat": 42.091, "lng": -71.264, "nearest_airports": ["BOS"]},
    {"id": "dallas", "name": "AT&T Stadium", "city_id": "dallas", "capacity": 80000, "lat": 32.747, "lng": -97.093, "nearest_airports": ["DFW", "DAL"]},
    {"id": "houston", "name": "NRG Stadium", "city_id": "houston", "capacity": 72220, "lat": 29.685, "lng": -95.411, "nearest_airports": ["IAH", "HOU"]},
    {"id": "kansas-city", "name": "Arrowhead Stadium", "city_id": "kansas-city", "capacity": 76416, "lat": 39.049, "lng": -94.484, "nearest_airports": ["MCI"]},
    {"id": "los-angeles", "name": "SoFi Stadium", "city_id": "los-angeles", "capacity": 70240, "lat": 33.953, "lng": -118.339, "nearest_airports": ["LAX"]},
    {"id": "miami", "name": "Hard Rock Stadium", "city_id": "miami", "capacity": 65326, "lat": 25.958, "lng": -80.239, "nearest_airports": ["MIA", "FLL"]},
    {"id": "new-york", "name": "MetLife Stadium", "city_id": "new-york", "capacity": 82500, "lat": 40.814, "lng": -74.074, "nearest_airports": ["EWR", "JFK", "LGA"]},
    {"id": "philadelphia", "name": "Lincoln Financial Field", "city_id": "philadelphia", "capacity": 69596, "lat": 39.901, "lng": -75.168, "nearest_airports": ["PHL"]},
    {"id": "san-francisco", "name": "Levi's Stadium", "city_id": "san-francisco", "capacity": 68500, "lat": 37.403, "lng": -121.97, "nearest_airports": ["SFO", "SJC", "OAK"]},
    {"id": "seattle", "name": "Lumen Field", "city_id": "seattle", "capacity": 68740, "lat": 47.595, "lng": -122.331, "nearest_airports": ["SEA"]},
    {"id": "toronto", "name": "BMO Field", "city_id": "toronto", "capacity": 45000, "lat": 43.633, "lng": -79.418, "nearest_airports": ["YYZ"]},
    {"id": "vancouver", "name": "BC Place", "city_id": "vancouver", "capacity": 54500, "lat": 49.277, "lng": -123.112, "nearest_airports": ["YVR"]},
]

GROUP_TEAMS: dict[str, list[str]] = {
    "A": ["Mexico", "Argentina", "Croatia", "Saudi Arabia"],
    "B": ["Canada", "Brazil", "Belgium", "Morocco"],
    "C": ["France", "Switzerland", "Senegal", "Qatar"],
    "D": ["USA", "Netherlands", "Tunisia", "Iran"],
    "E": ["England", "Denmark", "Algeria", "Iraq"],
    "F": ["Spain", "Poland", "Nigeria", "UAE"],
    "G": ["Portugal", "Serbia", "Ghana", "Japan"],
    "H": ["Germany", "Austria", "Egypt", "Korea Republic"],
    "I": ["Uruguay", "Ukraine", "Ivory Coast", "Australia"],
    "J": ["Colombia", "Wales", "Cameroon", "Ecuador"],
    "K": ["Italy", "Scotland", "Turkey", "Greece"],
    "L": ["Norway", "Sweden", "Czechia", "Hungary"],
}

CONFEDERATIONS: dict[str, str] = {
    "Mexico": "CONCACAF", "USA": "CONCACAF", "Canada": "CONCACAF",
    "Argentina": "CONMEBOL", "Brazil": "CONMEBOL", "Uruguay": "CONMEBOL", "Colombia": "CONMEBOL", "Ecuador": "CONMEBOL",
    "France": "UEFA", "England": "UEFA", "Spain": "UEFA", "Portugal": "UEFA", "Germany": "UEFA", "Netherlands": "UEFA",
    "Belgium": "UEFA", "Croatia": "UEFA", "Italy": "UEFA", "Switzerland": "UEFA", "Denmark": "UEFA", "Poland": "UEFA",
    "Serbia": "UEFA", "Austria": "UEFA", "Ukraine": "UEFA", "Wales": "UEFA", "Scotland": "UEFA", "Turkey": "UEFA",
    "Norway": "UEFA", "Sweden": "UEFA", "Czechia": "UEFA", "Hungary": "UEFA", "Greece": "UEFA",
    "Japan": "AFC", "Korea Republic": "AFC", "Australia": "AFC", "Iran": "AFC", "Saudi Arabia": "AFC",
    "Qatar": "AFC", "Iraq": "AFC", "UAE": "AFC",
    "Morocco": "CAF", "Senegal": "CAF", "Tunisia": "CAF", "Algeria": "CAF", "Nigeria": "CAF", "Ghana": "CAF",
    "Egypt": "CAF", "Ivory Coast": "CAF", "Cameroon": "CAF",
}

VENUE_ORDER = [
    "mexico-city", "atlanta", "boston", "dallas", "houston", "kansas-city",
    "los-angeles", "miami", "new-york", "philadelphia", "san-francisco",
    "seattle", "toronto", "vancouver", "guadalajara", "monterrey",
]

CITY_UTC_OFFSET: dict[str, int] = {
    "mexico-city": -6, "guadalajara": -6, "monterrey": -6,
    "atlanta": -4, "boston": -4, "miami": -4, "new-york": -4, "philadelphia": -4, "toronto": -4,
    "dallas": -5, "houston": -5, "kansas-city": -5,
    "los-angeles": -7, "san-francisco": -7, "seattle": -7, "vancouver": -7,
}

GROUP_LETTERS = list("ABCDEFGHIJKL")
GROUP_KICKOFF_HOURS = [13, 16, 19, 22]
ROUND_ROBIN = [(0, 1), (2, 3), (0, 2), (1, 3), (0, 3), (1, 2)]
STAGE_DAY_BASE = {
    "Round of 32": 17, "Round of 16": 23, "Quarter-final": 28,
    "Semi-final": 33, "Third-place": 37, "Final": 38,
}
_BASE = datetime(2026, 6, 11, tzinfo=timezone.utc)


def slugify(name: str) -> str:
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", name.lower()))


def _build_kickoff(day_offset: int, hour_local: int, venue_id: str) -> tuple[str, str]:
    offset = CITY_UTC_OFFSET.get(venue_id, 0)
    local_dt = _BASE + timedelta(days=day_offset, hours=hour_local)
    kickoff_local = local_dt.strftime("%Y-%m-%dT%H:00:00")
    utc_dt = local_dt - timedelta(hours=offset)
    kickoff_utc = utc_dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    return kickoff_local, kickoff_utc


def _build_teams() -> list[dict[str, Any]]:
    teams: list[dict[str, Any]] = []
    for group, names in GROUP_TEAMS.items():
        for name in names:
            teams.append({
                "id": slugify(name),
                "name": name,
                "group": group,
                "confederation": CONFEDERATIONS.get(name, "UEFA"),
            })
    return teams


def _build_knockouts() -> list[dict[str, str]]:
    knockouts: list[dict[str, str]] = []
    for i in range(16):
        knockouts.append({
            "stage": "Round of 32",
            "home": f"Winner Group {GROUP_LETTERS[i % 12]}",
            "away": f"Runner-up Group {GROUP_LETTERS[(i + 6) % 12]}",
        })
    for i in range(8):
        knockouts.append({"stage": "Round of 16", "home": f"Winner R32-{2 * i + 1}", "away": f"Winner R32-{2 * i + 2}"})
    for i in range(4):
        knockouts.append({"stage": "Quarter-final", "home": f"Winner R16-{2 * i + 1}", "away": f"Winner R16-{2 * i + 2}"})
    for i in range(2):
        knockouts.append({"stage": "Semi-final", "home": f"Winner QF-{2 * i + 1}", "away": f"Winner QF-{2 * i + 2}"})
    knockouts.append({"stage": "Third-place", "home": "Loser SF-1", "away": "Loser SF-2"})
    knockouts.append({"stage": "Final", "home": "Winner SF-1", "away": "Winner SF-2"})
    return knockouts


def _build_matches() -> list[dict[str, Any]]:
    matches: list[dict[str, Any]] = []
    index = 0

    for group in GROUP_LETTERS:
        names = GROUP_TEAMS[group]
        for home, away in ROUND_ROBIN:
            venue_id = "mexico-city" if index == 0 else VENUE_ORDER[index % len(VENUE_ORDER)]
            day_offset = index // 5
            hour_local = GROUP_KICKOFF_HOURS[index % len(GROUP_KICKOFF_HOURS)]
            kickoff_local, kickoff_utc = _build_kickoff(day_offset, hour_local, venue_id)
            matches.append({
                "id": f"M{index + 1}", "match_number": index + 1, "stage": "Group Stage",
                "group": group, "home_team": names[home], "away_team": names[away],
                "venue_id": venue_id, "kickoff_utc": kickoff_utc, "kickoff_local": kickoff_local,
                "status": "scheduled",
            })
            index += 1

    stage_count: dict[str, int] = {}
    for knockout in _build_knockouts():
        stage = knockout["stage"]
        seen = stage_count.get(stage, 0)
        stage_count[stage] = seen + 1

        venue_id = VENUE_ORDER[index % len(VENUE_ORDER)]
        if stage == "Final":
            venue_id = "new-york"
        elif stage == "Third-place":
            venue_id = "miami"

        per_day = 3 if stage == "Round of 32" else 2
        day_offset = STAGE_DAY_BASE[stage] + (seen // per_day)
        hour_local = 15 if stage == "Final" else [16, 19][seen % 2]
        kickoff_local, kickoff_utc = _build_kickoff(day_offset, hour_local, venue_id)

        matches.append({
            "id": f"M{index + 1}", "match_number": index + 1, "stage": stage,
            "group": None, "home_team": knockout["home"], "away_team": knockout["away"],
            "venue_id": venue_id, "kickoff_utc": kickoff_utc, "kickoff_local": kickoff_local,
            "status": "scheduled",
        })
        index += 1

    return matches


TEAMS: list[dict[str, Any]] = _build_teams()
MATCHES: list[dict[str, Any]] = _build_matches()
