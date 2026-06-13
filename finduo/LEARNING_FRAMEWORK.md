# FinDuo Learning Framework 🧭
### The value system, architecture, and long-term plan behind every course
*学习的价值体系 · 架构 · 长期计划 — 所有课程的统一骨架*

> **Why this document exists.** A pile of lessons is not an education. Behind
> every FinDuo track there must be (1) a **value system** — *why* we learn,
> (2) an **architecture** — *how* knowledge is structured and connected, and
> (3) a **progression** — *the order* in which a learner climbs from beginner
> to mastery, with a realistic **long-term plan**. This file is that backbone.
> Individual course plans (Personal Finance, ML, Design…) are just the
> branches; this is the trunk. 这是树干，课程是树枝。

---

## Part 1 — The Value System (价值体系)

Five beliefs shape every lesson we write. They are the "constitution" courses
must obey.

1. **掌握而非覆盖 · Mastery over coverage.** It is better to truly own 10 ideas
   than to skim 100. A learner advances only when they can *use* a concept, not
   when they've merely *seen* it.
2. **理解而非记忆 · Understanding over memorization.** Every fact is taught with
   its *why*. If a learner can't explain it in their own words or apply it to a
   new case, they haven't learned it.
3. **由简至深 · Simple first, then deep.** Each idea is introduced with the
   smallest honest version, then layered. We never open with jargon.
4. **学以致用 · Learn by doing & shipping.** Knowledge becomes skill only
   through projects, practice, and "learning in public" (sharing progress — the
   social core of FinDuo). 做中学，公开学。
5. **诚实与现实 · Honesty & realism.** We state uncertainty, show the limits of
   each tool, and give an *achievable* time plan — no "master AI in a weekend"
   lies.

**The promise to the learner:** *follow the path, a little every day, and you
will not be left behind.* (不会在这个时代掉队。)

---

## Part 2 — The Learning Architecture (学习架构)

### 2.1 The Mastery Ladder — 6 tiers every track shares

Every domain, from money to machine learning, is cut into the **same six
tiers**. This shared shape is what lets a learner move between domains without
relearning "how to learn," and lets us reuse the app's mechanics everywhere.

| Tier | Name | Goal of this tier | Dreyfus stage |
|---|---|---|---|
| **T0** | ✨ Spark | Get curious; see why this matters to *your* life | — |
| **T1** | 🌱 Foundations | The core vocabulary + mental models | Novice |
| **T2** | 🧱 Core | The load-bearing concepts, done by hand | Adv. beginner |
| **T3** | 🛠️ Applied | Use it on real, messy problems | Competent |
| **T4** | 🚀 Advanced | Edge cases, trade-offs, depth, theory | Proficient |
| **T5** | 👑 Mastery | Create, teach, ship original work | Expert |

A learner is **never allowed to skip a tier** in a track (the path locks ahead),
but they *may* run several tracks in parallel at different tiers.

### 2.2 The atomic unit: Track → Unit → Lesson → Exercise

```
Track   (e.g. Personal Finance)        ← a whole domain, spans T0–T5
 └─ Tier (T1 Foundations …)            ← difficulty band
     └─ Unit (Budgeting Basics …)      ← a theme  (= the colored sections in FinDuo)
         └─ Lesson (Needs vs Wants …)  ← one sitting, 4–6 exercises, 15–20 min
             └─ Exercise               ← one question/interaction (mc, type, match…)
```

This is exactly the data shape the FinDuo app already uses
(`CURRICULUM → unit → lesson → q[]`), so the architecture is not theoretical —
it is the code.

### 2.3 The five pedagogical engines (how each lesson is built)

Every lesson is engineered with proven learning science, not vibes:

