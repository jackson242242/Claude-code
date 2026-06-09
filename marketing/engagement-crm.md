# Engagement → Booking CRM Charter

**Owner:** Amelia (Brand / PM) · **Status:** v1 draft for review · **Surfaces:** AI Concierge (`ChatWidget`), Anticipatory Notebook (`ContextNotebook`)

> This is the "psychology" layer the owner asked for — designed to keep fans
> curious and move them toward booking. It is deliberately **ethical**: we earn
> conversions with genuinely useful, honest help, not dark patterns. Honesty
> first (诚实第一) is a hard rule, not a preference.

---

## 1. The one principle

**Be the most helpful friend a travelling fan has.** Every nudge must pass one
test: *would a knowledgeable friend say this?* A friend points you to a great
hotel near the stadium; a friend does **not** invent "2 rooms left!" to rush you.
If a tactic only works because the user is misled or pressured, we don't ship it.

---

## 2. The funnel (and which surface owns each stage)

| Stage | Fan mindset | What we do | Primary surface |
|---|---|---|---|
| **Discover** | "The World Cup is coming." | Real fixtures, host-city imagery, fan footage. | Home / News |
| **Explore** | "Could I actually go?" | Anticipate the city/match they hover; surface a one-line "here's where to start." | **Notebook** |
| **Plan** | "What would the trip look like?" | Answer logistics, assemble the pieces (stay + flights + transport). | **Concierge** |
| **Book** | "Let's do it." | Hand off to the relevant in-app booking step with the city/date pre-set. | Both → Hotels/Flights/Transport |
| **Trip** | "I'm going!" | Saved trip, countdown, fan footage from their city. | Trips |

The two AI surfaces are intentionally split: the **Notebook** lowers the
activation energy of *Explore* (zero typing, just hover), and the **Concierge**
does the conversational work of *Plan → Book*. The notebook's "Ask the
concierge →" button is the handoff seam between them.

---

## 3. Ethical engagement levers (and their guardrails)

Behavioural science works; we use it only where the underlying fact is true.

| Lever | How we use it | Hard guardrail |
|---|---|---|
| **Curiosity gap** | "Group C preview: who travels to Dallas" — a real question with a real answer one tap away. | The payoff must exist and be honest. No clickbait that under-delivers. |
| **Personalisation** | Notebook reflects the exact city/fixture under the cursor. | Heuristic + on-device only. No tracking, no profile-building, no stored cursor data. |
| **Progress / endowment** | A started trip ("3 cities saved") that the fan wants to complete. | Never fabricate progress the fan didn't make. |
| **Social proof** | Real fan footage and editorial briefs. | Sourced, sports-only, never fabricated. |
| **Scarcity / urgency** | Only when a real provider returns real limited availability or a real deadline. | **No fake countdowns or invented "X left".** This is the brightest line. |
| **Reciprocity** | Give genuinely useful answers for free, every time. | The help is real whether or not they book. |

---

## 4. Concierge "psychology", concretely

The system prompt (`src/lib/assistant.ts`) encodes this:

- **Stay curious-positive, one question at a time.** End replies with a single
  helpful follow-up that advances the plan — not an interrogation.
- **Always leave a next step.** When intent is clear, name the in-app step
  (Schedule / Hotels / Flights / Transport). Suggest, don't shove.
- **Concision = respect.** Short, scannable answers keep momentum.
- **Honest deflection.** Unknown price/availability/result → say so and point to
  where it can be checked live. Never bluff a number.
- **Sports + travel only.** Politely decline off-scope topics (politics, legal,
  medical, betting). Protects brand safety and the fan.

---

## 5. Notebook "psychology", concretely

- **Anticipate, don't interrupt.** It appears on dwell (debounced hover), never
  on load, never as a modal; it never takes focus.
- **One idea, one action.** A single line of context + one primary CTA + the
  concierge handoff. No walls of text.
- **Always dismissible, and it remembers.** A dismissed card stays gone until a
  genuinely different context appears. "No" is respected.

---

## 6. Consent, privacy & accessibility

- No PII collected by these surfaces; the notebook reads only rendered
  `data-ctx-*` attributes (no cursor telemetry, no storage).
- Chat history lives only in component state for the session.
- `prefers-reduced-motion` is honoured (no animation forced on).
- Everything is keyboard-reachable with visible focus and ARIA labels.

---

## 7. KPIs (and counter-metrics)

We pair every growth metric with a guardrail metric so "engagement" can't be
gamed at the user's expense.

| Goal metric | Counter-metric (must not regress) |
|---|---|
| Concierge open-rate & messages/session | Dismiss/close rate; "unhelpful" sentiment |
| Notebook → booking-step click-through | Notebook dismissal rate (proxy for annoyance) |
| Assisted-booking rate (booking after AI touch) | Refund/cancel rate; complaint rate |
| Return visits | Unsubscribe / opt-out rate |

If a change lifts a goal metric while worsening its counter-metric, it fails.

---

## 8. Do-not list

- ❌ Fake scarcity, countdowns, or "others are viewing" without real data.
- ❌ Guilt / shame / FOMO-by-fabrication ("don't be the only one who missed it").
- ❌ Hiding the close/dismiss control, or re-popping after dismissal.
- ❌ Inventing scores, prices, availability, or guarantees.
- ❌ Auto-DMs / off-platform messaging the fan didn't ask for.
- ❌ Dual-use of the cursor signal for anything beyond the visible suggestion.

---

## 9. Review & rollout

Per project governance: design/brand reviews this charter (Sheng + 龙哥 on tone
and aesthetics), it goes through the standard gate (typecheck / test / lint /
build), and ships behind preview before merge. Live AI replies require the owner
to grant `ANTHROPIC_API_KEY` and allow-list `api.anthropic.com`; until then the
concierge serves an honest degraded message rather than pretending to think.
