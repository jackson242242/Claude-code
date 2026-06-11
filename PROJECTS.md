# 项目组合台账 (PROJECTS.md)

> 总管（`.claude/agents/majordomo.md`）的唯一项目清单。老板只跟总管对话；
> 总管按本台账管理所有进行中项目。每轮 `/pm-cycle` 先读本文件、后写回。
> 最后更新：2026-06-11 00:45 UTC（pm-cycle：补跑调研〔开赛日增量：二手票市场劈叉 + Fan Zone 今日开张〕+ 新闻检查〔PASS 153FE/70BE；Actions 23:55 两站 OK〕；发现 PR #29 与默认分支冲突（仅台账两文件）；P3 分支深夜活跃）

## A. 进行中项目

### P1 · Matchday26 — 2026 世界杯旅游导览（本仓库）
线上 `worldcup-web-03eq.onrender.com` ｜ 部署分支 `claude/zombie-spawner-waves-2l6Vb`
｜ 节奏与红线详见 `CADENCE.md`

| 工作流 | 周期 | 入口 | 状态 | 最近一轮（证据） | 下一步 |
|--------|------|------|------|------------------|--------|
| 产品升级 | 12h | `/product-upgrade` | 🟢 | 2026-06-10 18:15（真实赛程 feed 覆盖层 `SCHEDULE_FEED_URL` + 6h TTL 缓存 + seed 兜底；70 BE tests）；下次到期 ~06-11 06:15 | 下件事二选一：**开赛日 LIVE 态**（倒计时归零→今日赛程条，调研 6-11 信号，时效最高）或多城市「追随球队」引擎；激活真实 feed 仍需老板配 `SCHEDULE_FEED_URL` |
| 市场调研 | **6h** | `/yifu-research` | 🟢 | 2026-06-11 00:30 补跑（开赛日增量：二手票市场「劈叉」——中性场 ~$157 抛售 vs 豪门/淘汰赛坚挺；官方 resale 开球前 1h 可买；Fan Zone 今日全面开张） | 随下轮 pm-cycle 体检；新钩子「smart latecomer / 开赛日仍能上车」已交 Amelia 块 |
| 设计升级 | 按需 | `/design-upgrade` | ⚪ | 2026-06-10（`dcf32a3` 亮色 Phase 4 → 撤定时） | 老板点单或 pm-cycle 判断需要时跑（Phase 5 在 backlog） |
| 网站运营 | 按需 | `/amelia-ops` | ⚪ | 2026-06-05（`marketing/ops-2026-06-05.md` → 撤定时） | 老板点单或发布节点前跑 |
| 新闻健康检查 | 6h | `/news-live-check` | 🟢 | 2026-06-11 00:40 补跑（retest PASS 153FE/70BE 87%cov；site-health Actions run#5 23:55 两站 OK——开赛日 prod 在线；沙箱探针仍 403） | 随下轮 pm-cycle 覆盖 |
| 素材刷新 | 按需 | `/refresh-tourist-videos` | ⚪ | 见 tourist-videos 数据时间戳 | 视频失效（404）时触发 |

> 节奏由老板 2026-06-10 裁决精简：定时只留产品 12h + 调研 6h（+新闻检查 6h）；设计/运营转按需（命令保留，能力不丢）。

### P2 · VoiceMemoBot — 语音备忘 → AI 音乐 remix → 自有社交 Feed
**位置：本仓库分支 `claude/inspiring-dirac-j8ar6q`（PR #23 → 部署分支）**，代码在
`voice-memo-watch/`（FastAPI 后端 + watchOS Swift app + 浏览器原型 UI，自带 pytest）。

| 工作流 | 周期 | 入口 | 状态 | 最近一轮（证据） | 下一步 |
|--------|------|------|------|------------------|--------|
| 产品迭代 | 随 pm-cycle 体检 | （暂无专属命令） | 🟡 | 2026-06-10 18:26 分支又推 2 个 UI commit（`9a9b359`/`9e0d502` 小红书风 feed + watch 卡片布局，已自动进 PR #29）；但 **PR #29 mergeable=dirty——与默认分支冲突，冲突仅在 PROJECTS.md + briefs/latest.md 两台账文件，VoiceMemoBot 代码零冲突**（总管 06-11 00:10 merge-tree 诊断） | 老板合 PR #29 时在 GitHub UI 解冲突（两台账文件**选默认分支版本**即可）；或授权总管推一次冲突解决到该分支 |
| 站点健康 | 30min cron（已生效） | `.github/workflows/site-health.yml` | 🟡 **cron 在跑，探测未含本站** | 2026-06-10 23:55 run #5 success（累计 5/5 全绿）：worldcup-web/api 均 OK，但 `voicememobot-api` URL 仍为空（run #5 日志再次确认 `VOICEMEMOBOT_URL` 未填） | **老板**：Render 仪表盘拿 `voicememobot-api` URL → 填 repo Variables `VOICEMEMOBOT_URL`（agent 无该权限）；填后探测自动含本站，不可达即开 `site-down` issue |

**总管审计方式：** 同仓库即可达——每轮 `git fetch origin claude/inspiring-dirac-j8ar6q`
看新 commit / 测试状态 / CI。**进展（2026-06-11 00:45 UTC）：** PR #29 的 head 已自动
带上 18:17–18:26 的两个新 UI commit（小红书风改版）；但因默认分支 18:25 合并了
pm-cycle #30 的台账写回，**PR #29 现在有冲突（dirty）——仅 PROJECTS.md 与
briefs/latest.md 两文件，代码零冲突**（merge-tree 诊断）。总管不推他人分支（边界），
解法：老板在 GitHub UI 合并时两台账文件选默认分支版本，或授权总管代解。site-health
cron 已 5/5 全绿（最近 23:55），worldcup 两站 OK；`VOICEMEMOBOT_URL` 仍空。
剩余老板动作：解冲突并合 PR #29 + 填 `VOICEMEMOBOT_URL`。

### P3 · Thomas English Meal Counter — 单文件记餐 web app
**位置：本仓库分支 `claude/thomas-english-meal-counter-816Cf`**，代码为根目录单文件
`thomas-meal-counter.html`（320 行，无构建/无依赖）。

| 工作流 | 周期 | 入口 | 状态 | 最近一轮（证据） | 下一步 |
|--------|------|------|------|------------------|--------|
| 产品迭代 | 随 pm-cycle 体检 | （暂无专属命令） | 🟢 | 2026-06-11 00:05 体检：分支深夜活跃——新 commit `ed5c3ff`（23:58 面向儿童 Thomas 的年龄适配学习卡改版）+ `5164f56`（00:04 6/11 课程=股市基础）；疑似老板/其他会话在直接开发 | 总管只观察不插手该分支；待老板定部署方式 |

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
