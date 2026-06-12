# 类 Bloomberg Terminal 产品规划（提案稿）

> 状态：**规划稿，未动工**。分支 `claude/bloomberg-terminal-planning-c9ufxr`。
> 若老板拍板启动，按 PROJECTS.md §C 登记为新项目（建议代号 **P4 · Terminal**）。
> 撰写日期：2026-06-12。

---

## 0. 诚实边界（先说清楚我们做不到什么）

Bloomberg Terminal 是一台 $25k+/年的专业工作站，核心壁垒是：

1. **专有数据**——彭博自采的全球行情、固收/衍生品定价、公司基本面深库；
2. **IB 聊天网络**——百万级金融从业者的封闭社交网络（最强护城河）；
3. **交易执行**——直连交易柜台与合规体系。

这三样我们**复制不了**，也不应该尝试。我们能做、且值得做的是：

> **一个「终端式」的个人投资者行情工作台**：多面板布局、键盘命令驱动、
> 实时/准实时行情、图表、新闻、筛选、告警——把 Bloomberg 的**交互范式**
> （命令行 + 多窗格 + 全键盘 + 信息密度）带给用免费/低价数据源的个人用户。

对标的现实参照物是 OpenBB Terminal、TradingView、Koyfin——不是真彭博。
**红线**：不做交易执行、不给投资建议（页面挂免责声明）、不编造行情数据。

---

## 1. 产品定位与 MVP 范围

**一句话**：浏览器里打开的「穷人版彭博」——一块屏、多个面板、一条命令行，
输 `AAPL` 回车看报价，输 `AAPL C` 看图，输 `N` 看新闻。

### MVP 做什么（✅）

| 模块 | 说明 |
|------|------|
| 命令行（核心交互） | 仿彭博 `TICKER <FUNC> <GO>` 范式：顶部全局输入框 + 快捷键唤起；`AAPL Q`=报价、`AAPL C`=图表、`N`=新闻、`W`=自选、`HELP`=命令列表 |
| 多面板工作区 | 可拖拽/缩放的网格布局，每个面板独立挂载一个功能（报价/图/新闻/自选），布局存 localStorage |
| 报价 + 自选列表 | 实时（crypto）/ 延迟或 EOD（美股）的最新价、涨跌幅、迷你走势 |
| K 线图表 | 蜡烛图 + 成交量 + 常用指标（MA/EMA/RSI/MACD），多周期切换 |
| 新闻面板 | 聚合 RSS/免费新闻 API，按 ticker 过滤 |
| 终端视觉 | 黑底橙字的经典终端皮肤、信息高密度、全键盘可操作 |

### MVP 不做（❌，明确砍掉）

- 交易下单、券商接入；聊天/社交；固收、期权链、宏观经济数据库；
- 移动端（桌面优先——这是工作台不是 app）；多用户协作。

### Phase 2+ 候选（MVP 验证后再排）

筛选器（screener）、价格告警（邮件/推送）、组合盈亏跟踪、财报日历、
基本面快照（PE/市值/营收）、**AI 摘要面板**（Claude API 总结某 ticker 当日新闻
——团队已有 chatbot 集成经验，见 `docs/chatbot-model-options.md`）。

---

## 2. 关键决策：数据源（成本与许可是最大风险）

美股**实时**行情要向交易所付许可费，个人项目扛不住。策略：

| 资产 | 来源 | 实时性 | 成本 |
|------|------|--------|------|
| **加密货币**（MVP 主打） | Binance / Coinbase 公开 WebSocket | 真实时，免 key | $0 |
| 美股报价/K 线 | Finnhub 或 Alpha Vantage 免费层 | 15min 延迟 / EOD | $0（限频 ~60 req/min） |
| 新闻 | RSS（Reuters/CNBC/雅虎财经）+ Finnhub news | 准实时 | $0 |
| 升级路径 | Polygon.io（$29/月起）换真实时美股 | — | 老板拍板再付费 |

**为什么 crypto 打头阵**：免费、真实时、无许可问题——「终端」的实时感是体验
核心，先用 crypto 把 WebSocket 链路和面板体验做实，美股走延迟数据补全广度。

