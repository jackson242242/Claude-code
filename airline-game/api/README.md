# SkyEmpire API (M1) — Turn-based Airline Tycoon Backend

FastAPI backend for the SkyEmpire airline tycoon game. The API contract,
economy formulas, and balance targets live in
[`../CONTRACT.md`](../CONTRACT.md) — that file is the source of truth.

## Layout

```
api/
├── app/
│   ├── engine/          # pure simulation engine (no FastAPI / storage / I/O)
│   │   ├── balance.py   # all tunable economy constants
│   │   ├── state.py     # dataclasses for game state + haversine
│   │   ├── commands.py  # command validation & application
│   │   └── simulate.py  # quarter settlement (CONTRACT §3 formulas)
│   ├── routes/games.py  # thin REST layer (CONTRACT §1)
│   ├── schemas.py       # Pydantic v2 camelCase wire types (CONTRACT §2)
│   ├── service.py       # GameService + in-memory GameRepository
│   ├── data.py          # loads ../data/cities.json + aircraft.json
│   └── main.py          # app wiring, CORS, global error envelope
└── tests/               # pytest suite incl. the 4 balance acceptance targets
```

## Setup

```bash
cd airline-game/api
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Run (dev, port 8001)

```bash
cd airline-game/api
.venv/bin/uvicorn app.main:app --reload --port 8001
```

- Health check: http://localhost:8001/health
- Static tables: `GET http://localhost:8001/api/meta`
- Interactive docs: http://localhost:8001/docs
- CORS allows `http://localhost:3001` (the Next.js dev frontend) and `*` for dev.

## API (see CONTRACT §1 for full shapes)

| Method | Path                          | Purpose                                  |
|--------|-------------------------------|------------------------------------------|
| GET    | `/api/meta`                   | cities + aircraft models                 |
| POST   | `/api/games`                  | create game (`airlineName`, `hqCityId`)  |
| GET    | `/api/games/{id}`             | fetch game state                         |
| POST   | `/api/games/{id}/commands`    | apply a batch of commands                |
| POST   | `/api/games/{id}/end-turn`    | settle the quarter, returns `TurnReport` |

Errors are always `{"error": {"message", "type"}}` (HTTP 400/404/422).
Storage is an in-memory dict (M1); games do not survive a restart.

## Tests

```bash
cd airline-game/api
.venv/bin/python -m pytest
```

Covers command validation (invalid city, range too short, insufficient cash,
utilization cap), recomputable settlement numbers, the four balance acceptance
targets of CONTRACT §3, and a TestClient end-to-end smoke flow including the
bankruptcy path.

### Balance calibration

All tunable constants are in `app/engine/balance.py`. Current calibration
(targets in `tests/test_balance.py`):

- A320neo NYC↔LAX, 14 weekly movements: 79.8% load factor, route profit ≈ $3.2M/quarter
- 787-9 NYC↔LHR, 7 weekly movements: 83.0% load factor, ≈ $4.0M/quarter after holding cost
- fareMult 1.6 → 47% of base traffic; fareMult 0.6 → 100% load, lower profit
- 3 × A320neo bought outright leaves $87M of the $420M start

Note on frequencies: in the balance targets, "每周 N 班" is the route's total
weekly movements across both directions, i.e. `weeklyFlights = N / 2` per
direction — the only reading consistent with the contract's 84 weekly
block-hour-per-aircraft utilization cap (`weeklyFlights` accepts fractional
values such as `3.5`).
