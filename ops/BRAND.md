# Brand & Product Strategy Handbook

> Owner: Amelia (Product & Brand Lead) · Last updated: 2026-06-04
> Status: Working strategy doc. Reports into main Claude. This file is documentation
> only — it does not change product code.

This handbook defines how we position, name, design, build, grow, and monetize the
companion app for the 2026 FIFA World Cup (USA · Canada · Mexico). It is grounded in
the current product (schedule browsing, flight search via Duffel/Kayak, hotel search
via LiteAPI/Booking.com, trip planning, PWA install) and in the realities of the
tournament: **104 matches, 16 host cities, 3 countries, 39 days (June 11 – July 19,
2026), 48 teams, and record-breaking demand (500M+ ticket requests).**

---

## 0. The Strategic Insight

The 2026 World Cup is the first tri-national, 48-team tournament. For a fan, that is
not one trip — it is potentially **3 countries, 3 border regimes (ESTA/B1-B2, eTA,
FMM), 3 currencies, and multiple cities chasing one team across a continent.** The
logistical complexity is unprecedented, and the incumbents (Booking, Expedia, FIFA's
official channels) each solve only one slice. **Our wedge is the cross-border,
match-anchored trip** — the thing no one else owns.

---

## 1. Brand Positioning

### One-line value proposition
**"Follow your team across North America — every match, every city, one trip."**

Alt (shorter, tagline form): **"Your team. Their road. One app."**

### What we are
A fan-first travel companion that turns *"I want to see these matches"* into a
booked, border-aware, multi-city itinerary — not a generic hotel search bar with a
soccer skin.

### Brand personality
- **Knowledgeable insider** — speaks football fluently (matchday, fixtures, group
  stage, knockouts), not "events near you."
- **Calm logistics co-pilot** — takes the anxiety out of borders, transfers, and
  tight turnarounds between cities.
- **Energetic but trustworthy** — the buzz of the terraces, the reliability of a
  good travel agent. Hype where it earns excitement; precise where money and visas
  are on the line.
- **Global & multilingual by default** — English, Spanish, French as first-class
  citizens (the three host languages), built for fans from Brazil, Argentina,
  England, Germany, Mexico, and beyond.

### Differentiation matrix

| | Booking / Expedia | Official FIFA channels | **Us** |
|---|---|---|---|
| Anchored on the *match* | No (generic dates/cities) | Yes, but ticket-only | **Yes — itinerary built around fixtures** |
| Cross-border trip planning | No | No (single transactions) | **Core feature** |
| Border / visa / entry guidance | No | Partial (FIFA PASS info) | **Yes — per-leg, per-country** |
| Multi-city "follow your team" routing | No | No | **Core feature** |
| Neutral price comparison (multi-partner) | Single inventory | No | **Yes — aggregates partners** |
| Fan culture / tone | Generic OTA | Corporate / official | **Built by and for fans** |

**Positioning statement:** *For traveling football fans who refuse to miss a match,
[Brand] is the only trip planner that builds your whole World Cup journey — flights,
hotels, transfers, and border prep — around the fixtures you care about, across all
three host nations.*

