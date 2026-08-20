# 项目组合台账 (PROJECTS.md)

> 总管（`.claude/agents/majordomo.md`）的唯一项目清单。老板只跟总管对话；
> 总管按本台账管理所有进行中项目。每轮 `/pm-cycle` 先读本文件、后写回。
> 最后更新：2026-06-12 00:25 UTC（pm-cycle：补跑调研〔赛果收割：墨西哥 2–0 南非、「早到 3h+轻轨拆段」实测、Fan Fest 五城排长队、美国揭幕战今晚 resale $690 仍低于官网 $1,120〕+ 新闻检查〔retest PASS 164FE/70BE+lint/build；site-health run#12 23:20 两站 OK，12/12 全绿；VOICEMEMOBOT_URL 仍空〕；产品 ~06:30 才到期未动；P2 自 866d42a 后无新 commit，PR #29 仍 dirty；P3 自 bbe9398 后无新 commit；本轮纯 md 写回）

## A. 进行中项目

### P1 · Matchday26 — 2026 世界杯旅游导览（本仓库）
线上 `worldcup-web-03eq.onrender.com` ｜ 部署分支 `claude/zombie-spawner-waves-2l6Vb`
｜ 节奏与红线详见 `CADENCE.md`

| 工作流 | 周期 | 入口 | 状态 | 最近一轮（证据） | 下一步 |
|--------|------|------|------|------------------|--------|
| 产品升级 | 12h | `/product-upgrade` | 🟢 | 2026-06-11 18:30 补跑（**LIVE 条阶段化**：`getMatchPhase` 服务——feed status 优先〔live/completed 为准〕+ 开球时间窗兜底〔小组赛 2¼h/淘汰赛 3¼h〕；进行中＝红框「In progress」、结束＝「FT」淡显；164FE/70BE/lint/build 全绿）；下次到期 ~06-12 06:30 | 下件事：多城市「追随球队」引擎（P0）；**FT 比分回显被挡**——Match 模型无比分字段，需 `SCHEDULE_FEED_URL` 激活后连模型一起做 |
| 市场调研 | **6h** | `/yifu-research` | 🟢 | 2026-06-12 00:15 补跑（赛果收割轮，兑现顺延：**墨西哥 2–0 南非**〔Quiñones 首球+Jiménez〕、Azteca「早到 3h+轻轨拆段」第一课、Fan Fest 五城排长队雨中欢呼、美国揭幕战今晚 resale $690 < 官网 $1,120）；下次 ~06:15 | 下轮重点：美国揭幕战（6/13 01:00 UTC 完赛）赛果 + LA 现场/SoFi 交通实测；韩捷深夜场补记 |
| 设计升级 | 按需 | `/design-upgrade` | ⚪ | 2026-06-10（`dcf32a3` 亮色 Phase 4 → 撤定时） | 老板点单或 pm-cycle 判断需要时跑（Phase 5 在 backlog） |
| 网站运营 | 按需 | `/amelia-ops` | ⚪ | 2026-06-05（`marketing/ops-2026-06-05.md` → 撤定时） | 老板点单或发布节点前跑 |
| 新闻健康检查 | 6h | `/news-live-check` | 🟢 | 2026-06-12 00:20 补跑（retest PASS 164FE/70BE 87%cov + lint/build；site-health run#12 23:20 两站 OK，cron 12/12 全绿；沙箱探针仍 403；**发现并补记 18:25 轮漏写的日志行**） | 随下轮 pm-cycle 覆盖 |
| 素材刷新 | 按需 | `/refresh-tourist-videos` | ⚪ | 见 tourist-videos 数据时间戳 | 视频失效（404）时触发 |

> 节奏由老板 2026-06-10 裁决精简：定时只留产品 12h + 调研 6h（+新闻检查 6h）；设计/运营转按需（命令保留，能力不丢）。

### P2 · VoiceMemoBot — 语音备忘 → AI 音乐 remix → 自有社交 Feed
**位置：本仓库分支 `claude/inspiring-dirac-j8ar6q`（PR #23 → 部署分支）**，代码在
`voice-memo-watch/`（FastAPI 后端 + watchOS Swift app + 浏览器原型 UI，自带 pytest）。

| 工作流 | 周期 | 入口 | 状态 | 最近一轮（证据） | 下一步 |
|--------|------|------|------|------------------|--------|
| 产品迭代 | 随 pm-cycle 体检 | （暂无专属命令） | 🟡 | 2026-06-12 00:10 体检：自 `866d42a`（06-11 12:19，竞品调研 md）后**无新 commit**；PR #29 仍 9 commits +4342/−180、46 文件，**仍 dirty——等老板解冲突**（冲突只在 PROJECTS.md + briefs/latest.md 两台账文件） | 老板合 PR #29 时在 GitHub UI 解冲突（两台账文件**选默认分支版本**即可）；或授权总管代解；注意 `328bec9` 含 DB schema 计划，合并前值得过目 |
| 站点健康 | 30min cron（已生效） | `.github/workflows/site-health.yml` | 🟡 **cron 在跑，探测未含本站** | 2026-06-11 23:20 run #12 success（累计 12/12 全绿）：worldcup-web/api 均 OK；`VOICEMEMOBOT_URL` 仍未填（run#12 日志确认 `voicememobot-api|` 为空） | **老板**：Render 仪表盘拿 `voicememobot-api` URL → 填 repo Variables `VOICEMEMOBOT_URL`（agent 无该权限）；填后探测自动含本站，不可达即开 `site-down` issue |

