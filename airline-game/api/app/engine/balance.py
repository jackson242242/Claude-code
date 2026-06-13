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
PRICE_ELASTICITY = -1.6  # price weight w_i = fareMult ** PRICE_ELASTICITY
# Background market weight (CONTRACT §3, M2.1 share competition model). The
# value 11/9 is exact: a solo seller at fareMult 1.0 gets share
# 1 / (1 + 11/9) = 0.45, identical to the retired M1 constant SHARE_BASE.
W_BG = 11.0 / 9.0
DISTANCE_DECAY_KM = 9_000.0  # distanceDecay = exp(-distanceKm / 9000)
SEASON_FACTOR = {1: 0.9, 2: 1.0, 3: 1.15, 4: 0.95}

# --- AI competitors (CONTRACT §3, M2.1) ----------------------------------------
AI_INITIAL_WEEKLY_SEATS = 1_600  # per direction, on each fixed initial route
AI_NEW_ROUTE_WEEKLY_SEATS = 2_000  # per direction, on routes opened by evolution
AI_GROWTH_FACTOR = 1.05  # largest route weeklySeats ×1.05 (ceil) every turn
AI_ROUTE_MAX_WEEKLY_SEATS = 3200  # per-route cap — uncapped compounding bankrupted every strategy (balance_sim 2026-06-12)
AI_NEW_ROUTE_EVERY_TURNS = 6  # turn % 6 == 0 → open a new HQ route

# --- Airport slots (CONTRACT §3, M2.2) ----------------------------------------
SLOT_COST_MULT = 800.0  # negotiation cost = slotFee × 800 × (1 + taken/capacity)
HQ_STARTING_SLOTS = 2  # player holds 2 slots at the HQ on day one, 0 elsewhere

# --- Pricing -----------------------------------------------------------------
FARE_FIXED = 70.0  # USD base fare component
FARE_PER_KM = 0.115  # USD per km fare component
FARE_MULT_MIN = 0.6
FARE_MULT_MAX = 1.6

# --- Operating costs ---------------------------------------------------------
FUEL_USD_PER_KG = 0.75
AIRPORT_FEE_FACTOR = 0.55  # share of slotFee charged per movement as operating fee (balance_sim 2026-06-12: full fee killed short-haul)
CREW_MAINT_USD_PER_BH = 3_000.0  # crew + maintenance per block hour

# --- Fleet holding costs (per aircraft per quarter, fractions of list price) --
DEPRECIATION_Q = 0.0095  # owned: 1.25% (CONTRACT §3)
LEASE_RATE_Q = 0.017  # leased: 2.75% (CONTRACT §3)
SELL_VALUE_RATIO = 0.7  # resale value = price × 0.7 (CONTRACT §2)

# --- Company overhead (per quarter) -------------------------------------------
HQ_OVERHEAD = 600_000.0
ADMIN_PER_AIRCRAFT = 100_000.0

# --- Operations / scheduling ---------------------------------------------------
WEEKS_PER_QUARTER = 13
TURNAROUND_HOURS = 0.6  # added to distance/cruise per flight (block time)
MAX_WEEKLY_BLOCK_HOURS_PER_AIRCRAFT = 84.0  # CONTRACT §3 utilization cap
DEFAULT_WEEKLY_FLIGHTS = 7  # weeklyFlights default when a route opens

# --- Cabin classes & service tiers (M2.3) ----------------------------------------
# Floor-space multipliers: 1 biz seat ≡ 2.5 econ spaces; 1 first seat ≡ 5 econ spaces.
BIZ_SPACE_FACTOR = 2.5  # bizSeats = seats × mixB% / 100 / BIZ_SPACE_FACTOR
FIRST_SPACE_FACTOR = 5.0  # firstSeats = seats × mixF% / 100 / FIRST_SPACE_FACTOR

# Fare multipliers relative to economy fare (CONTRACT §3).
BIZ_FARE_MULT = 3.0
FIRST_FARE_MULT = 6.5

