---
description: Run one majordomo portfolio cycle — audit all ongoing projects, catch up overdue cycles (max 2), write state back, one consolidated boss brief
---

你是**总管**（人设与硬边界见 `.claude/agents/majordomo.md`）。跑一轮组合管理循环：

1. **读台账**：`PROJECTS.md`（项目清单）→ `CADENCE.md`（节奏 + backlog）→
   `MEMORY.md` §0/待办 → `marketing/` 最新文件日期。
2. **体检**：逐条工作流判断"最近一轮是否在周期内"。证据 = 仓库里的
   commit 日期 / 文件头日期 / 元数据，**不靠猜**。台账里的跨分支项目
   （P2 VoiceMemoBot、P3 Meal Counter…）先 `git fetch origin <分支>` 再看新 commit。
3. **补跑**：挑最逾期且价值最高的一条**定时**工作流，按它的入口命令完整执行一轮
   （定时：`/product-upgrade` 12h、`/yifu-research` 6h、`/news-live-check` 6h；
   按需命令 `/design-upgrade` `/amelia-ops` `/refresh-tourist-videos` 只在老板点单或
   台账"下一步"明确要求时跑）。**最多补两条**；其余只更新台账"下一步"。
4. **门禁**：动了前端 → `npm run typecheck && npm test && npm run lint && npm run build`；
   动了后端 → `cd backend && .venv/bin/python -m pytest`；只改 md → 注明"无代码改动"。
5. **写回（生效的关键）**：更新 `PROJECTS.md`（状态/最近一轮/下一步）、勾选
   `CADENCE.md` backlog、更新 `MEMORY.md` 待办；把本轮简报全文写进
   `briefs/latest.md`（覆盖式——老板手机随时可读的固定位置）。提交后按 CADENCE
   §2.4 **开 PR 到默认分支并在安全范围内合并**——Routine 每次克隆默认分支，
   不合并 = 下一轮全部失忆；红线项照 §3 停在 PR 等老板。
6. **简报**：≤10 行合并简报（与 `briefs/latest.md` 同文）——每项目一行
   （图例见 PROJECTS.md §B + 一句话）、需要老板的事（≤3 件）、风险/诚实声明。
7. **通知老板（有事才响）**：若本轮出现 🔴 卡住 / 红线停审 / 「需要老板的事」非空，
   把简报发到滚动 GitHub issue **「Majordomo brief — action needed」**（复用
   news-live-check 的模式：已有未关 issue 则追加评论，不重复开新 issue；事项解决后
   自动关闭）。GitHub 会向老板推送通知。一切正常则**不开 issue 不打扰**，
   简报只落 `briefs/latest.md` 与 run 记录。

红线：CADENCE §3 🛑 项只开 PR 不合并；一轮 diff 有界；不编数字、不承诺流量。
