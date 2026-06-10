# 项目记忆文档 (MEMORY.md)

> 长期记忆 / 决策日志。用于跨会话回忆项目背景、基础设施、关键决策与待办。
> 维护者：主控 Claude。最后更新：2026-06-04。

## 0. 当前状态快照（2026-06-05，压缩上下文）
- **产品 Matchday26** 已上线：前端 `worldcup-web-03eq.onrender.com`、API `worldcup-api-6g3t.onrender.com`。部署分支 = 默认分支 `claude/zombie-spawner-waves-2l6Vb`；开发分支 `claude/vigilant-cannon-emAjf`（**每次合并后 `reset --hard` 对齐部署分支，防 squash 漂移**）。
- **已上线 PR #9–#14**：probe 修复 → PWA+Book now → Kayak/Booking 深链 → Matchday26 改名+Stage-1 设计 → 国旗/城市图/手机端 → 全程总价分项 → 骨架屏加载态。
- **团队**：主控｜Sheng(设计,Haiku)｜Amelia(产品品牌,Sonnet)｜龙哥(艺术审查,Sonnet,review-only)｜浩哥(技术,Haiku)｜Yifu(内容调研,Haiku)。投票成员＝Sheng/Amelia/龙哥。
- **节奏(CADENCE.md)**：产品 12h｜设计 24h｜运营 5h(Amelia)｜调研 每日(Yifu)。机制＝Routines（老板在 claude.ai/code/routines 创建；**agent 无法代建**）。会话内用"完成即续"循环。
- **设计 — 奢华暗色改版（2026-06-10 上线，老板拍板"luxury like + 类 Polymarket 设计层"）**：由亮转暗。新 token：画布 `#0d1420`/面板 `#141d2b`/次面板 `#1b2636`/发丝边框 `#243042`、近白文字 `#f3f6fa`/muted `#8a97a8`、冷蓝行动色 `#3d8bff`（CTA/链接/焦点）、奢华金 `#c9a55c`（价格/价值/品牌"26"）、red `#f0566d`。`@theme`+`:root` 双轨重指向（全站一刀变暗）；另手改 15 个 Tailwind 组件硬编码亮色（news 模块/ChatWidget/ContextNotebook 等，亮→暗 hex 批量映射 + HomeNewsWindow theater band/标签 retune 蓝/金）。门禁全绿（typecheck/lint/build + 145 jest）。亮色作为可逆备选（改 token 即回切）。`DESIGN.md` 已同步暗色 tokens。
- **设计 — WC2026 亮色改版（2026-06-09 上线，已被上面暗色版取代；保留作历史）**：AskUserQuestion 选 Light & vibrant。Sheng 出全套规范→三阶段落地并上线：①主题 token+外壳+Hero（深转亮：品红 `#E60E7B`/蒂芙尼绿/紫/青 on white、Archivo 标题字、`Are You Going?`/`Find My Match →` 持久 CTA、3 列页脚、Plan-Your-Trip 渐变块、信任行；`:root` 重指向亮色作兼容垫片，全站一刀切换）②城市卡图片化（16:10+底部遮罩+hover 缩放+确定性渐变 onError 兜底）③首页短视频窗 `HomeNewsWindow`（国家队 + Fan Zone 双流，复用 `news/`+`getTouristVideos` 模块，无新数据层）。门禁全绿（typecheck/lint/build + 131 jest）。`DESIGN.md` 已同步亮色 tokens。**待办 Phase 4-5**：内页（schedule/flights/hotels/transport/trips/bookings）逐页精修 + 最终删除 `:root` 垫片。**另修**：service worker 由 cache-first 改 navigation network-first（旧缓存遮蔽新部署，曾致 bubble/新主题不显）；新增 `GET /api/assistant` 健康探针。
- **硬约束**：沙箱连不上 onrender.com（curl/WebFetch 均 403，需环境 allowlist + 新 session）；无法直接发社媒/保证流量；无真库/无消息队列。

## 1. 项目概览
- **产品：** 2026 FIFA 世界杯（美国/加拿大/墨西哥）旅游导览 + 机票/酒店/交通预订网站与 PWA。
- **目标用户：** 前往观赛的全球球迷。
- **前端：** Next.js 15 (App Router) + TypeScript strict。
- **后端：** Python + FastAPI（PostgreSQL 可选，缺省走 seed/mock 数据）。
- **约束：** 不用 Axios（用原生 fetch）；不用 Redux（用 RSC + 本地 state）。