# Demand split across cabin classes (CONTRACT §3).
DEMAND_SPLIT: dict[str, float] = {"economy": 0.88, "business": 0.09, "first": 0.03}

# Service tier — price-weight adjustment and per-pax service cost (CONTRACT §3).
SERVICE_WEIGHT: dict[int, float] = {1: 0.85, 2: 1.0, 3: 1.15}
SERVICE_COST_PER_PAX: dict[int, float] = {1: 12.0, 2: 25.0, 3: 45.0}

# --- Failure conditions ---------------------------------------------------------
BANKRUPTCY_CONSECUTIVE_QUARTERS = 2  # cash < 0 at N consecutive quarter ends

# --- Game length (M2.4) -------------------------------------------------------
GAME_LENGTH_TURNS = 80  # 2026 Q3 → 2046 Q2, 20 years (CONTRACT §3)

# --- Geometry --------------------------------------------------------------------
EARTH_RADIUS_KM = 6_371.0

# --- Brand & Marketing (V3.7) -------------------------------------------------------
BRAND_INITIAL = 50.0           # starting brand score
BRAND_FACTOR = 1.2             # w ×= BRAND_FACTOR ** ((brand-50)/50); brand=50 → 1
BRAND_MIN = 0.0
BRAND_MAX = 100.0
BRAND_MEAN_REVERSION = 0.05    # (50 - brand) × 0.05 applied after settlement, then clamp
BRAND_SERVICE_DRIP_PER_SERVICE_UNIT = 0.4  # brand += 0.4 × marketing.service each quarter
BRAND_TIER3_PER_ROUTE = 0.3   # brand += 0.3 per tier-3 route per quarter
BRAND_TIER1_PER_ROUTE = -0.3  # brand -= 0.3 per tier-1 route per quarter
BRAND_TIER_CAP = 1.5           # max absolute brand change from service tier drip per quarter
MARKETING_DIGITAL_WEIGHT = 0.010   # w ×= 1 + 0.010×digital + 0.012×sponsor
MARKETING_SPONSOR_WEIGHT = 0.012
MARKETING_COST_PER_UNIT = 1_000_000.0  # $1M per unit of digital+sponsor+service

# --- Decision Events (V3.7) -------------------------------------------------------
DECISION_CHANCE = 0.15         # probability per turn of drawing a decision event
DECISION_CASH_DELTA_MIN = -30_000_000   # cashDelta lower bound
DECISION_CASH_DELTA_MAX = 10_000_000    # cashDelta upper bound
DECISION_BRAND_DELTA_MIN = -15          # brandDelta lower bound
DECISION_BRAND_DELTA_MAX = 15           # brandDelta upper bound

# --- V3.9: City endowment effect constants ----------------------------------------
# Terrain multiplier on slot negotiation cost (CONTRACT §3 V3.9).
# mountain/island = 1.15 (harder construction), desert = 1.05, coastal/plain = 1.0.
TERRAIN_SLOT_MULT: dict[str, float] = {
    "mountain": 1.15,
    "island": 1.15,
    "desert": 1.05,
    "coastal": 1.0,
    "plain": 1.0,
}

# --- Dynamic events (M3.1) -------------------------------------------------------
EVENT_CHANCE = 0.45            # probability per turn of drawing one new event
EVENT_SEVERITY_WEIGHTS = {"minor": 3, "major": 1}  # draw weights by severity
EVENT_EFFECT_MULT_MIN = 0.5    # per-entry mult lower bound (invalid entry if violated)
EVENT_EFFECT_MULT_MAX = 2.0    # per-entry mult upper bound (invalid entry if violated)
EVENT_DURATION_MIN = 1         # durationTurns lower bound
EVENT_DURATION_MAX = 8         # durationTurns upper bound
# Stacked same-target multiplier product is clamped to this range (CONTRACT §3).
EVENT_STACK_CLAMP_LO = 0.25
EVENT_STACK_CLAMP_HI = 4.0