- **Retrieval practice** — we *ask*, not just *tell*; recalling beats rereading.
- **Spaced repetition** — older concepts resurface in later lessons & reviews.
- **Interleaving** — mixing question types/topics so skills don't stay siloed.
- **Worked example → faded practice** — show one fully, then remove scaffolding.
- **Immediate feedback + explanation** — every wrong answer teaches on the spot
  (the app's green/red feedback bar with a `why`).

### 2.4 Progression rules (mastery-based, not time-based)

- A lesson gives **crowns** (⭐). Re-doing a lesson at higher difficulty raises
  its crown level (1→3) — *that* is what "advancing to a more advanced zone"
  (往更进阶区) means concretely.
- A **Unit** is "cleared" only when every lesson has ≥1 crown.
- A **Tier** unlocks the next when ~80% of its units are cleared.
- **Spaced reviews** are required to keep a tier "fresh"; a streak 🔥 rewards the
  daily habit, leagues 🏆 reward weekly effort, badges 🏅 reward milestones.

---

## Part 3 — The Eight Tracks (八大学习轨道)

All eight share the T0–T5 ladder. Below is each track's progression spine and a
**capstone** (the T5 "prove it" project). *Personal Finance is fully built in
the app today; the rest are sequenced and ready to author into the same shape.*

> **Sequencing note:** difficulty and prerequisites differ. Finance, Art, and
> Design are **entry tracks** (no prerequisites). ML → Deep Learning → LLMs →
> AI Agents is a **dependency chain**. Private Equity sits on top of Finance.

### 🟢 Track 1 — Personal Finance & Wealth (个人理财) · *live in app*
- **T0 Spark:** "Why money skills decide your freedom."
- **T1 Foundations:** budgeting, needs vs wants, 50/30/20.
- **T2 Core:** saving, emergency fund, debt & credit, interest.
- **T3 Applied:** compound interest, the Rule of 72, avoiding scams & fees.
- **T4 Advanced:** investing, diversification, index funds, retirement accounts.
- **T5 Mastery:** build & run a personal 12-month financial plan; teach someone.
- **Capstone:** a written net-worth plan + automated budget that you actually use.

### 🔵 Track 2 — Machine Learning (机器学习)
- **T1:** what is ML; data, features, labels; train vs test; over/underfitting.
- **T2:** linear & logistic regression, decision trees, k-NN — by hand on toy data.
- **T3:** the full pipeline: clean → split → train → evaluate (accuracy, precision/recall, ROC).
- **T4:** ensembles (random forests, boosting), regularization, cross-validation, bias/variance.
- **T5:** unsupervised learning, feature engineering, deploying a model.
- **Prereq:** comfort with basic algebra + a little Python (a "Tooling" mini-track).
- **Capstone:** ship a model on a real dataset with an honest evaluation writeup.

### 🟣 Track 3 — Deep Learning (深度学习) · *prereq: ML T3*
- **T1:** neurons, layers, activation, forward pass; why "deep."
- **T2:** gradient descent & backpropagation — computed by hand once.
- **T3:** training real nets: loss curves, batches, learning rate, regularization/dropout.
- **T4:** CNNs (vision), RNNs/sequence models, embeddings, transfer learning.
- **T5:** the Transformer & attention; modern architectures.
- **Capstone:** train and fine-tune a small neural net; explain every layer.

### 🟠 Track 4 — Large Language Models (大语言模型) · *prereq: Deep Learning T4*
- **T1:** tokens, context windows, next-token prediction — the core intuition.
- **T2:** pretraining vs fine-tuning vs RLHF; what a "base" vs "chat" model is.
- **T3:** prompting well; system prompts; structured output; evaluation of outputs.
- **T4:** retrieval-augmented generation (RAG), embeddings & vector search, tool use / function calling.
- **T5:** context engineering, caching, cost/latency trade-offs, safety & limits.
- **Capstone:** build a small RAG-powered assistant and measure its quality honestly.

### 🔴 Track 5 — AI Agents (AI 智能体) · *prereq: LLMs T4*
- **T1:** what makes an "agent" (perceive → plan → act → observe loops).
- **T2:** tools/function-calling; giving a model real abilities safely.
- **T3:** memory, state, and multi-step task decomposition.
- **T4:** multi-agent systems, orchestration, evaluation & guardrails.
- **T5:** reliability, cost control, human-in-the-loop, deployment.
- **Capstone:** design & ship an agent that completes a real multi-step task end-to-end.

### 🟤 Track 6 — Private Equity & Investing (私募股权与投资) · *prereq: Finance T4*
- **T1:** what PE is — buy, improve, sell; public vs private markets.
- **T2:** reading financials (revenue, margins, cash flow, valuation multiples / P-E).
- **T3:** the buyout: leverage (LBO), value creation, exits.
- **T4:** fund structure — LPs, GP, fund, management fee + carry; the J-curve & IRR.
- **T5:** diligence, deal modeling, portfolio strategy; adjacent worlds (VC, IB, asset mgmt, family office).
- **Capstone:** a one-page investment memo on a real company with a simple model.

### 🎨 Track 7 — Art (艺术) · *entry track*
- **T1:** seeing — line, shape, value, proportion; daily observational sketching.
- **T2:** the fundamentals — perspective, light & shadow, anatomy/gesture, color theory.
- **T3:** composition & visual storytelling; studies from masters.
- **T4:** medium depth (digital, paint, etc.); developing a personal voice.
- **T5:** finished original pieces; a coherent portfolio.
- **Capstone:** a small body of original work + an artist statement.

### 🟡 Track 8 — Design (设计) · *entry track*
- **T1:** design thinking — empathy, the problem, the user; the principles (contrast, alignment, hierarchy, spacing).
- **T2:** typography, color, layout, grids.
- **T3:** UX flows, wireframes, prototyping, usability testing.
- **T4:** design systems, accessibility, interaction & motion.
- **T5:** end-to-end product design; critique & iteration.
- **Capstone:** redesign a real product/flow with a documented rationale.

---

## Part 4 — The Long-Term Plan (长期学习计划)

A framework without a calendar is a wish. Here is how the tiers turn into time.

### 4.1 The dependency map (what unlocks what)

```
ENTRY (no prereqs):  Personal Finance ──► Private Equity
                     Art ──► Design (and they cross-feed)
                     Tooling/Python (mini)

CHAIN:   Machine Learning ──► Deep Learning ──► LLMs ──► AI Agents
                 ▲                                   │
                 └──────── Tooling/Python ───────────┘

CROSSOVERS (where two tracks combine into a superpower):
  • ML + Finance        → quantitative investing / fintech
  • LLMs/Agents + Design → AI product design
  • PE + Finance         → professional investing
  • Art + Design         → visual product craft
```

### 4.2 A realistic multi-year cadence

We assume ~30–45 min/day, ~5 days/week (the streak habit). Adjust to taste.

- **Year 1 — Foundations everywhere you care about.**
  Pick **one entry track** as your anchor (most people: Personal Finance) and
  carry it to T3–T4. Add **one creative track** (Art *or* Design) at T1–T2 for
  balance. If aiming at AI, start **Tooling/Python + ML T1–T2** in parallel.
  *Outcome:* real competence in money + a creative habit + ML basics.

- **Year 2 — Go deep on a chain.**
  Anchor track to **T5 (capstone)**. Push the AI chain: **ML T3–T5 → Deep
  Learning T1–T3.** Take your creative track to **T3 (composition / UX)**.
  *Outcome:* one finished mastery capstone; deep-learning literacy.

- **Year 3 — Specialize & combine.**
  **Deep Learning T4–T5 → LLMs T1–T4.** Add **Private Equity** (if finance is
  your thing) or **AI Agents T1–T3**. Start working a **crossover** project.
  *Outcome:* you build real AI systems *and* have a second domain to combine.

- **Year 4+ — Mastery & creation.**
  **LLMs T5 → AI Agents T4–T5**, or **PE T4–T5.** Everything becomes
  project-driven; you now *make and teach*, which is the real T5.

### 4.3 The weekly rhythm (how a single week looks)

- **Mon–Fri:** 1 new lesson/day on your anchor track (keep the 🔥 streak).
- **2×/week:** a **spaced review** session (older lessons resurface).
- **1×/week:** a **project block** (30–60 min) applying what you learned.
- **Weekly:** check the 🏆 league (effort, not cramming); **share progress** to
  stay accountable (learning in public).
- **Monthly:** a **retrospective** — what stuck, what to re-do for more crowns,
  what tier to push next.

### 4.4 How progress is measured (so "advanced" means something)

| Signal | What it proves | App mechanic |
|---|---|---|
| Crowns ⭐ on a lesson | depth of mastery of that idea | re-do at higher difficulty |
| Unit cleared ✅ | a theme is owned | all lessons crowned |
| Tier unlocked | ready for harder material | ~80% of units cleared |
| Capstone shipped | real-world skill | the T5 project + share card |
| Streak 🔥 / League 🏆 | the *habit* that makes it all work | daily/weekly engagement |

---

## Part 5 — How the framework maps onto the FinDuo app

This is not abstract — the app is the delivery vehicle:

- **Tracks** = top-level subjects (a track switcher; Personal Finance is live,
  others appear as roadmaps until authored).
- **Tiers** = difficulty bands shown along the path; the path **locks ahead** to
  enforce "no skipping."
- **Units / Lessons / Exercises** = exactly today's `CURRICULUM` data shape.
- **Crowns / XP / Streak / League / Badges** = the progression + habit engine.
- **Share card** = "learning in public," the accountability value made real.
- **`Store` object** = the one seam where local progress becomes a real
  cross-device, worldwide profile when a backend is added (see README).

**To add a new track,** an author writes its units/lessons in the same JSON
shape, tags each unit with its tier, and the existing engine handles paths,
locking, scoring, sharing, and leagues automatically. The framework *is* the
spec for that authoring.

---

## Part 6 — Authoring checklist (writing a course that obeys the framework)

Before any new lesson ships, it must pass this gate (门禁):

- [ ] Maps to exactly one **tier** and states its prerequisite.
- [ ] Opens with the **smallest honest version** of the idea (no cold jargon).
- [ ] Teaches the **why**, not just the what.
- [ ] Uses **retrieval** (asks the learner to *do*), not just exposition.
- [ ] Every wrong answer has an **explanation** that teaches.
- [ ] **Resurfaces** at least one earlier concept (spaced repetition).
- [ ] Ends a unit with an **applied task** (learn-by-doing).
- [ ] Has a clear **mastery signal** (what earns the crown).
- [ ] Is **honest** about limits and realistic about time.

---

*This framework is the trunk. Every course plan is a branch that must connect to
it. Keep the trunk strong and the tree grows in any direction — money, machines,
or art. 把树干养壮，树就能往任何方向生长。*