**架构要求**：数据源全部走 provider 适配器（同本仓库 booking adapters 模式，
`providers/base.py` 抽象 + mock 实现 + `registry.py` 注册），**无 API key 时
回退到 mock/seed 数据**，保证开发与测试不依赖外部服务（同现有 DB fallback 惯例）。

---

## 3. 技术架构（复用团队现有栈，零新学习成本）

```
浏览器 ── Next.js (App Router, TS strict)
  │   面板布局: react-grid-layout ｜ 图表: lightweight-charts (TradingView 开源)
  │   命令行: 自研 parser + 注册表（命令→面板的映射）
  │   实时: 原生 WebSocket hook（无 Axios/Redux，与 CLAUDE.md 约束一致）
  ▼
FastAPI 后端
  ├─ REST: /api/quotes /api/candles /api/news /api/search （camelCase 契约，同现约定）
  ├─ WS 扇出: /ws/stream —— 后端单连上游、按订阅扇出给多客户端（省限频额度）
  ├─ providers/: base.py 抽象 + mock + finnhub + binance（registry 注册）
  └─ 全局异常处理器返回 {"error": {"message","type"}}（同现约定）
PostgreSQL（可选启动）: 自选列表、布局、告警规则；K 线缓存表（省上游限频）
```

技术选型理由（一句话各）：
- **lightweight-charts**：TradingView 开源，金融图表事实标准，45KB，免费商用；
- **react-grid-layout**：成熟的拖拽网格，比 golden-layout 维护更活跃；
- **后端代理上游而非前端直连**：藏 key、合并订阅省限频、统一缓存与异常格式。

---

## 4. 里程碑（按 product-upgrade「一轮一件、diff 有界」的节奏切）

| 阶段 | 内容 | 估算 |
|------|------|------|
| **M0 骨架** | 新仓库脚手架（Next+FastAPI+测试门禁）、终端皮肤、网格布局、命令行 parser + `HELP`，全 mock 数据 | 2–3 轮 |
| **M1 行情** | provider 抽象 + Binance WS（crypto 实时报价面板）+ Finnhub（美股延迟）、自选列表 | 3–4 轮 |
| **M2 图表** | K 线面板 + 指标 + 多周期、K 线缓存表 | 2–3 轮 |
| **M3 新闻+打磨** | 新闻面板（ticker 过滤）、布局持久化、快捷键全覆盖、免责声明 → **MVP 可演示** | 2–3 轮 |
| M4+（验证后） | 告警 / 筛选器 / 组合 / AI 摘要面板，按反馈排序 | 按需 |

每轮门禁同现有红线：lint + typecheck + 前后端测试全绿才算完成一件。

## 5. 仓库与登记建议

- **建独立新仓库**（不放本仓库分支）：技术栈虽同源但产品无关，P2/P3 挤在
  本仓库分支已经造成 PR 冲突和「不要互相合并」的提醒成本——别再加一个。
  按 PROJECTS.md §C：`list_repos`/`add_repo` 纳入会话范围，状态记忆落新仓库自己的
  CLAUDE.md / PROJECTS 条目。
- 部署沿用 Render（团队已有 `render.yaml` 经验），前后端各一个 service。

## 6. 风险清单

| 风险 | 等级 | 对策 |
|------|------|------|
| 美股数据许可/限频 | 高 | MVP 用延迟数据+crypto 实时；后端统一缓存；升级付费源是老板的钱包决定 |
| 免费 API 随时改条款 | 中 | provider 适配器隔离，换源不动路由；mock 兜底永远在 |
| 范围蔓延（彭博功能无穷多） | 高 | 本文档 §1 的 ❌ 清单就是挡箭牌；新功能先进 backlog 不进当轮 |
| 合规观感（像荐股软件） | 中 | 显著免责声明；只展示数据与计算，不输出「买/卖」建议 |
| 与 P1 世界杯项目抢节奏 | 中 | 世界杯期间 P1 优先（赛事时效性）；本项目 7 月决赛后再提速是合理排期 |

## 7. 下一步（等老板一句话）

1. **拍板是否立项**＋确认「crypto 实时打头、美股延迟跟进」的数据策略；
2. 拍板后：建新仓库 → M0 骨架 → 在 PROJECTS.md §A 登记 P4 · Terminal。
