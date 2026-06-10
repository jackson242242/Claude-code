# 项目组合台账 (PROJECTS.md)

> 总管（`.claude/agents/majordomo.md`）的唯一项目清单。老板只跟总管对话；
> 总管按本台账管理所有进行中项目。每轮 `/pm-cycle` 先读本文件、后写回。
> 最后更新：2026-06-10（总管上线）

## A. 进行中项目

### P1 · Matchday26 — 2026 世界杯旅游导览（本仓库）
线上 `worldcup-web-03eq.onrender.com` ｜ 部署分支 `claude/zombie-spawner-waves-2l6Vb`
｜ 节奏与红线详见 `CADENCE.md`

| 工作流 | 周期 | 入口 | 状态 | 最近一轮（证据） | 下一步 |
|--------|------|------|------|------------------|--------|
| 产品升级 | 12h | `/product-upgrade` | 🟢 | 2026-06-10（`6d78d78` bloopers + affiliate 链接） | 真实赛程数据缓存（CADENCE §5 顶部） |
| 设计升级 | 24h | `/design-upgrade` | 🟢 | 2026-06-10（`dcf32a3` 亮色 Phase 4） | Phase 5：删 `:root` 兼容垫片 |
| 网站运营 | 5h | `/amelia-ops` | 🟡 | 2026-06-05（`marketing/ops-2026-06-05.md`） | 已逾期，下轮 pm-cycle 补跑 |
| 市场调研 | 每日 | `/yifu-research` | 🟡 | 2026-06-05（`marketing/daily-brief.md` 头部日期） | 已逾期，下轮 pm-cycle 补跑 |
| 素材刷新 | 按需 | `/refresh-tourist-videos` | ⚪ | 见 tourist-videos 数据时间戳 | 视频失效（404）时触发 |

### P2+ · 新项目占位
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
