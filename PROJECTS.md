# 项目组合台账 (PROJECTS.md)

> 总管（`.claude/agents/majordomo.md`）的唯一项目清单。老板只跟总管对话；
> 总管按本台账管理所有进行中项目。每轮 `/pm-cycle` 先读本文件、后写回。
> 最后更新：2026-06-11 06:15 UTC（pm-cycle：补跑产品升级〔开赛日 LIVE 态 HeroLiveStrip 上线，156FE/70BE 全绿〕+ 新闻检查〔PASS；Actions run#6 02:56 两站 OK，6/6 全绿〕；调研 06:30 到期留下轮第一优先；P2 深夜 4 commit（Wear OS+混音+情绪计划）自动进 PR #29 仍 dirty；P3 凌晨重构学习平台）

## A. 进行中项目

### P1 · Matchday26 — 2026 世界杯旅游导览（本仓库）
线上 `worldcup-web-03eq.onrender.com` ｜ 部署分支 `claude/zombie-spawner-waves-2l6Vb`
｜ 节奏与红线详见 `CADENCE.md`

| 工作流 | 周期 | 入口 | 状态 | 最近一轮（证据） | 下一步 |
|--------|------|------|------|------------------|--------|
| 产品升级 | 12h | `/product-upgrade` | 🟢 | 2026-06-11 06:10（**开赛日 LIVE 态**：倒计时归零→`HeroLiveStrip` LIVE 徽章+今日赛程条，7/19 决赛后自动退场；156FE/70BE/lint/build 全绿）；下次到期 ~06-11 18:10 | 下件事：多城市「追随球队」引擎（P0），或 LIVE 条"进行中"高亮（先评估状态数据可行性）；激活真实 feed 仍需老板配 `SCHEDULE_FEED_URL` |
| 市场调研 | **6h** | `/yifu-research` | 🟡 | 2026-06-11 00:30（开赛日增量：二手票市场「劈叉」；官方 resale 开球前 1h 可买；Fan Zone 全面开张）；06:30 到期，本轮两条补跑额度已用于产品+新闻 | **下轮 pm-cycle 第一优先补跑**（揭幕战赛果/现场反应是新窗口） |
| 设计升级 | 按需 | `/design-upgrade` | ⚪ | 2026-06-10（`dcf32a3` 亮色 Phase 4 → 撤定时） | 老板点单或 pm-cycle 判断需要时跑（Phase 5 在 backlog） |
| 网站运营 | 按需 | `/amelia-ops` | ⚪ | 2026-06-05（`marketing/ops-2026-06-05.md` → 撤定时） | 老板点单或发布节点前跑 |
| 新闻健康检查 | 6h | `/news-live-check` | 🟢 | 2026-06-11 06:10 补跑（retest PASS 156FE/70BE 87%cov + lint/build；site-health Actions run#6 02:56 两站 OK，cron 6/6 全绿；沙箱探针仍 403） | 随下轮 pm-cycle 覆盖 |
| 素材刷新 | 按需 | `/refresh-tourist-videos` | ⚪ | 见 tourist-videos 数据时间戳 | 视频失效（404）时触发 |

> 节奏由老板 2026-06-10 裁决精简：定时只留产品 12h + 调研 6h（+新闻检查 6h）；设计/运营转按需（命令保留，能力不丢）。

### P2 · VoiceMemoBot — 语音备忘 → AI 音乐 remix → 自有社交 Feed
**位置：本仓库分支 `claude/inspiring-dirac-j8ar6q`（PR #23 → 部署分支）**，代码在
`voice-memo-watch/`（FastAPI 后端 + watchOS Swift app + 浏览器原型 UI，自带 pytest）。

| 工作流 | 周期 | 入口 | 状态 | 最近一轮（证据） | 下一步 |
|--------|------|------|------|------------------|--------|
| 产品迭代 | 随 pm-cycle 体检 | （暂无专属命令） | 🟡 | 2026-06-11 01:29–02:58 分支再推 4 commit（`b111225` Wear OS app、`7cdf964` 2026 流行配色+引导音效提示、`d6b9145` 多轨混音+收藏+上线 runbook、`328bec9` 手表健康数据情绪体验计划+DB schema），全部自动进 PR #29（现 8 commits +4226/-180）；**PR #29 仍 dirty——冲突仍只在 PROJECTS.md + briefs/latest.md 两台账文件** | 老板合 PR #29 时在 GitHub UI 解冲突（两台账文件**选默认分支版本**即可）；或授权总管代解；注意 `328bec9` 含 DB schema 计划，合并前值得过目 |
| 站点健康 | 30min cron（已生效） | `.github/workflows/site-health.yml` | 🟡 **cron 在跑，探测未含本站** | 2026-06-11 02:56 run #6 success（累计 6/6 全绿）：worldcup-web/api 均 OK；`VOICEMEMOBOT_URL` 仍未填（探测仍只含两 worldcup 站） | **老板**：Render 仪表盘拿 `voicememobot-api` URL → 填 repo Variables `VOICEMEMOBOT_URL`（agent 无该权限）；填后探测自动含本站，不可达即开 `site-down` issue |

