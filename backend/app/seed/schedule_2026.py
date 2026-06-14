"""The real 2026 FIFA World Cup host data and the full 104-match schedule.

The 72 group fixtures come from the 5 Dec 2025 draw; the 32 knockout slots
are bracket placeholders until results are known. Kickoff UTC is derived
from each venue's summer UTC offset. This mirrors the TypeScript mock layer
(src/mocks/matches.ts) one-to-one so the API and the frontend fallback
agree. Source: openfootball/worldcup.json (public domain).
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
    "A": ["Mexico", "South Korea", "South Africa", "Czechia"],
    "B": ["Canada", "Switzerland", "Qatar", "Bosnia & Herzegovina"],
    "C": ["Brazil", "Morocco", "Scotland", "Haiti"],
    "D": ["USA", "Australia", "Paraguay", "Turkey"],
    "E": ["Germany", "Ecuador", "Ivory Coast", "Curaçao"],
    "F": ["Netherlands", "Japan", "Tunisia", "Sweden"],
    "G": ["Belgium", "Iran", "Egypt", "New Zealand"],
    "H": ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"],
    "I": ["France", "Senegal", "Norway", "Iraq"],
    "J": ["Argentina", "Austria", "Algeria", "Jordan"],
    "K": ["Portugal", "Colombia", "Uzbekistan", "DR Congo"],
    "L": ["England", "Croatia", "Panama", "Ghana"],
}

CONFEDERATIONS: dict[str, str] = {
    "Mexico": "CONCACAF",
    "South Korea": "AFC",
    "South Africa": "CAF",
    "Czechia": "UEFA",
    "Canada": "CONCACAF",
    "Switzerland": "UEFA",
    "Qatar": "AFC",
    "Bosnia & Herzegovina": "UEFA",
    "Brazil": "CONMEBOL",
    "Morocco": "CAF",
    "Scotland": "UEFA",
    "Haiti": "CONCACAF",
    "USA": "CONCACAF",
    "Australia": "AFC",
    "Paraguay": "CONMEBOL",
    "Turkey": "UEFA",
    "Germany": "UEFA",
    "Ecuador": "CONMEBOL",
    "Ivory Coast": "CAF",
    "Curaçao": "CONCACAF",
    "Netherlands": "UEFA",
    "Japan": "AFC",
    "Tunisia": "CAF",
    "Sweden": "UEFA",
    "Belgium": "UEFA",
    "Iran": "AFC",
    "Egypt": "CAF",
    "New Zealand": "OFC",
    "Spain": "UEFA",
    "Uruguay": "CONMEBOL",
    "Saudi Arabia": "AFC",
    "Cape Verde": "CAF",
    "France": "UEFA",
    "Senegal": "CAF",
    "Norway": "UEFA",
    "Iraq": "AFC",
    "Argentina": "CONMEBOL",
    "Austria": "UEFA",
    "Algeria": "CAF",
    "Jordan": "AFC",
    "Portugal": "UEFA",
    "Colombia": "CONMEBOL",
    "Uzbekistan": "AFC",
    "DR Congo": "CAF",
    "England": "UEFA",
    "Croatia": "UEFA",
    "Panama": "CONCACAF",
    "Ghana": "CAF",
}

CITY_UTC_OFFSET: dict[str, int] = {
    "mexico-city": -6,
    "guadalajara": -6,
    "monterrey": -6,
    "atlanta": -4,
    "boston": -4,
    "miami": -4,
    "new-york": -4,
    "philadelphia": -4,
    "toronto": -4,
    "dallas": -5,
    "houston": -5,
    "kansas-city": -5,
    "los-angeles": -7,
    "san-francisco": -7,
    "seattle": -7,
    "vancouver": -7,
}

# (num, stage, group|None, home, away, venue_id, date, local_time)
_FIXTURES: list[tuple[Any, ...]] = [
    (1, "Group Stage", "A", "Mexico", "South Africa", "mexico-city", "2026-06-11", "13:00"),
    (2, "Group Stage", "A", "South Korea", "Czechia", "guadalajara", "2026-06-11", "20:00"),
    (3, "Group Stage", "B", "Canada", "Bosnia & Herzegovina", "toronto", "2026-06-12", "15:00"),
    (4, "Group Stage", "D", "USA", "Paraguay", "los-angeles", "2026-06-12", "18:00"),
    (5, "Group Stage", "B", "Qatar", "Switzerland", "san-francisco", "2026-06-13", "12:00"),
    (6, "Group Stage", "C", "Brazil", "Morocco", "new-york", "2026-06-13", "18:00"),
    (7, "Group Stage", "C", "Haiti", "Scotland", "boston", "2026-06-13", "21:00"),
    (8, "Group Stage", "D", "Australia", "Turkey", "vancouver", "2026-06-13", "21:00"),
    (9, "Group Stage", "E", "Germany", "Curaçao", "houston", "2026-06-14", "12:00"),
    (10, "Group Stage", "F", "Netherlands", "Japan", "dallas", "2026-06-14", "15:00"),
    (11, "Group Stage", "E", "Ivory Coast", "Ecuador", "philadelphia", "2026-06-14", "19:00"),
    (12, "Group Stage", "F", "Sweden", "Tunisia", "monterrey", "2026-06-14", "20:00"),
    (13, "Group Stage", "H", "Spain", "Cape Verde", "atlanta", "2026-06-15", "12:00"),
    (14, "Group Stage", "G", "Belgium", "Egypt", "seattle", "2026-06-15", "12:00"),
    (15, "Group Stage", "H", "Saudi Arabia", "Uruguay", "miami", "2026-06-15", "18:00"),
    (16, "Group Stage", "G", "Iran", "New Zealand", "los-angeles", "2026-06-15", "18:00"),
    (17, "Group Stage", "I", "France", "Senegal", "new-york", "2026-06-16", "15:00"),
    (18, "Group Stage", "I", "Iraq", "Norway", "boston", "2026-06-16", "18:00"),
    (19, "Group Stage", "J", "Argentina", "Algeria", "kansas-city", "2026-06-16", "20:00"),
    (20, "Group Stage", "J", "Austria", "Jordan", "san-francisco", "2026-06-16", "21:00"),
    (21, "Group Stage", "K", "Portugal", "DR Congo", "houston", "2026-06-17", "12:00"),
    (22, "Group Stage", "L", "England", "Croatia", "dallas", "2026-06-17", "15:00"),
    (23, "Group Stage", "L", "Ghana", "Panama", "toronto", "2026-06-17", "19:00"),
    (24, "Group Stage", "K", "Uzbekistan", "Colombia", "mexico-city", "2026-06-17", "20:00"),
    (25, "Group Stage", "A", "Czechia", "South Africa", "atlanta", "2026-06-18", "12:00"),
    (26, "Group Stage", "B", "Switzerland", "Bosnia & Herzegovina", "los-angeles", "2026-06-18", "12:00"),
    (27, "Group Stage", "B", "Canada", "Qatar", "vancouver", "2026-06-18", "15:00"),
    (28, "Group Stage", "A", "Mexico", "South Korea", "guadalajara", "2026-06-18", "19:00"),
    (29, "Group Stage", "D", "USA", "Australia", "seattle", "2026-06-19", "12:00"),
    (30, "Group Stage", "C", "Scotland", "Morocco", "boston", "2026-06-19", "18:00"),
    (31, "Group Stage", "C", "Brazil", "Haiti", "philadelphia", "2026-06-19", "20:30"),
    (32, "Group Stage", "D", "Turkey", "Paraguay", "san-francisco", "2026-06-19", "20:00"),
    (33, "Group Stage", "F", "Netherlands", "Sweden", "houston", "2026-06-20", "12:00"),
    (34, "Group Stage", "E", "Germany", "Ivory Coast", "toronto", "2026-06-20", "16:00"),
    (35, "Group Stage", "E", "Ecuador", "Curaçao", "kansas-city", "2026-06-20", "19:00"),
    (36, "Group Stage", "F", "Tunisia", "Japan", "monterrey", "2026-06-20", "22:00"),
    (37, "Group Stage", "H", "Spain", "Saudi Arabia", "atlanta", "2026-06-21", "12:00"),
    (38, "Group Stage", "G", "Belgium", "Iran", "los-angeles", "2026-06-21", "12:00"),
    (39, "Group Stage", "H", "Uruguay", "Cape Verde", "miami", "2026-06-21", "18:00"),
    (40, "Group Stage", "G", "New Zealand", "Egypt", "vancouver", "2026-06-21", "18:00"),
    (41, "Group Stage", "J", "Argentina", "Austria", "dallas", "2026-06-22", "12:00"),
    (42, "Group Stage", "I", "France", "Iraq", "philadelphia", "2026-06-22", "17:00"),
    (43, "Group Stage", "I", "Norway", "Senegal", "new-york", "2026-06-22", "20:00"),
    (44, "Group Stage", "J", "Jordan", "Algeria", "san-francisco", "2026-06-22", "20:00"),
    (45, "Group Stage", "K", "Portugal", "Uzbekistan", "houston", "2026-06-23", "12:00"),
    (46, "Group Stage", "L", "England", "Ghana", "boston", "2026-06-23", "16:00"),
    (47, "Group Stage", "L", "Panama", "Croatia", "toronto", "2026-06-23", "19:00"),
    (48, "Group Stage", "K", "Colombia", "DR Congo", "guadalajara", "2026-06-23", "20:00"),
    (49, "Group Stage", "B", "Bosnia & Herzegovina", "Qatar", "seattle", "2026-06-24", "12:00"),
    (50, "Group Stage", "B", "Switzerland", "Canada", "vancouver", "2026-06-24", "12:00"),
    (51, "Group Stage", "C", "Morocco", "Haiti", "atlanta", "2026-06-24", "18:00"),
    (52, "Group Stage", "C", "Scotland", "Brazil", "miami", "2026-06-24", "18:00"),
    (53, "Group Stage", "A", "Czechia", "Mexico", "mexico-city", "2026-06-24", "19:00"),
    (54, "Group Stage", "A", "South Africa", "South Korea", "monterrey", "2026-06-24", "19:00"),
    (55, "Group Stage", "E", "Curaçao", "Ivory Coast", "philadelphia", "2026-06-25", "16:00"),
    (56, "Group Stage", "E", "Ecuador", "Germany", "new-york", "2026-06-25", "16:00"),
    (57, "Group Stage", "F", "Japan", "Sweden", "dallas", "2026-06-25", "18:00"),
    (58, "Group Stage", "F", "Tunisia", "Netherlands", "kansas-city", "2026-06-25", "18:00"),
    (59, "Group Stage", "D", "Paraguay", "Australia", "san-francisco", "2026-06-25", "19:00"),
    (60, "Group Stage", "D", "Turkey", "USA", "los-angeles", "2026-06-25", "19:00"),
    (61, "Group Stage", "I", "Norway", "France", "boston", "2026-06-26", "15:00"),
    (62, "Group Stage", "I", "Senegal", "Iraq", "toronto", "2026-06-26", "15:00"),
    (63, "Group Stage", "H", "Cape Verde", "Saudi Arabia", "houston", "2026-06-26", "19:00"),
    (64, "Group Stage", "H", "Uruguay", "Spain", "guadalajara", "2026-06-26", "18:00"),
    (65, "Group Stage", "G", "Egypt", "Iran", "seattle", "2026-06-26", "20:00"),
    (66, "Group Stage", "G", "New Zealand", "Belgium", "vancouver", "2026-06-26", "20:00"),
    (67, "Group Stage", "L", "Croatia", "Ghana", "philadelphia", "2026-06-27", "17:00"),
    (68, "Group Stage", "L", "Panama", "England", "new-york", "2026-06-27", "17:00"),
    (69, "Group Stage", "K", "Colombia", "Portugal", "miami", "2026-06-27", "19:30"),
    (70, "Group Stage", "K", "DR Congo", "Uzbekistan", "atlanta", "2026-06-27", "19:30"),
    (71, "Group Stage", "J", "Algeria", "Austria", "kansas-city", "2026-06-27", "21:00"),
    (72, "Group Stage", "J", "Jordan", "Argentina", "dallas", "2026-06-27", "21:00"),
    (73, "Round of 32", None, "Runner-up Group A", "Runner-up Group B", "los-angeles", "2026-06-28", "12:00"),
    (74, "Round of 32", None, "Winner Group E", "3rd: A/B/C/D/F", "boston", "2026-06-29", "16:30"),
    (75, "Round of 32", None, "Winner Group F", "Runner-up Group C", "monterrey", "2026-06-29", "19:00"),
    (76, "Round of 32", None, "Winner Group C", "Runner-up Group F", "houston", "2026-06-29", "12:00"),
    (77, "Round of 32", None, "Winner Group I", "3rd: C/D/F/G/H", "new-york", "2026-06-30", "17:00"),
    (78, "Round of 32", None, "Runner-up Group E", "Runner-up Group I", "dallas", "2026-06-30", "12:00"),
    (79, "Round of 32", None, "Winner Group A", "3rd: C/E/F/H/I", "mexico-city", "2026-06-30", "19:00"),
    (80, "Round of 32", None, "Winner Group L", "3rd: E/H/I/J/K", "atlanta", "2026-07-01", "12:00"),
    (81, "Round of 32", None, "Winner Group D", "3rd: B/E/F/I/J", "san-francisco", "2026-07-01", "17:00"),
    (82, "Round of 32", None, "Winner Group G", "3rd: A/E/H/I/J", "seattle", "2026-07-01", "12:00"),
    (83, "Round of 32", None, "Runner-up Group K", "Runner-up Group L", "toronto", "2026-07-02", "19:00"),
    (84, "Round of 32", None, "Winner Group H", "Runner-up Group J", "los-angeles", "2026-07-02", "12:00"),
    (85, "Round of 32", None, "Winner Group B", "3rd: E/F/G/I/J", "vancouver", "2026-07-02", "20:00"),
    (86, "Round of 32", None, "Winner Group J", "Runner-up Group H", "miami", "2026-07-03", "18:00"),
    (87, "Round of 32", None, "Winner Group K", "3rd: D/E/I/J/L", "kansas-city", "2026-07-03", "20:30"),
    (88, "Round of 32", None, "Runner-up Group D", "Runner-up Group G", "dallas", "2026-07-03", "13:00"),
    (89, "Round of 16", None, "Winner Match 74", "Winner Match 77", "philadelphia", "2026-07-04", "17:00"),
    (90, "Round of 16", None, "Winner Match 73", "Winner Match 75", "houston", "2026-07-04", "12:00"),
    (91, "Round of 16", None, "Winner Match 76", "Winner Match 78", "new-york", "2026-07-05", "16:00"),
    (92, "Round of 16", None, "Winner Match 79", "Winner Match 80", "mexico-city", "2026-07-05", "18:00"),
    (93, "Round of 16", None, "Winner Match 83", "Winner Match 84", "dallas", "2026-07-06", "14:00"),
    (94, "Round of 16", None, "Winner Match 81", "Winner Match 82", "seattle", "2026-07-06", "17:00"),
    (95, "Round of 16", None, "Winner Match 86", "Winner Match 88", "atlanta", "2026-07-07", "12:00"),
    (96, "Round of 16", None, "Winner Match 85", "Winner Match 87", "vancouver", "2026-07-07", "13:00"),
    (97, "Quarter-final", None, "Winner Match 89", "Winner Match 90", "boston", "2026-07-09", "16:00"),
    (98, "Quarter-final", None, "Winner Match 93", "Winner Match 94", "los-angeles", "2026-07-10", "12:00"),
    (99, "Quarter-final", None, "Winner Match 91", "Winner Match 92", "miami", "2026-07-11", "17:00"),
    (100, "Quarter-final", None, "Winner Match 95", "Winner Match 96", "kansas-city", "2026-07-11", "20:00"),
    (101, "Semi-final", None, "Winner Match 97", "Winner Match 98", "dallas", "2026-07-14", "14:00"),
    (102, "Semi-final", None, "Winner Match 99", "Winner Match 100", "atlanta", "2026-07-15", "15:00"),
    (103, "Third-place", None, "Loser Match 101", "Loser Match 102", "miami", "2026-07-18", "17:00"),
    (104, "Final", None, "Winner Match 101", "Winner Match 102", "new-york", "2026-07-19", "15:00"),
]



def slugify(name: str) -> str:
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", name.lower()))


def _build_kickoff(date: str, time: str, venue_id: str) -> tuple[str, str]:
    """Return (kickoff_local, kickoff_utc) from local wall time + venue offset."""
    local = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M").replace(
        tzinfo=timezone.utc
    )
    utc = local - timedelta(hours=CITY_UTC_OFFSET.get(venue_id, 0))
    return f"{date}T{time}:00", utc.strftime("%Y-%m-%dT%H:%M:%S.000Z")


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


def _build_matches() -> list[dict[str, Any]]:
    matches: list[dict[str, Any]] = []
    for num, stage, group, home, away, venue_id, date, time in _FIXTURES:
        kickoff_local, kickoff_utc = _build_kickoff(date, time, venue_id)
        matches.append({
            "id": f"M{num}", "match_number": num, "stage": stage,
            "group": group, "home_team": home, "away_team": away,
            "venue_id": venue_id, "kickoff_utc": kickoff_utc,
            "kickoff_local": kickoff_local, "status": "scheduled",
        })
    return matches


TEAMS: list[dict[str, Any]] = _build_teams()
MATCHES: list[dict[str, Any]] = _build_matches()