## 2. 基础设施与部署（关键，易踩坑）
- **没有 `main` 分支！** 仓库默认分支 = `claude/zombie-spawner-waves-2l6Vb`，**这就是 Render 的部署分支**。
- **开发分支：** `claude/vigilant-cannon-emAjf`（功能分支，所有 PR 从这里发起）。
- **部署流程：** 把功能分支 squash-merge 进 `claude/zombie-spawner-waves-2l6Vb` → Render 自动部署（约 2–3 分钟；免费实例休眠时更久）。
- **GitHub 仓库范围：** `jackson242242/claude-code`（MCP 工具受限于此）。
- **Render 服务（线上 URL）：**
  - API: `https://worldcup-api-6g3t.onrender.com`（根路径 `/` 无路由会返回 Not Found，属正常）
  - 前端: `https://worldcup-web-03eq.onrender.com`
  - 健康检查: `/health` → `{"status":"ok"}`
  - 诊断: `/meta/providers`、`/meta/hotel-probe`、`/meta/flight-probe`
- **网络限制：** 本沙箱出站被 allowlist 限制，**无法 curl `onrender.com`**（返回 403 Host not in allowlist）。线上验证需用户在浏览器/手机端完成。
- **线上 provider 配置：** flights=Duffel(real)、hotels=LiteAPI(real)、transport=mock。任一 key 缺失或上游报错会优雅降级到 seed/mock。

## 3. 已完成 / 已上线（PR 历史）
- **PR #9** — 修复 probe 误导性凭证提示（按所选 provider 命名缺失的凭证）。
- **PR #10** — PWA 可安装（manifest + service worker）+ 机票/酒店卡片 "Book now" 深链 + 高级感 UI 重设计（Inter 字体、薄荷绿强调色、玻璃质感头部、卡片 hover）。
- **PR #11** — 预订深链改为 Kayak（机票 `kayak.com/flights/ORG-DST/DATE/Nadults`）和 Booking.com（酒店 `searchresults.html?ss=...&checkin=...&checkout=...&group_adults=N`），替换不可靠的 Google Travel 链接。
- **PR #12** — Matchday26 改名 + tagline "Your Road to the Game" + Stage-1 设计（强调色 `#1fb88f`、金价 `#e6a817`、双层阴影、卡片 hover -4px）+ 国旗/城市图/手机端批次。
- **PR #13** — 全程总价分项汇总（`TripCostSummary` + `calculateTripCostBreakdown`），浩哥首个产品增量，主控审后修了 match-only 边界 bug 并加基础样式上线。

> ⚠️ **分支漂移教训（2026-06-05）：** 长期复用一个功能分支 + squash-merge 会导致功能分支与部署分支内容漂移（重叠文件最终冲突，见 PR #13 那次）。**修法：** 每次 squash 合并到部署分支后，把功能分支 `git reset --hard origin/部署分支` 重新对齐（功能分支内容是部署分支的超集，零丢失）。Routines 因每次从默认分支全新克隆，天然无此问题。

## 4. 团队（详见 TEAM.md）
- 主控 Claude（编排，集中决策，向老板汇报）
- **Sheng** — UI/UX 设计研究（Haiku，只研究不改码）
- **Amelia** — 产品经理/品牌（Sonnet，产出 BRAND.md + marketing/launch-plan.md，牵头推广/合作）
- **龙哥** — 艺术 & 娱乐圈审查官（Sonnet，review-only，带 KPI）
- **浩哥** — 技术/基础设施（Haiku，产品迭代/工具/取数/DB/MCP/队列）
- **Yifu（易甫，原名 Vera）** — 内容 & 市场调研（Haiku，产出 marketing/daily-brief.md，支援 Amelia）
- 临时实现 agent（Sonnet，按任务写码）

## 5. 设计方向（来自 Sheng 的研究报告，待落地）
核心三支点：**信任感、高级感、转化力**。具体高优先级建议：
- **配色升级：** 背景 `#0d1117`→`#0f1419`；强调色 `#00c896`→`#1fb88f`（更成熟的蒂芙尼绿，近 Airbnb）；新增金色 `#ffb84d`（价格/稀缺）、紫 `#6b5aff`（高级标签）；文本 `#e6edf3`→`#f5f7fa`（更暖白）。
- **阴影：** 改双层叠加（近+远）模拟自然光，5 级 scale。
- **圆角：** 12px→16px/20px。
- **间距：** 引入 8px 网格 spacing scale（`--sp-xs`…`--sp-xxxl`），加大留白。
- **排版：** H1 2.4rem→2.8rem，`letter-spacing: -0.03em`；价格用 2rem 金色大字。
- **动效：** hover transition 0.15s→0.25s，`cubic-bezier(0.4,0,0.2,1)`；卡片 hover translateY -4px + 彩色阴影；加 skeleton 加载态。
- **转化：** CTA 加大加渐变 + 彩色光晕；价格加 "From"/对比价/折扣徽章；加评价数 + 稀缺性提示（"Only 3 left"）；预订进度条。
- **图片：** 城市图 2:1 + 渐变遮罩 + 文字 text-shadow + hover scale 1.08；酒店图 16:10 + 毛玻璃徽章。
> 落地节奏：第一阶段（配色+阴影+hover，2–3h）→ 第二阶段（圆角+间距+排版+按钮）→ 第三阶段（价格+信任标识+图片+加载态）。