**总管审计方式：** 同仓库即可达——每轮 `git fetch origin claude/inspiring-dirac-j8ar6q`
看新 commit / 测试状态 / CI。**进展（2026-06-11 06:15 UTC）：** 分支深夜高产——
01:29–02:58 再推 4 commit（Wear OS 双平台、2026 流行配色+引导音效、多轨混音+收藏+
上线 runbook、健康数据情绪体验**计划含 DB schema**），全部自动进 PR #29（8 commits、
+4226/−180、45 文件）。PR #29 仍 dirty——冲突仍只在 PROJECTS.md / briefs/latest.md
两台账文件，代码零冲突。总管不推他人分支（边界），解法不变：老板 UI 合并时两台账
文件选默认分支版本，或授权总管代解。site-health cron 6/6 全绿（最近 02:56），
worldcup 两站 OK；`VOICEMEMOBOT_URL` 仍空。剩余老板动作：解冲突并合 PR #29 +
填 `VOICEMEMOBOT_URL`。

### P3 · Thomas English Meal Counter — 单文件记餐 web app
**位置：本仓库分支 `claude/thomas-english-meal-counter-816Cf`**，代码为根目录单文件
`thomas-meal-counter.html`（320 行，无构建/无依赖）。

| 工作流 | 周期 | 入口 | 状态 | 最近一轮（证据） | 下一步 |
|--------|------|------|------|------------------|--------|
| 产品迭代 | 随 pm-cycle 体检 | （暂无专属命令） | 🟢 | 2026-06-11 06:05 体检：凌晨继续活跃——`c800167`（00:14 重构为带技能/工具箱/焦点覆盖的互动学习平台）+ `bbe9398`（00:23 重建后重挂 6/11 股市课覆盖）；确认老板/其他会话在直接开发 | 总管只观察不插手该分支；待老板定部署方式 |

**总管审计方式：** 每轮 `git fetch origin claude/thomas-english-meal-counter-816Cf`
看新 commit。该分支基于 4 月旧基线（含 ZombieSpawner 历史），与 Matchday26 分支
**不要互相合并**。

### P4+ · 新项目占位
尚无。新项目按 §C 登记后启动。

## B. 状态图例
🟢 周期内正常 ｜ 🟡 逾期/待补跑 ｜ 🔴 卡住需老板 ｜ ⚪ 按需触发

## C. 如何新增一个项目
1. 若在别的仓库：先用 `list_repos` / `add_repo` 把仓库加进会话范围
   （GitHub 工具默认只限当前仓库）。
2. 在 §A 加一节：一句话目标、工作流表（周期/入口/状态文件）、与本项目红线的差异。
3. 该项目的状态与记忆必须落在**它自己的仓库**里（会话失忆，仓库 = 唯一记忆）。
4. 周期运行：老板在 claude.ai/code/routines 为 `/pm-cycle`（或项目自己的入口）
   建 Routine——agent 无法代建；Routines 有每日次数上限，频率按额度取舍。

## D. 边界（同 CADENCE §3，总管逐条执行）
- 红线项只开 PR 不合并；门禁不绿不合并；一轮只做一件、diff 有界。
- 不编数字、不承诺流量；不能直连微信/社媒——对外分发是老板/伙伴的动作。
- **Routine 只克隆默认分支**：总管基建（`.claude/`、本台账、CADENCE）与每轮写回
  都必须**合并进默认分支**才对下一轮生效；只推工作分支 = 下一轮失忆。
- **给老板的固定读报位**：`briefs/latest.md`（每轮覆盖写入本轮简报全文）；
  **需要老板出手时**另发滚动 GitHub issue「Majordomo brief — action needed」
  （GitHub 推送通知；无事不响）。
