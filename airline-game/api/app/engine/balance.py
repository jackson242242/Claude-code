"""Tunable economy constants for the SkyEmpire M1 engine.

Formulas live in ``simulate.py``/``commands.py`` and follow CONTRACT.md §3
exactly; only the numeric constants below are calibration surface. The values
were tuned until the four balance acceptance targets in CONTRACT.md §3 pass
(see ``tests/test_balance.py``).
"""
from __future__ import annotations

# --- Starting conditions (CONTRACT §3, fixed) -------------------------------
STARTING_CASH = 420_000_000.0
START_YEAR = 2026
START_QUARTER = 3

# --- Demand model ------------------------------------------------------------
BASE_K = 800.0  # market size scale (pax/quarter per demandA×demandB unit)
SHARE_BASE = 0.45  # player's obtainable market share (no AI rivals in M1)
PRICE_ELASTICITY = -1.6  # demandMult = fareMult ** PRICE_ELASTICITY
DISTANCE_DECAY_KM = 9_000.0  # distanceDecay = exp(-distanceKm / 9000)
SEASON_FACTOR = {1: 0.9, 2: 1.0, 3: 1.15, 4: 0.95}

# --- Pricing -----------------------------------------------------------------
FARE_FIXED = 70.0  # USD base fare component
FARE_PER_KM = 0.095  # USD per km fare component
FARE_MULT_MIN = 0.6
FARE_MULT_MAX = 1.6

# --- Operating costs ---------------------------------------------------------
FUEL_USD_PER_KG = 0.75
CREW_MAINT_USD_PER_BH = 3_000.0  # crew + maintenance per block hour

# --- Fleet holding costs (per aircraft per quarter, fractions of list price) --
DEPRECIATION_Q = 0.0125  # owned: 1.25% (CONTRACT §3)
LEASE_RATE_Q = 0.0275  # leased: 2.75% (CONTRACT §3)
SELL_VALUE_RATIO = 0.7  # resale value = price × 0.7 (CONTRACT §2)

# --- Company overhead (per quarter) -------------------------------------------
HQ_OVERHEAD = 1_000_000.0
ADMIN_PER_AIRCRAFT = 150_000.0

# --- Operations / scheduling ---------------------------------------------------
WEEKS_PER_QUARTER = 13
TURNAROUND_HOURS = 0.6  # added to distance/cruise per flight (block time)
MAX_WEEKLY_BLOCK_HOURS_PER_AIRCRAFT = 84.0  # CONTRACT §3 utilization cap
DEFAULT_WEEKLY_FLIGHTS = 7  # weeklyFlights default when a route opens

# --- Failure conditions ---------------------------------------------------------
BANKRUPTCY_CONSECUTIVE_QUARTERS = 2  # cash < 0 at N consecutive quarter ends

# --- Geometry --------------------------------------------------------------------
EARTH_RADIUS_KM = 6_371.0