## 6. 工程规范 / 质量门槛
- 提交前跑：`npm run typecheck && npm test`（前端，当前 42 passed）；`cd backend && .venv/bin/python -m pytest`（后端，当前 54 passed，覆盖率 86%，门槛 80%）。
- 类型严格，无 `any`；函数 camelCase、组件 PascalCase、常量 UPPERCASE；仅用函数组件 + 箭头函数。
- API 用 Pydantic alias 序列化为 camelCase，1:1 对应 `src/types/`。
- 改数据库结构必须先改 `backend/schema.sql`（source of truth）。
- 复用现有 mock 层（`src/mocks/`、`backend/app/seed/`），不造平行假数据。
- **未经老板明确许可不开对外 PR / 不推非指定分支。**

## 7. 基础设施现状（浩哥领域，如实记录）
- **数据库：** 生产**无真库**——Render 蓝图省略 Postgres，跑 `backend/app/seed` 种子数据 + 内存 trips。`backend/schema.sql` 是 source of truth 但未部署。改结构先改 schema.sql。
- **消息队列：** **不存在**。属浩哥按需设计/引入领域，需先论证必要性（防过度工程）。
- **MCP：** 现为 GitHub MCP + 远程执行 MCP（`mcp__github__*`、`mcp__claude-code-remote__*`）。新增集成由浩哥评估。
- **联网：** 沙箱出站受 allowlist 限制（onrender.com 被挡）；agent 可用 WebSearch/WebFetch 取数。

## 8. 团队治理更新（2026-06-04）
- 新增 **龙哥**（艺术/娱乐圈审查官，review-only，带 KPI：提升团队沟通效率+审美）。
- 新增 **浩哥**（技术/基础设施：产品迭代、工具调优、联网、DB、MCP、消息队列），模型 **Haiku**（原指定 "hermes" 不可用；从 opus/sonnet/haiku 选定 Haiku，最快最省）。
- **投票治理：** 需老板拍板事项 → agent ≥2 轮讨论 → 多数票 → 呈报逻辑 → 老板做架构级裁决。投票成员：Sheng/Amelia/龙哥；浩哥默认不投票，提供技术可行性评估。
- 首次投票结果见 TEAM.md「投票存档」。

## 9. 待办 / 进行中
- [ ] **⚠️ 节奏缺口（2026-06-10 PM 检查发现）**：运营(5h)与调研(每日)循环 06-05→06-10 未运行（产品/设计循环正常）。当日已补课：`marketing/daily-brief.md`(06-10 版) + `marketing/ops-2026-06-10.md`（含 PM 记录）。**需老板**：到 claude.ai/code/routines 确认 `/amelia-ops`、`/yifu-research` 两条 Routine 存在且在触发；赛期(至 6/27)若额度紧张优先保运营/调研。
- [x] 国旗+城市图+手机端上线（PR #12）。
- [x] BRAND.md（Amelia 交付，`975b353`）。
- [x] Stage-1 设计 + Matchday26 改名上线（PR #12）。
- [x] 浩哥加入架构（模型 Haiku）。首个任务：基建快评 + 成本分项显示（commit `2d795a9`）。
- [ ] **全程总价汇总（多币种）** —— 后续在 TripCostSummary 扩展 USD/CAD/MXN 切换。
- [ ] **真实赛程数据缓存策略** —— 浩哥评估 Redis 或 LRU，TTL 6h，按 route+date 分key（前置于多城市引擎）。
- [ ] 下一阶段设计：情绪基调参考板（龙哥 KPI 要求）+ 骨架屏 + 8px 间距系统 + 价格对比徽章(A/B)。
- [ ] **升级节奏**（架构规则）：12h 产品 / 24h 设计，见 `CADENCE.md`。入口命令 `.claude/commands/product-upgrade.md`、`design-upgrade.md`。机制=Routines（claude.ai/code/routines，老板一次性创建；agent 无法代建）。每次运行=全新会话，仓库是唯一记忆，必须先读 backlog 后写回进度。
- [ ] 仓库根目录无关的 `ZombieSpawner.lua` 属历史遗留，忽略。
