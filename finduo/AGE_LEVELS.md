# FinDuo Personal Finance — Age Levels 🎚️
### 分级：6–20 岁分成 5 段，每段有自己的内容 + 自己的审美
*How the Personal Finance track is split by age, and why each age gets its own look.*

> **Short answer / 简答:** Yes — Personal Finance is now split into **5 age
> stages** covering **ages 6–20**. Each stage has (1) its own age-appropriate
> **lessons**, and (2) its own **visual design / aesthetic** that re-skins the
> whole app. A learner (or parent) picks the stage at the start and can switch
> anytime in the Profile tab. XP, streak, and badges follow the learner across
> stages.

Why 5 (and not 3 or 8)? Because childhood money-understanding changes in clear
developmental jumps — a 7-year-old counts coins, a 13-year-old runs a side
hustle, a 19-year-old signs a lease. Five bands match those jumps without being
so many that the product feels fragmented. 五段对应孩子认知的自然跳跃。

---

## The 5 stages at a glance

| # | Stage | Ages | Mascot | Big idea | Reading load |
|---|---|---|---|---|---|
| 1 | 🐣 **Sprouts** | 6–8 | Chick | What money is; save vs spend | Tiny, picture-led |
| 2 | 🦊 **Explorers** | 9–11 | Fox | Spend/Save/Give jars; goals; banks | Short sentences |
| 3 | 🐲 **Trailblazers** | 12–14 | Dragon | Budgets, side hustles, compounding | Medium |
| 4 | 🦅 **Founders** | 15–17 | Eagle | Income, taxes, credit, investing start | Real-world |
| 5 | 🦉 **Navigators** | 18–20 | Owl | Full independence: loans, retirement | Adult |

The mascots deliberately "grow up" with the learner: **chick → fox → dragon →
eagle → owl** (baby animal to the wise owl). It signals progression and lets an
older kid feel the product respects them, not babies them. 吉祥物随年龄成长。

---

## Design principle: one product, five skins (审美随年龄进化)

A single visual style **cannot** serve both a 6-year-old and a 20-year-old — one
needs candy-bright playfulness, the other needs a clean, grown-up fintech feel.
So FinDuo **re-themes itself per stage**. Selecting a stage instantly changes:

- **Color palette** (primary/accent).
- **Corner radius** — very round for little kids → tighter/sharper for older.
- **Type scale** — larger, chunkier text for young readers → compact for adults.
- **Font feel** — rounded/handwritten vibe → clean system font.
- **Mascot & tone** of the copy.

This is implemented in code as a `theme` object on each age band
(`AGE_BANDS[n].theme`) that sets CSS variables via `applyTheme()`. You can
literally watch the whole app re-skin when you tap a different age in the
onboarding screen (live preview). 换年龄，整个界面实时换肤。

### Per-stage aesthetic direction

**🐣 Sprouts (6–8) — "Candy playground"**
- Palette: warm pink `#ff7aa2` + sunshine yellow. Soft pastel background.
- Shape: extra-round corners (26px), big buttons, huge emoji.
- Type: largest scale (×1.16), playful rounded/handwritten font.
- Tone: 4–8 words per idea, one concept per lesson, lots of pictures. No jargon.
- Feel: *a friendly picture book you can tap.* 像会动的绘本。

**🦊 Explorers (9–11) — "Adventure quest"**
- Palette: energetic Duolingo-green `#58cc02` + gold. Fresh, bright.
- Shape: round (20px), still chunky and friendly.
- Type: large (×1.05), clean rounded font.
- Tone: short sentences, quests, jars, goals, mild challenge.
- Feel: *a fun game world with a map to explore.*

**🐲 Trailblazers (12–14) — "Cool gamer"**
- Palette: bold purple `#7c4dff` + electric teal accent. Vivid, a little edgy.
- Shape: medium corners (16px). Less "kiddie."
- Type: standard scale, modern.
- Tone: budgets, FOMO/ads awareness, side hustles, first taste of compounding.
- Feel: *a game that treats you like a young teen, not a kid.* 不再幼稚。

