# Affiliate Commissions — Setup Playbook

**Owner action required** · Updated 2026-06-10 · Status: infrastructure live, ids pending

The app already deep-links every flight/hotel offer to partner sites. The code
now injects affiliate tracking ids into those links **automatically when the
env vars are set** — until then links stay plain (they work, they just earn
nothing). An agent cannot sign up for these programs; the account, tax info
and payout details must be the owner's.

## 1. What's wired (today)

| Partner | Link we emit | Tracking | Env var (API / web) |
|---|---|---|---|
| **Booking.com** (hotels) | `booking.com/searchresults.html?ss=City, Country…` | `aid=<your id>` | `BOOKING_AID` / `NEXT_PUBLIC_BOOKING_AID` |
| **Kayak** (flights) | `kayak.com/flights/ORG-DST/date/Nadults` | `?a=<your id>` | `KAYAK_AFFILIATE_ID` / `NEXT_PUBLIC_KAYAK_AFFILIATE_ID` |

Both are covered by regression tests (`backend/tests/test_links.py`,
`__tests__/offers.test.ts`): the id is appended only when configured, and the
geo-anchoring rule (city in `ss`) survives the affiliate param.

Uber/Lyft (rideshare cards) deep-link into the apps but have **no self-serve
per-ride commission program** — those links exist for UX, not revenue.

## 2. Sign-up steps (owner)

1. **Booking.com Affiliate Partner Programme** — apply at
   [booking.com/affiliate-program](https://www.booking.com/affiliate-program/v2/index.html)
   (or via [Awin](https://www.awin.com/us/advertisers/partner/booking.com)).
   Commission ≈ **25–40% of Booking's cut** (~3–5% of booking value).
   After approval, copy the **AID** number from the dashboard.
2. **KAYAK Affiliate Network** — apply at
   [affiliates.kayak.com](https://affiliates.kayak.com/). Pays per click-out
   (~$0.50–1.50) + revenue share; 30-day cookie. After approval, copy the
   affiliate id and **verify the deeplink param format shown in the KAN
   dashboard** (we append `?a=<id>`; if your dashboard shows a different
   param, update `kayak_flights_link` in `backend/app/providers/util.py` and
   `src/mocks/offers.ts`).
3. **Render** → set the four env vars (worldcup-api: `BOOKING_AID`,
   `KAYAK_AFFILIATE_ID`; worldcup-web: `NEXT_PUBLIC_BOOKING_AID`,
   `NEXT_PUBLIC_KAYAK_AFFILIATE_ID`) → redeploy. Done — every emitted link is
   now commissionable.

## 3. Verify after setting ids

- Open any hotel result → "Book now" URL must contain `aid=…` and still show
  `ss=City, Country`.
- Open any flight result → Kayak URL must end `?a=…`.
- `GET /meta/link-audit` must still return `ok: true`.

## 4. Next affiliate tiers (backlog, in priority order)

1. **Expedia Group Affiliate Program** (hotels+flights alternative; via
   Partnerize) — diversifies away from a single hotel partner.
2. **Omio** (trains/buses — fits the transport vertical; per-ticket commission).
3. **Travel eSIM** (Airalo/Holafly via Impact — high margin, perfect for
   cross-border fans; add a "Stay connected" card to city guides).
4. **Travel insurance** (SafetyWing/World Nomads — natural fit for the
   trip-planning flow).
5. **GetYourGuide/Viator** (host-city tours & activities for non-match days).

Each follows the same pattern: sign up → env-keyed id → inject in the link
builder → regression test. ~1h of code each once the account exists.

## Sources (program facts, gathered 2026-06-10)

- [Booking.com Affiliate Programme](https://www.booking.com/affiliate-program/v2/index.html) · [commission & payments](https://affiliates.support.booking.com/kb/s/article/Commission-and-Payments) · [via Awin](https://www.awin.com/us/advertisers/partner/booking.com)
- [KAYAK Affiliate Network](https://affiliates.kayak.com/) · [program details](https://getlasso.co/affiliate/kayak/)
