# 项目组合台账 (PROJECTS.md)

> 总管（`.claude/agents/majordomo.md`）的唯一项目清单。老板只跟总管对话；
> 总管按本台账管理所有进行中项目。每轮 `/pm-cycle` 先读本文件、后写回。
> 最后更新：2026-06-10 09:40 UTC（pm-cycle：补跑调研+新闻检查；并入 P2 分支台账更新；登记 P3 新动态）

## A. 进行中项目

### P1 · Matchday26 — 2026 世界杯旅游导览（本仓库）
线上 `worldcup-web-03eq.onrender.com` ｜ 部署分支 `claude/zombie-spawner-waves-2l6Vb`
｜ 节奏与红线详见 `CADENCE.md`

| 工作流 | 周期 | 入口 | 状态 | 最近一轮（证据） | 下一步 |
|--------|------|------|------|------------------|--------|
| 产品升级 | 12h | `/product-upgrade` | 🟢 | 2026-06-10（`6d78d78` bloopers + affiliate 链接） | 真实赛程数据缓存（CADENCE §5 顶部） |
| 市场调研 | **6h** | `/yifu-research` | 🟢 | 2026-06-10 09:30（daily-brief 头部；last30days 式首跑，发现叙事反转：酒店/票价在降） | 下轮 6h 后增量跑；Amelia 接「捡漏窗口」钩子时退役旧涨价文案 |
| 设计升级 | 按需 | `/design-upgrade` | ⚪ | 2026-06-10（`dcf32a3` 亮色 Phase 4 → 撤定时） | 老板点单或 pm-cycle 判断需要时跑（Phase 5 在 backlog） |
| 网站运营 | 按需 | `/amelia-ops` | ⚪ | 2026-06-05（`marketing/ops-2026-06-05.md` → 撤定时） | 老板点单或发布节点前跑 |
| 新闻健康检查 | 6h | `/news-live-check` | 🟢 | 2026-06-10 09:40（retest PASS 153FE/62BE；prod unreachable=环境限制，见 ops-news-live.md） | 随下轮 pm-cycle 覆盖；老板可顺手瞄一眼 /news 的绿色 Live 标 |
| 素材刷新 | 按需 | `/refresh-tourist-videos` | ⚪ | 见 tourist-videos 数据时间戳 | 视频失效（404）时触发 |

> 节奏由老板 2026-06-10 裁决精简：定时只留产品 12h + 调研 6h（+新闻检查 6h）；设计/运营转按需（命令保留，能力不丢）。

### P2 · VoiceMemoBot — 语音备忘 → AI 音乐 remix → 自有社交 Feed
**位置：本仓库分支 `claude/inspiring-dirac-j8ar6q`（PR #23 → 部署分支）**，代码在
`voice-memo-watch/`（FastAPI 后端 + watchOS Swift app + 浏览器原型 UI，自带 pytest）。

| 工作流 | 周期 | 入口 | 状态 | 最近一轮（证据） | 下一步 |
|--------|------|------|------|------------------|--------|
| 产品迭代 | 随 pm-cycle 体检 | （暂无专属命令） | 🟢 | 2026-06-10（`611c755` 语音转录+评论+用户/关注+私信+转发+用户主页+直播演唱会；56 tests 96% cov） | 老板合并工作分支 PR 进部署分支 → Render 自动部署可测试 |
| 站点健康 | 30min（合并后生效） | `.github/workflows/site-health.yml` | 🔴 **当前无公网站点** | 2026-06-10 老板反馈 "site can't be reached"——属实：从未部署，原型只能本地跑 | 合并后 Render 蓝图自动部署 `voicememobot-api`；首次部署后把 URL 填进 repo 变量 `VOICEMEMOBOT_URL` |

**总管审计方式：** 同仓库即可达——每轮 `git fetch origin claude/inspiring-dirac-j8ar6q`
看新 commit / 测试状态 / CI。**裁决更新（2026-06-10，老板亲自下令）：** 老板已明确要求
为该项目建 PR 并部署到可在浏览器测试的环境，PR #23（base = 部署分支）即老板的指令产物；
**合并动作仍由老板执行**（红线照旧：agent 只开 PR 不合并）。沙箱不可达 onrender.com，
线上探测一律走 GitHub Actions（site-health 工作流）。
> （本节由 P2 分支 `3477f30` 的台账更新并入默认分支台账，2026-06-10 pm-cycle。）

### P3 · Thomas English Meal Counter — 单文件记餐 web app
**位置：本仓库分支 `claude/thomas-english-meal-counter-816Cf`**，代码为根目录单文件
`thomas-meal-counter.html`（320 行，无构建/无依赖）。

| 工作流 | 周期 | 入口 | 状态 | 最近一轮（证据） | 下一步 |
|--------|------|------|------|------------------|--------|
| 产品迭代 | 随 pm-cycle 体检 | （暂无专属命令） | 🟢 | 2026-06-10（`dbeb7ee` news-driven 学习卡 JSON + 动态取数；`45c9aed` 每日投资/AI 学习卡——分支有新活跃会话） | 待老板定方向：要加的功能 / 部署方式 |

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