**🦅 Founders (15–17) — "Confident & sleek"**
- Palette: electric indigo `#2962ff` + orange accent. Sharp, modern.
- Shape: tighter corners (14px), slightly denser layout.
- Type: slightly compact (×0.98).
- Tone: real money — paychecks, taxes, debit vs credit, credit scores, investing.
- Feel: *a serious tool for someone about to earn and spend for real.*

**🦉 Navigators (18–20) — "Grown-up fintech"**
- Palette: refined teal `#0e8f7e` + amber, near-black ink `#111827`.
- Shape: tight corners (12px), clean and minimal.
- Type: compact (×0.96), clean system/Inter-style font.
- Tone: independence — student loans, emergency fund, index funds, retirement.
- Feel: *a polished adult finance app.* 像成年人的理财 App。

---

## What each stage teaches (curriculum spine)

Every stage is 2–3 units × ~2 lessons, each lesson 3–4 quick exercises
(multiple-choice, true/false, type-the-answer, select-all). Content climbs the
same ladder — *what money is → saving → spending wisely → earning → growing → real-world systems* — but pitched at the right age.

### 🐣 Sprouts (6–8)
- **Money 101:** what money is; recognizing money; earning by helping; keeping money safe.
- **Smart Choices:** need vs want; saving for a small goal; patience.

### 🦊 Explorers (9–11)
- **The Three Jars:** Spend / Save / Give; setting and tracking a goal.
- **Banks & Smart Shopping:** what a bank is; interest (kid version); comparing prices; spotting ads.

### 🐲 Trailblazers (12–14)
- **Budget Your Money:** what a budget is; tracking; wants vs FOMO; the 24-hour rule.
- **Grow & Earn:** compound interest & the Rule of 72; a first side hustle; profit = revenue − cost.

### 🦅 Founders (15–17)
- **Real Money Basics:** income & taxes 101 (gross vs net); the 50/30/20 budget; pay yourself first.
- **Cards, Credit & Growth:** debit vs credit; interest traps; credit scores; starting to invest.

### 🦉 Navigators (18–20)
- **Budgeting Mastery:** own your cash flow; automation; emergency fund.
- **Debt, Loans & Credit:** student loans; good vs bad debt; credit-score management.
- **Investing & Retirement:** compounding & index funds; retirement accounts; spotting scams.

> The 18–20 stage reuses the deeper Personal Finance course already written, so
> it is the most complete today. The younger four stages ship with a solid
> **starter set** (2 units each) built in the same engine — enough to be fully
> playable and to prove the age-adaptive design — and are structured to be
> extended lesson-by-lesson using `LEARNING_FRAMEWORK.md`'s authoring checklist.

---

## Stability & "playable, fun" (稳定 · 可玩 · 有趣)

The three things you asked for, and how they're met:

- **稳定 Stable:** the app is a single self-contained HTML file — no server, no
  network, no login required. It can't "go down." Progress is saved locally and
  survives refreshes. (A future server only *adds* the global leaderboard; it is
  never required for the app to run.)
- **可玩 Playable:** real game loop — a lesson path that unlocks step by step,
  hearts ❤️, XP 💎, a daily-goal ring 🎯, streaks 🔥, weekly leagues 🏆, and
  achievement badges 🏅. Five interaction types keep it hands-on, not read-only.
- **有趣 Fun & age-right beauty:** the five skins mean a 6-year-old gets bright,
  bouncy candy colors and a 19-year-old gets a sleek fintech look — each age sees
  a product that looks made *for them*. That is the "产品负责 6–20 岁审美" bit,
  built in.

---

## How to use it

1. Open `index.html`. On first run, pick the learner's **age stage** (grown-ups
   choose for young kids) — the app re-skins live as you tap each option.
2. Learn a lesson or two a day; keep the 🔥 streak.
3. To change stage later (a birthday, or a younger sibling): **Profile →
   🎚️ Change age level**. XP and streak carry over.

*Five stages, one journey — from a 6-year-old's first coin to a 20-year-old's
first index fund. 从第一枚硬币到第一支基金。*