> Note on trademark safety: "FIFA," "World Cup," and "World Cup 2026" are protected
> marks. Public-facing brand and marketing should avoid implying official
> affiliation. Use descriptive, nominative references only ("a companion app for the
> 2026 tournament in North America") and lead with our own brand name. Legal review
> before any paid campaign.

---

## 2. Brand Naming Candidates

Current name "World Cup 2026 Tour Guide" is descriptive, generic, and carries
trademark exposure ("World Cup"). We want something ownable, memorable, and
trademark-safe — leaning on neutral football-travel motifs ("26", "matchday",
"trotter", roads/routes).

**Recommended shortlist (ranked):**

1. **Matchday26** ⭐ *(top pick)*
   - *Why:* "Matchday" is the single most emotionally loaded, universally understood
     football word — it's the feeling we're selling. "26" pins it to the moment
     without using the protected "World Cup" mark. Reads cleanly as a domain
     (`matchday26.com` / `.app`), a hashtag (#Matchday26), and a verb-ish brand
     ("plan your matchday"). Internationally legible across EN/ES/FR fans.

2. **Trotter** (or **Globetrotter spin-off: "Trotter"**)
   - *Why:* Evokes the globe-trotting fan chasing their team city to city. Warm,
     characterful, mascot-friendly (a little traveling football character). Risk:
     more abstract; may need a descriptor lockup ("Trotter — World Cup travel").

3. **Roadto26** / **RoadTo**
   - *Why:* "The road to..." is native football language (the road to the final).
     Captures the multi-city journey directly. "RoadTo" is extensible to future
     tournaments (RoadTo28, RoadTo30). Risk: slightly generic; check availability.

4. **Kickoff Atlas** (or **Kickoff**)
   - *Why:* "Kickoff" = football start signal; "Atlas" = the cross-continent,
     multi-city, map-driven nature of the product. Strong for a maps/itinerary UI.
     Risk: "Kickoff" alone is crowded; the lockup helps.

5. **Eleven** / **The Eleven**
   - *Why:* A football side is eleven players; clean, premium, one-word brand.
     Flexible beyond a single tournament. Risk: very abstract without a tagline;
     "11" SEO is hard.

**Decision recommendation:** Ship as **Matchday26** for the 2026 cycle. It's the
most ownable + emotionally resonant + trademark-safe option, and the "26" gives a
crisp expiry/relevance signal that we can sunset or roll forward (→ Matchday28).
Secure `.com`/`.app`/`.soccer` domains and social handles before committing.

---

## 3. Visual Brand Direction

*(Direction for design/Sheng to execute — concepts and mood, not CSS.)*

### Logo concept
- **Primary mark:** A combination of a **route/pin motif + a ball or pennant.**
  Imagine a stylized travel route line that bends through three points (one per host
  nation) and resolves into a football or a location pin. Conveys "journey across
  three countries, anchored on the match."
- **Wordmark:** Confident, modern sans-serif. "Matchday" set in a bold, sporty
  weight; "26" can be a distinct accent (filled chip / jersey-number treatment),
  nodding to a shirt number on the back of a kit.
- **Mascot (optional, P2):** A friendly "Trotter"-style traveling fan character for
  social, stickers, and onboarding — high shareability, low gravity.

### Color & mood board direction
- **Energy that isn't any one nation's flag.** Avoid leaning red/white/blue or
  green/red so we don't appear to favor a team or a host country, and to stay clear
  of official-look palettes.
- **Recommended emotional palette:**
  - *Pitch / Momentum:* a deep, electric green or teal — football grass + travel
    "go" energy, but a modern, non-literal shade.
  - *Floodlight / Accent:* a warm amber or coral for highlights, CTAs, matchday
    excitement (the glow of a night game under lights).
  - *Night-match base:* a deep navy / near-black for surfaces — premium, calm,
    legible, lets the accent pop.
  - *Neutrals:* clean off-whites and cool greys for dense schedule/itinerary screens.
- **Mood words:** kinetic, panoramic, dependable, global, floodlit.

### Tone of voice
- **Voice:** A well-traveled football friend who's done the trip and has your back.
- **Do:** short, confident, active sentences. Use real football vocabulary
  (matchday, fixtures, knockouts, away end). Be precise and calm about money,
  borders, and dates.
- **Don't:** corporate OTA filler ("Unlock your dream getaway!"), fake urgency, or
  emoji-spam. Don't pretend to be official.
- **Microcopy examples:**
  - Empty trip: *"No matches yet. Pick a fixture and we'll build the road around it."*
  - Border prompt: *"Heading into Canada for this leg? You'll likely need an eTA —
    here's the 2-minute version."*
  - Price alert: *"Flights to Dallas just dropped 12%. Want to lock it in?"*
- **Localization:** EN/ES/FR are first-class, not afterthoughts. Voice should
  survive translation — keep idioms light so Spanish and French read just as natural.

---

## 4. Target User Personas

### Persona A — "Diego, the team chaser" *(primary)*
- 28, from Mexico City (or Buenos Aires / São Paulo). Following his national team
  through the group stage and, he hopes, into the knockouts.
- **Needs:** Knows the fixtures; doesn't yet know *how* he'll physically get from
  Guadalajara → Houston → Atlanta on tight turnarounds, across two borders.
- **Pains:** Multi-city routing, FMM/ESTA/visa confusion, costs stacking up, hotels
  selling out near venues.
- **What wins him:** "Follow your team" routing, border prep per leg, price alerts,
  Spanish-first UX.

### Persona B — "Sarah & Tom, the bucket-list pair" *(primary)*
- Mid-30s couple from England/Germany. Going to 3–4 matches as a once-in-a-lifetime
  trip; want to combine football with sightseeing (NYC, Miami, LA).
- **Needs:** A curated, low-stress multi-city plan that balances matches and
  tourism; trustworthy bookings; clear total cost.
- **Pains:** Overwhelmed by 16 cities and 104 matches; don't want to juggle 8 tabs.
- **What wins them:** Trip builder with suggested hotels + inter-city transport,
  neutral price comparison, a clean panoramic itinerary view.

### Persona C — "Marcus, the local matchgoer" *(secondary)*
- 22, lives in/near a host city (e.g., Atlanta). Going to a few games close to home,
  maybe one road trip to a neighboring city.
- **Needs:** Local transport to the stadium, nearby hotels for friends visiting,
  fan-fest info, matchday logistics.
- **Pains:** Game-day parking/transit chaos; hosting out-of-town friends.
- **What wins him:** Local transport + fan-fest layer, schedule browsing, sharing.

---

## 5. Product Roadmap (Prioritized Backlog)

Legend — **P0:** core differentiation, ship for launch window (now → July 2026).
**P1:** strong retention/conversion, fast-follow during the tournament. **P2:**
post-tournament / future-cycle bets.

### P0 — Win the wedge (multi-city, cross-border)
- **Multi-city "Follow Your Team" itinerary** — *Pain: fans don't know how to
  physically chain 3–6 matches across cities/countries.* Pick a team or a set of
  fixtures; we generate a sequenced trip with feasible inter-city flights/transport
  and turnaround time checks. *This is the product's reason to exist.*
- **Visa / border / entry guidance per leg** — *Pain: 3 countries = 3 entry regimes
  (ESTA/B1-B2, eTA, FMM); fans wrongly assume a ticket grants entry.* Surface, per
  border crossing in the itinerary, what authorization is likely needed, links to
  official sources, and FIFA PASS priority-appointment info. Informational, clearly
  "not legal advice," but enormously reassuring and SEO-rich.
- **Total trip cost roll-up** — *Pain: costs hide across flights+hotels+transfers in
  multiple currencies.* One running total for the whole itinerary.
- **Currency display / conversion** — *Pain: USD + CAD + MXN in one trip.* Show
  prices in the fan's home currency with clear FX; let them toggle.

### P1 — Convert & retain
- **Price alerts / price drop watch** — *Pain: fans wait for fares to drop and miss
  the dip.* Watch flights/hotels for saved trips; notify (push via PWA, email).
  Directly lifts affiliate conversion.
- **Local transport & stadium-day logistics** — *Pain: getting to the venue and
  between airports/hotels.* Transit, rideshare, and "leave-by" guidance for matchday.
- **Deeper localization (EN/ES/FR) across all flows** — *Pain: global audience.*
  Beyond UI strings: localized content, dates, currency, and tone.
- **Fan-fest & host-city guides** — *Pain: what to do around the match.* Curated
  fan-fest locations (Liberty State Park, Centennial Olympic Park, etc.), food, safe
  fan zones. Strong SEO + content-marketing asset.
- **Saved trips / accounts & cross-device sync** — *Pain: planning spans weeks and
  devices.* Lightweight account so itineraries persist.

### P2 — Community & future cycles
- **Fan community layer** — *Pain: traveling fans want to coordinate, share rides,
  meet compatriots.* Per-match/per-city boards, travel-buddy matching, safety-first
  moderation. High engagement, but heavy to moderate — sequence after core.
- **Group / split-trip coordination** — *Pain: friends booking together.* Shared
  itineraries, who's-booked tracking, payment splitting links.
- **Packages / bundles** — flights+hotel+transport bundled deals (see Monetization).
- **Roll-forward to future tournaments** — *Pain: one-and-done product risk.*
  Abstract the "tournament" concept so the same engine serves 2027 Women's events,
  2028, 2030. (Brand "26" → "28" rollover.)
- **AI trip concierge** — natural-language "plan my Argentina run on a $4k budget"
  that emits an itinerary using the existing provider adapters.

---

## 6. Growth & Operations

### SEO (our biggest organic lever — fans Google everything)
- **Programmatic / long-tail city + match + logistics pages**, e.g.:
  - "how to get from [City A] to [City B] for the World Cup"
  - "[host city] hotels near the stadium 2026"
  - "[match / fixture] travel guide"
  - "do I need a visa to travel USA / Canada / Mexico for the 2026 tournament"
  - "[country] fans travel guide North America 2026"
- **Visa/border guidance content is a uniquely high-intent SEO goldmine** — high
  search volume, high anxiety, low-quality incumbent answers. Own it.
- **Per-host-city evergreen guides** (transport, fan fest, safety, things to do) ×
  EN/ES/FR = a large, defensible content footprint.
- Technical: fast PWA, clean structured data (Event/SportsEvent schema), localized
  hreflang for EN/ES/FR.

### Content marketing
- **"The Road To" series** — itinerary blueprints per popular team (Argentina run,
  Brazil run, England run) that double as SEO + social bait.
- **Border/visa explainers** in EN/ES/FR + Portuguese (huge Brazil/Argentina
  demand) — even if the app UI is EN/ES/FR, blog content can reach PT-BR fans.
- **Cost-breakdown explainers** ("what a 3-match World Cup trip actually costs").

### Social
- **Instagram / TikTok:** matchday hype, host-city reels, "Trotter" mascot content,
  fan-route visualizations (animated maps of a team's possible road to the final).
- **Reddit / fan forums:** authentic presence in r/soccer and national-team subs —
  helpful, not spammy.
- **X/Threads:** real-time fixture + travel-deal posts during the tournament.

### Acquisition channels
1. **SEO** (primary, compounding — start *now*).
2. **Content + social organic** (brand + top-of-funnel).
3. **Partnerships:** national-team fan clubs, supporter groups, football media,
   eSIM/roaming providers (e.g., travel eSIM cross-promo), and host-city tourism
   boards.
4. **Paid search/social:** tightly targeted to high-intent queries closer to launch;
   careful with trademark terms (legal review).

### Launch cadence
- **Now → mid-June (T-0):** core multi-city + visa guidance live; SEO content
  blitz; PWA install push. **The tournament starts June 11 — every day of pre-launch
  delay is lost intent.**
- **Group stage (Jun 11–27):** rapid iteration, price alerts, fan-fest guides, daily
  social. Highest traffic window.
- **Knockouts (late Jun → Jul 19):** "road to the final" content, dynamic
  re-routing as teams advance, retention/account push.
- **Post-tournament:** harvest email list + content equity; plan roll-forward to
  next cycle.

---

## 7. Monetization

Ranked by fit and speed-to-revenue:

1. **Affiliate / referral commissions (PRIMARY — start here).**
   - We already deep-link to Duffel/Kayak (flights) and LiteAPI/Booking.com (hotels);
     these pay per booking/referral. Add transport, rail, rideshare, eSIM, travel
     insurance, and parking affiliates.
   - *Why first:* zero inventory risk, fits the existing provider-adapter
     architecture, scales with traffic, and the multi-city trip naturally drives more
     bookings per user (more legs = more commissionable transactions).
   - **Lever:** "total trip cost roll-up" + "price alerts" directly increase
     completed bookings → directly increase commission.

2. **Curated packages / bundles (P1–P2, higher margin).**
   - Flights+hotel+transport bundled per itinerary; take a markup or higher bundled
     commission. Premium "done-for-you" multi-city packages for the bucket-list
     persona (Sarah & Tom) who'll pay for low-stress.

3. **Freemium membership / "Travel Pass" (P2).**
   - Free: schedule, basic trip builder. Paid (one-time tournament pass or low
     subscription): price alerts, dynamic re-routing as teams advance, concierge,
     offline guides, premium support. Fits a 39-day event well as a one-time pass.

4. **Sponsorship & native partnerships (opportunistic).**
   - Host-city tourism boards, airlines, eSIM/roaming, payment/FX providers — native,
     relevant placements (not banner spam, which clashes with our trustworthy tone).

5. **Display advertising — *deprioritized.*** Erodes trust and our premium tone;
   only consider contextual, non-intrusive units if other streams underperform.

**Monetization north star:** maximize *commissionable bookings per planned trip.*
Every product decision (multi-city routing, price alerts, total-cost clarity) should
ladder up to getting more high-quality bookings completed through our partners.

---

## Appendix — Source signals informing this strategy
- Tournament shape: 104 matches, 16 host cities, 3 nations, 48 teams, June 11 –
  July 19, 2026; final at MetLife Stadium (NY/NJ). Guadalajara group-stage only; 15
  cities host knockouts.
- Demand: 500M+ ticket requests; ~15M/day during the Random Selection Draw.
- Top traveling fan markets: Mexico, USA, Canada, Brazil, Argentina, England,
  Germany, France, Spain, Italy, Portugal, Colombia.
- Friction: three separate entry regimes (ESTA/B1-B2 for US, eTA/TRV for Canada,
  FMM for Mexico); a ticket is **not** entry permission; FIFA PASS offers priority
  visa appointments. ~80% of US hotels reported bookings below forecast — i.e.,
  there is unmet demand and price-sensitivity our tools can serve.

Sources:
- [2026 FIFA World Cup — Wikipedia](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup)
- [FIFA — Host Cities](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/host-cities)
- [FIFA — Travel, Visas, and FIFA PASS](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/travel-visas-fifa-pass)
- [U.S. Department of State — FIFA World Cup 26 Visas](https://www.state.gov/fifa-world-cup-26-visas)
- [FIFA — 500M+ ticket requests](https://inside.fifa.com/organisation/media-releases/over-500-million-ticket-requests-world-cup-2026-random-selection-draw)