**总管审计方式：** 同仓库即可达——每轮 `git fetch origin claude/inspiring-dirac-j8ar6q`
看新 commit / 测试状态 / CI。**进展（2026-06-12 00:25 UTC）：** 自 `866d42a`（06-11
12:19，竞品调研 md）后无新 commit——分支冲刺暂歇约 12h。PR #29 维持 9 commits
（+4342/−180、46 文件），仍 dirty——冲突仍只在 PROJECTS.md / briefs/latest.md 两台账
文件，代码零冲突。总管不推他人分支（边界），解法不变：老板 UI 合并时两台账文件选
默认分支版本，或授权总管代解。site-health cron 12/12 全绿（最近 23:20），worldcup
两站 OK；`VOICEMEMOBOT_URL` 仍空（run#12 日志确认）。
剩余老板动作：解冲突并合 PR #29 + 填 `VOICEMEMOBOT_URL`。

### P3 · Thomas English Meal Counter — 单文件记餐 web app
**位置：本仓库分支 `claude/thomas-english-meal-counter-816Cf`**，代码为根目录单文件
`thomas-meal-counter.html`（320 行，无构建/无依赖）。

| 工作流 | 周期 | 入口 | 状态 | 最近一轮（证据） | 下一步 |
|--------|------|------|------|------------------|--------|
| 产品迭代 | 随 pm-cycle 体检 | （暂无专属命令） | 🟢 | 2026-06-12 00:10 体检：自 06-11 00:23（`bbe9398`）后无新 commit；老板/其他会话直接开发中 | 总管只观察不插手该分支；待老板定部署方式 |

**总管审计方式：** 每轮 `git fetch origin claude/thomas-english-meal-counter-816Cf`
看新 commit。该分支基于 4 月旧基线（含 ZombieSpawner 历史），与 Matchday26 分支
**不要互相合并**。

### P4 · Alexandra Art Portfolio — 女儿的作品集静态站
**位置：本仓库 `alexandra-art/`（已在默认分支，PR #37 squash 合并 6acdaa7）**。
单 `index.html` + `works/` 五张铅笔作品；无 header，五个原创 SVG 动画小人按钮
（皮卡丘=All／炭治郎=Sketchbook／樱木=Studies／哆啦A梦=Visual Notes／龙猫=♪），
Web Audio 八音盒音乐（零版权）。`render.yaml` 已注册 `alexandra-art` 静态站
（rootDir 限定，无构建无密钥）。

| 工作流 | 周期 | 入口 | 状态 | 最近一轮（证据） | 下一步 |
|--------|------|------|------|------------------|--------|
| 内容更新 | 按需 | （老板点单：加作品/换音乐） | ⚪ | 2026-06-12 上线 v2（PR #37） | 加新作品＝图扔进 `works/` + `WORKS` 数组加一行（见 `alexandra-art/README.md`） |
| 部署确认 | 一次性 | Render Blueprint sync | 🟡 | render.yaml 已含服务定义；沙箱探不到 onrender | **老板**：若 Render 没自动建站，仪表盘批准 Blueprint sync；URL 形如 `alexandra-art-<suffix>.onrender.com`，拿到后可填进 site-health 探测 |

### P5 · 小红书号 · 时尚美妆行业解读（老板本人 IP）
**位置：本仓库 `xhs/`，分支 `claude/xiaohongshu-fashion-beauty-content-hk774m`**。
小红书号 103684030。目标：立人设 → 建粉丝群 → 成为业界 influencer。
定位与风格卡见 `xhs/BRAND-XHS.md`（风格已从老板 4 篇原文提炼）。
**核心资产：老板本人在美国美妆行业内部**——中美双战场对照是唯一不可复制的赛道。

| 工作流 | 周期 | 入口 | 状态 | 最近一轮（证据） | 下一步 |
|--------|------|------|------|------------------|--------|
| 每日出稿 | **24h** | `/xhs-daily` | 🟢 | 2026-08-20 第 1 期（简报 10 条 + 选题 3 个 + 完整初稿「线下反超线上」+ 7 张 1080×1440 配图 + 邮件到 amelia718@gmail.com） | 等老板审稿；改稿要点写回 BRAND-XHS §3 |

**红线：** agent **不代发**、不刷量、不保证涨粉数字；不编数字/爆料；
不碰政治·签证·法律·功效宣称·私德指控（同 CADENCE §3 内容硬过滤）。
**配图管线：** `xhs/tools/render-cards.mjs`（Chromium headless + Noto SC，1080×1440 小红书竖版）。

### P6+ · 新项目占位
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
