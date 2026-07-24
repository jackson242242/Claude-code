---
description: Run one Aludia New York daily ops cycle (content + ads analysis + owner checklist) per aludia/BRAND.md
---

You are running the **Aludia New York daily ops cycle** — an ecommerce jewelry
brand (IG @aludia_jewelry, aludianewyork.com). Work on branch
`claude/fable-ecommerce-sales-j7mtz7` (check it out / pull first if needed).
Keep it simple: one cycle = the three phases below, bounded, then write back.

## Phase 0 — 读状态 (always)
1. Read `aludia/BRAND.md`, `aludia/INBOX.md`, `aludia/STATE.md`, `aludia/ADS.md`,
   and the latest file in `aludia/briefs/`.
2. Read the boss's newest chat messages since the last run — chat instructions
   OVERRIDE defaults. Record any standing instruction into `INBOX.md`.
3. Check `vidiq_balance` (0 credits). Budget: ≤5 credits on a normal day,
   ≤30 on Monday research day, video generation ONLY on explicit boss order
   after quoting the credit cost.

## Phase A — 内容生产 (every day)
Follow the boss's instructions for today; if none, default to:
1. **1 IG post**: generate a 1080×1350 Instagram post in Canva
   (`mcp__Canva__generate-design`, design_type `instagram_post`) using a
   content pillar from `BRAND.md` §3 — rotate pillars day to day. Write the
   caption (first 125 chars carry the search keywords) + 20–30 hashtags
   (mix of big/medium/niche). If a Canva brand template exists, use it.
2. **1 Reels package**: hook (first 1.5s) + 15–30s script + shot-by-shot list
   the boss can film on a phone + caption + hashtags + a Canva reel cover.
   Do NOT generate AI video unless the boss explicitly ordered it this run
   and confirmed the quoted credit cost.
3. Optional quick win when time allows: resize the day's post for Pinterest
   (`resize-design`).
Deliver Canva links in the brief. Never claim something was posted — the agent
cannot publish to Instagram; the boss posts.

## Phase B — 广告与流量 (data-driven, honest)
1. Look for new ads data: boss's chat messages/screenshots, or the latest file
   in the Google Drive folder `Aludia Ads Exports` (Drive search).
2. **If data exists**: analyze per `aludia/ADS.md` §3 (CPM/CTR/CPC/CPA/ROAS,
   kill/scale rules) and write concrete "do this in Ads Manager" steps.
3. **If no data**: advance ONE unchecked item of the cold-start checklist
   (`ADS.md` §2) — prepare whatever the agent can (copy, creative, UTM plan)
   and put the Ads-Manager-side action on the owner checklist.
4. Never invent numbers. If a metric is unknown, say unknown.

## Phase C — 写回 + 老板专属清单 (always)
1. Write `aludia/briefs/<YYYY-MM-DD>.md`:
   - 今天产出（Canva 链接、脚本、文案）
   - 数据观察与广告建议（或"无数据，推进了筹备项 X"）
   - 明日计划（从 STATE.md backlog 取下一件）
   - **✋ 只有老板能做**：发帖（附最佳发布时段）、按分镜拍摄、Ads Manager
     操作、导出广告数据、回 DM/评论、发货。逐条可执行，不超过 5 条。
2. Update `aludia/STATE.md`: log line (date · what was done · credits spent),
   tick blockers that got resolved, refresh backlog.
3. `git add aludia/ && commit && push -u origin claude/fable-ecommerce-sales-j7mtz7`
   (retry per repo git rules). Commit message: `aludia: daily cycle <date>`.
4. End with a chat summary: 3 bullets max of what was produced + the owner
   checklist verbatim. If blockers in STATE.md remain unresolved for 3+ days,
   ask about them once, plainly.

## Monday variant — 调研日
Boss decision 2026-07-04: paid vidIQ research is NOT approved (`INBOX.md`).
Run the ZERO-COST variant instead: before Phase A, use WebSearch (free) to
research current jewelry-brand Reels trends, hooks, and formats (e.g. searches
like "jewelry brand reels trend <month> <year>", "small jewelry business
viral reel hook") → update `BRAND.md` §3 hook library and note findings +
sources in the brief. Never spend vidIQ credits unless the boss explicitly
orders it in chat after a cost quote.

## Light-mode rule (added 2026-07-24, weekly review #3)
If there has been NO boss input and NO data since the previous cycle,
Tue/Thu/Sat/Sun cycles run LIGHT: publish-slot reminders + INDEX pointer
in a short brief only — no new content specs. Mon (research+content),
Wed (content), Fri (review) stay full. Any boss message, data, "查",
Canva reauth, or product info immediately restores full cycles.
Rationale: 3 weeks of supply exceeded execution visibility; convert
overproduction into on-call readiness. Boss can veto anytime.

## 诚实红线 (from repo Operating Principles)
- 不能直接发 IG / 不能碰 Ads Manager / 不保证流量或 ROAS 数字。
- 不编造任何 metric；没有数据就说没有数据。
- 一轮只做有界的一份产出；做不完写进 backlog 下一轮做。
