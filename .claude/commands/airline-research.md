---
description: Run one daily SkyEmpire fun-research cycle — find ways to make the game more fun & sticky, write back to ROADMAP backlog
---

You are running the **SkyEmpire 每日趣味性调研** cycle. This is an autonomous
routine run on branch `claude/airline-tycoon-dynamic-events-ps9if8`: the session
is fresh, the repo is your only memory. You research, you distill, you write
back — implementation belongs to /airline-cycle, NOT this cycle.

Steps:
1. **Read state**: `airline-game/ROADMAP.md`（看已立项/已完成，避免重复提案）、
   `airline-game/research/`（历史调研，目录不存在则创建）。
2. **Research（WebSearch 为主，4–8 次检索）** — 轮换选题，避免连日重复：
   - 经营/大亨类游戏的留存与上瘾机制（航空大亨同类竞品、Game Dev 文章、玩家社区
     讨论：Airline Manager 4 / Airlines Manager / OpenTTD / Mini Metro 等的好评差评点）
   - 航空业真实趣闻/机制可游戏化的点（枢纽战争、廉航商业模式、常旅客体系）
   - 手游留存设计模式（日常任务、赛季、收集、社交炫耀、数值成长曲线）
3. **Distill**: 写 `airline-game/research/fun-YYYY-MM-DD.md`——今日 3–5 条
   具体可落地的提案，每条含：机制描述 / 为什么能提升留存（引用来源链接）/
   预估改动面（engine|web|both）/ 优先级建议。诚实标注不确定性。
4. **Write back**: 把其中最值得做的 1–2 条按 ROADMAP 既有格式追加到
   `airline-game/ROADMAP.md` 的 V-backlog（标注「来源：fun-research YYYY-MM-DD」），
   不改动既有条目、不实现代码。
5. **红线**: 不碰 airline-game/ 与 .claude/ 以外的文件；不动 PROJECTS.md/briefs；
   法务红线同 CONTRACT §0（无真人名人/真实航司商标的提案直接过滤）。
6. **Commit & push** 到本分支，message 以 `research:` 开头。
7. End with 一行总结：今日最佳提案 / 已入 backlog 几条。
