# 项目记忆文档 (MEMORY.md)

> 长期记忆 / 决策日志。用于跨会话回忆项目背景、基础设施、关键决策与待办。
> 维护者：主控 Claude。最后更新：2026-06-04。

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
- **commit `5059e44`（待并入部署分支）** — 国旗 emoji（`src/lib/flags.ts`）+ 城市图片（Unsplash）+ 手机端优化（单列卡片、导航横向滚动、Book now 按钮加大）。

## 4. 团队（详见 TEAM.md）
- 主控 Claude（编排，集中决策，向老板汇报）
- **Sheng** — UI/UX 设计研究（Haiku，只研究不改码）
- **Amelia** — 产品经理/品牌（Sonnet，产出 BRAND.md，负责日常运营）
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

## 7. 待办 / 进行中
- [ ] 把 `5059e44`（国旗+城市图+手机端）并入部署分支上线。
- [ ] Amelia 产出 `BRAND.md`（进行中）。
- [ ] 落地 Sheng 的设计建议（第一阶段优先）。
- [ ] 仓库根目录有无关的 `ZombieSpawner.lua`，属历史遗留，忽略即可。
