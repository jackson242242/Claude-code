# SkyEmpire M1 — API 契约与经济模型（前后端共同遵守）

> 本文件是 `airline-game/api`（FastAPI）与 `airline-game/web`（Next.js）之间的唯一契约。
> 任何改动必须先改这里。JSON 一律 camelCase（后端用 Pydantic alias generator，
> 与仓库根项目同一约定）。

## 0. 目录与端口
- 后端：`airline-game/api`，dev 跑在 **http://localhost:8001**（避开 Matchday26 的 8000）。
- 前端：`airline-game/web`，dev 跑在 **http://localhost:3001**（`next dev -p 3001`）。
  API 基址取 `NEXT_PUBLIC_API_URL`，缺省 `http://localhost:8001`。
- 数据表（两端共用的事实源）：`airline-game/data/cities.json`、`airline-game/data/aircraft.json`。
  后端启动时加载；前端把它们作为静态导入（构建期复制或直接 import 相对路径均可）。
- 机型图片清单：`airline-game/data/aircraft-images.json`（schema 见 §6），由主会话维护。

## 1. REST API

所有响应 `Content-Type: application/json`。错误统一
`{"error": {"message": string, "type": string}}`（HTTP 400/404/422），与根项目同款全局异常处理。

| Method | Path | Body | 返回 |
|---|---|---|---|
| GET | `/api/meta` | — | `{ cities: City[], aircraftModels: AircraftModel[] }` |
| POST | `/api/games` | `{ airlineName: string, hqCityId: string }` | `GameState`（201） |
| GET | `/api/games/{gameId}` | — | `GameState` |
| POST | `/api/games/{gameId}/commands` | `{ commands: Command[] }` | `{ state: GameState, results: CommandResult[] }` |
| POST | `/api/games/{gameId}/end-turn` | `{}` | `{ state: GameState, report: TurnReport }` |

- 命令立即生效（买机即时交付——交付周期留给 M2）。
- 缺省值：新开航线 `weeklyFlights = 7`、`fareMult = 1.0`；`leaseAircraft` 无首付，
  只产生每季度租金；`CommandResult.message` 缺省序列化为 `null`。
- `CommandResult = { index: number, ok: boolean, message?: string }`；单条失败不影响其余命令。
- 存储：内存 dict + 进程内自增 id（M1 不接 PG；接口留 service 层便于 M5 换存储）。

## 2. 核心类型（TypeScript 形式，后端 Pydantic 同构）

```ts
type City = {
  id: string;            // "nyc"
  name: string;          // "New York"
  nameZh: string;        // "纽约"
  country: string;
  lat: number; lon: number;
  demandIndex: number;   // 1–10
  slotFee: number;       // 每次起降的机场费用（美元）
  slotCapacity: number;  // M2.2：机场时刻（slot）总池
};

// M2.2 slot 市场（服务端每次响应计算好，前端只读）
type CitySlotInfo = {
  capacity: number;      // 总池 = city.slotCapacity
  taken: number;         // 已被占用：AI 航线两端各占 1 + 玩家已持有(held)
  playerHeld: number;    // 玩家持有的 slot 数（含已用）
  playerUsed: number;    // 玩家航线占用数（每条航线在两端各用 1）
};

type AircraftModel = {
  id: string;            // "a320neo"
  manufacturer: string;  // "Airbus"
  name: string;          // "A320neo"
  seats: number;
  rangeKm: number;
  cruiseKmh: number;
  price: number;         // 购置价（美元）
  fuelKgPerKm: number;   // 巡航油耗
  introduced: number;    // 投入运营年份（全部为 2026 现役主流机型）
  badge?: string;        // 例如 "2026 新机型"
};

type FleetAircraft = {
  id: string;                 // "ac-1"
  modelId: string;
  ownership: "owned" | "leased";
  routeId: string | null;     // 当前指派的航线
};

type Route = {
  id: string;                 // "rt-1"
  cityA: string; cityB: string;
  distanceKm: number;
  aircraftIds: string[];
  weeklyFlights: number;      // 每个方向每周班次
  fareMult: number;           // 0.6–1.6，缺省 1.0
  cabinMix: CabinMix;         // M2.3：占地百分比，三项整数和=100，缺省 {100,0,0}
  serviceTier: 1 | 2 | 3;     // M2.3：1 低成本 / 2 标准 / 3 豪华，缺省 2
  lastQuarter: RouteQuarterStats | null;
};

type CabinMix = { economy: number; business: number; first: number };

type ClassStats = { pax: number; capacity: number; revenue: number };

type RouteQuarterStats = {
  pax: number; capacity: number; loadFactor: number;  // 0–1（按总座位）
  revenue: number; cost: number; profit: number;
  classes: { economy: ClassStats; business: ClassStats; first: ClassStats }; // M2.3
};

type GameState = {
  id: string;
  airlineName: string;
  hqCityId: string;
  turn: number;               // 从 1 开始
  year: number; quarter: 1 | 2 | 3 | 4;   // 起始 2026 Q3
  cash: number;
  fleet: FleetAircraft[];
  routes: Route[];
  competitors: Competitor[];  // M2.1：3 家 AI 航司
  marketShare: number;        // 玩家上季度客流占全市场服务客流比例 0–1（开局 0）
  slotMarket: { [cityId: string]: CitySlotInfo };  // M2.2：全城市 slot 市场快照
  news: NewsItem[];           // 本回合播报（M1 为系统消息，M3 接事件）
  finance: {
    lastQuarter: { revenue: number; cost: number; profit: number } | null;
    history: { turn: number; cash: number; profit: number }[];
  };
  status: "active" | "bankrupt" | "finished";   // finished：M2.4 到期结算
  lifetime: { profit: number; pax: number };    // M2.4：累计利润/乘客（每季累加）
  finalResult: FinalResult | null;              // M2.4：终局前为 null
  activeEvents: ActiveEvent[];                  // M3.1：当前生效事件
};

// M2.4 终局结算
type FinalResult = {
  rank: 1 | 2 | 3 | 4;          // 玩家名次（含 3 家 AI 共 4 席）
  victory: boolean;             // rank === 1
  standings: { name: string; isPlayer: boolean; marketShare: number }[]; // 按名次排序
  cumulativeProfit: number; cumulativePax: number;
  endedTurn: number;            // = GAME_LENGTH_TURNS
};

type CompetitorRoute = { cityA: string; cityB: string; weeklySeats: number }; // 每方向每周座位

type Competitor = {
  id: string;                 // "ai-aurora"
  name: string;               // "Aurora Pacific"（虚构品牌，避开真实航司商标）
  nameZh: string;             // "极光太平洋航空"
  hqCityId: string;
  fareMult: number;           // 固定性格：0.9 低价 / 1.0 均衡 / 1.1 高端
  routes: CompetitorRoute[];
  marketShare: number;        // 上季度份额 0–1
};

type NewsItem = { headline: string; detail?: string; kind: "system" | "event" };

// M3.1 动态事件（静态库与 M4 新闻管道共用同一 schema）
type EventEffect = {
  target: "fuelCost" | "demand" | "slotFee" | "serviceCost";
  mult: number;               // 单条限 [0.5, 2.0]，越界事件整条作废
};

type GameEvent = {
  id: string;                 // 静态库内唯一，如 "evt-fuel-spike"
  source: "static" | "news";
  headline: string;           // 中文播报标题
  detail?: string;
  sourceUrl?: string;         // news 事件的原始新闻链接（M4）
  scope: { kind: "global" | "city" | "route"; ids: string[] };
  effects: EventEffect[];     // 1–3 条
  durationTurns: number;      // 限 [1, 8]
  severity: "minor" | "major";
};

type ActiveEvent = GameEvent & { startedTurn: number; remainingTurns: number };

type Command =
  | { type: "buyAircraft";   modelId: string }
  | { type: "leaseAircraft"; modelId: string }
  | { type: "sellAircraft";  aircraftId: string }      // 残值 = price × 0.7
  | { type: "returnLease";   aircraftId: string }
  | { type: "negotiateSlot"; cityId: string }   // M2.2：谈判获取 1 个 slot
  | { type: "openRoute";     cityA: string; cityB: string }
  | { type: "closeRoute";    routeId: string }
  | { type: "assignAircraft"; aircraftId: string; routeId: string | null }
  | { type: "updateRoute";   routeId: string; weeklyFlights?: number; fareMult?: number;
      cabinMix?: CabinMix; serviceTier?: 1 | 2 | 3 };  // cabinMix 三项非负整数和必须=100

type TurnReport = {
  turn: number; year: number; quarter: number;
  routeStats: (RouteQuarterStats & { routeId: string })[];
  totals: { revenue: number; cost: number; profit: number };
  news: NewsItem[];
};
```

## 3. 经济模型（引擎按此实现，常数集中在 `api/app/engine/balance.py`）

- **距离**：haversine(cityA, cityB)，开航线时算好存进 Route。
- **航线合法性**：开航必有一端为 HQ（M1 简化为枢纽辐射式）；两城唯一航线；
  指派机型 `rangeKm ≥ distanceKm`。
- **slot 制度（M2.2）**：每条玩家航线在两端城市各占用 1 个**已持有** slot；
  开航前两端都必须有空闲持有 slot（`playerHeld − playerUsed ≥ 1`），否则报错
  提示先谈判；关航线释放占用（slot 仍持有，可复用）。玩家开局在 HQ 持有 2 个
  slot，其余城市 0。AI 航线两端各占 1 个池内 slot（AI 开新线时若目标城市池满
  ——`taken ≥ capacity`——确定性顺延到下一个候选城市）。
- **slot 谈判**：命令 `negotiateSlot {cityId}`。确定性结算（无 RNG）：
  - 失败条件（按序检查并报相应错误）：该城市本回合已谈判过（每城每回合 1 次，
    `lastNegotiationTurn` 记录）；池已满（`taken ≥ capacity`）；现金不足。
  - 成本：`slotFee × 800 × (1 + taken/capacity)`，立即扣款，`playerHeld + 1`。
  - 城市池快照 `slotMarket` 由服务端在每次返回 GameState 时重算。
- **市场需求**（双向合计，人次/季度）：
  `marketPax = BASE_K × demandA × demandB × seasonFactor(quarter) × distanceDecay`
  其中 `distanceDecay = exp(-distanceKm / 9000)`，`seasonFactor = [Q1:0.9, Q2:1.0, Q3:1.15, Q4:0.95]`。
- **份额竞争模型（M2.1，取代旧常数 SHARE_BASE）**：对每条城市对，卖方 = 玩家航线
  （若有）+ 所有同城市对的 AI 航线 + **背景市场**（其余航司的抽象集合）。
  - 价格权重：`w_i = fareMult_i ** PRICE_ELASTICITY`；背景权重 `W_BG = 11/9`
    （精确使「无 AI 竞争、fareMult=1」时玩家份额 = 0.45，与 M1 平衡完全一致）。
  - 份额：`share_i = w_i / (Σ_j w_j + W_BG)`。
  - 成交：`pax_i = min(capacity_i, marketPax × w_i × share_i)`（w 同时承担弹性，
    M1 的 demandMult 不再单独出现）。某卖方撞容量上限时，未满足需求按权重比例
    **再分配一轮**给未满载卖方（含背景），只做一轮，保持确定性。
  - AI 航线容量：`weeklySeats × 2 × 13`（双向、13 周，与玩家同口径）。
- **AI 航司（3 家，纯函数确定性，伪随机种子 = hash(gameId, turn, aiId)）**：
  - Aurora Pacific／极光太平洋航空（HQ 东京 hnd，fareMult 0.9）、
    Royal Meridian／皇家子午线航空（HQ 伦敦 lhr，fareMult 1.1）、
    Falcon Dunes／沙丘猎鹰航空（HQ 迪拜 dxb，fareMult 1.0）。
  - 初始各 2 条 HQ 航线（固定表，刻意避开 nyc 城市对以不干扰平衡性验收）：
    hnd-pvg、hnd-sin；lhr-fra、lhr-dxb；dxb-sin、dxb-cdg。初始 weeklySeats=2200。
  - 每回合结算前演进：最大航线 weeklySeats ×1.08（向上取整）；每第 4 回合
    （turn%4==0）从 HQ 向其尚未服务的 demandIndex 最高城市开新航线
    （weeklySeats=2000），并产生 NewsItem（kind:"system"）播报。
  - `marketShare`（玩家与 AI 同口径）= 该航司本季度 pax ÷ 当季所有卖方
    （含背景）pax 总和；无任何航线时为 0。
- **票价**：经济舱 `fare = (FARE_FIXED + FARE_PER_KM × distanceKm) × fareMult`；
  商务舱 = 经济舱 × `BIZ_FARE_MULT (3.0)`；头等舱 = 经济舱 × `FIRST_FARE_MULT (6.5)`。
- **舱位与服务（M2.3）**：`cabinMix` 是**占地百分比**（商务 1 座占 2.5 个经济座
  位空间、头等占 5 个）：`econSeats = seats×mixE/100`、`bizSeats = seats×mixB/100/2.5`、
  `firstSeats = seats×mixF/100/5`（各自向下取整）。容量与客座率按**总可售座位**
  （三舱之和）计。需求按舱位拆分：`DEMAND_SPLIT = {economy: 0.88, business: 0.09,
  first: 0.03}`——玩家在该城市对分得的总客流按此比例分舱，逐舱
  `pax_class = min(capacity_class, allocated × split_class)`，不跨舱回流（M3 不做溢出）。
  `serviceTier` 影响竞争权重与成本：玩家价格权重 `w ×= SERVICE_WEIGHT[tier]`
  （{1: 0.85, 2: 1.0, 3: 1.15}），每乘客服务成本 `SERVICE_COST_PER_PAX[tier]`
  （{1: $12, 2: $25, 3: $45}）计入航线成本。**裁决记录**：缺省 `cabinMix={100,0,0}`
  时商务/头等容量为 0，分舱拆分旁路（全部客流入经济舱）——与 M2.2 分配完全一致；
  但服务成本在任何 tier（含缺省 2 的 $25/客）都计入，4 条平衡性验收靠利润余量
  原样通过，不视为破坏。
- **价格弹性**：`demandMult = fareMult ** PRICE_ELASTICITY`（PRICE_ELASTICITY ≈ −1.6）。
- **运力**：`capacity = Σ(assigned aircraft seats) × weeklyFlights × 2 × 13`（双向、13 周）。
  约束：每架飞机周飞行小时 ≤ 84：`weeklyFlights × 2 × (distanceKm/cruiseKmh + 0.6) ≤ 84 × nAircraft`，
  超出时 `updateRoute` 报错。
- **成交客流**：`pax = min(capacity, marketPax × share × demandMult)`。
- **季度成本**（按航线）：
  - 燃油：`distanceKm × fuelKgPerKm × FUEL_USD_PER_KG × flights`（flights = weeklyFlights×2×13）
  - 机场费：`(slotFeeA + slotFeeB) × flights`
  - 机组+维护：`blockHours × CREW_MAINT_USD_PER_BH`（blockHours = flights × (distance/cruise + 0.6)）
- **机队持有成本**（按飞机/季度）：自有 = `price × DEPRECIATION_Q`（1.25%）；
  租赁 = `price × LEASE_RATE_Q`（2.75%）。未指派的飞机同样产生持有成本。
- **总部开销**：`HQ_OVERHEAD + ADMIN_PER_AIRCRAFT × fleetSize` 每季度。
- **破产**：连续 2 个季度结束时 `cash < 0` → `status = "bankrupt"`，拒绝后续命令与回合。
- **动态事件（M3.1）**：每回合结算**开始**时处理事件，顺序：先递减 remainingTurns
  并移除到期事件，再确定性抽取新事件（PRNG 种子 = 字符串 `"{gameId}:{turn}"`，
  `random.Random(seed)`）：以 `EVENT_CHANCE = 0.45` 概率从事件池抽 1 条
  （按 `severity` 加权：minor 权重 3、major 权重 1；已激活的 id 不重复抽）。
  - 事件池 = 静态库 `data/events-static.json`（M3.2 填充，M3.1 先用测试夹具）
    ＋ 待生效新闻事件（M4.3）。schema 校验失败或 mult 越界的条目整条忽略。
  - **效果应用**（同 target 多事件相乘，乘积夹紧 [0.25, 4.0]）：
    `demand` → 作用域内城市对的 `marketPax`；`fuelCost` → 燃油成本；
    `slotFee` → 机场费；`serviceCost` → 每客服务成本。
    作用域命中：global = 全部；city = 城市对任一端 ∈ ids；route = 两端恰为 ids 两城。
    AI 与玩家同受影响（分配模型的 marketPax 是共用的；成本类仅作用玩家——AI 无成本模型）。
  - 激活时生成 `NewsItem{kind:"event"}` 播报进当回合季报；`activeEvents` 随状态返回。
- **终局（M2.4）**：`GAME_LENGTH_TURNS = 80`（2026 Q3 → 2046 Q2，20 年）。第 80 回合
  结算完成后 `status = "finished"`，计算 `finalResult` 并随状态返回；此后命令与
  end-turn 一律拒绝（与破产同语义，错误信息区分「比赛已结束」）。
  - 名次：按**最终季度 marketShare** 降序排玩家+3 家 AI；并列时玩家优先，
    AI 间按名册顺序（确定性）。`victory = (rank === 1)`。
  - `lifetime.profit/pax` 每季度结算时累加（含亏损季，pax 为实际成交客流）。
- **起始条件**：现金 **$420M**，无机队无航线，2026 年 Q3 开局。

**平衡性验收目标（写成 pytest 断言，调常数直到通过）**。注意：目标里的「每周 N 班」
指**双向合计起降班次**，即 `weeklyFlights = N/2`（`weeklyFlights` 字段本身是每方向班次，
允许小数）；按字面取 `weeklyFlights=N` 会直接撞上 84 小时利用率上限，不可行：
1. 1 架自有 A320neo、HQ 纽约 ↔ demandIndex≥7 的 ~2,000–4,000km 航线、每周 14 班、
   fareMult 1.0 → 客座率 70–90%，季度航线利润为正。
2. 1 架自有 787-9 跑 纽约↔伦敦 每周 7 班 → 客座率 ≥ 75%，含持有成本后仍盈利。
3. fareMult 1.6 时上述航线客流显著下降（弹性生效），fareMult 0.6 时满载但利润下降。
4. 全款买 3 架 A320neo 后现金仍 > $80M（起始资金校验）。

## 4. 后端实现要求（`airline-game/api`）
- FastAPI + Pydantic v2，`alias_generator=to_camel, populate_by_name=True`。
- **引擎为纯函数**：`app/engine/`（`state.py` 数据类、`commands.py`、`simulate.py`、
  `balance.py` 常数）。引擎不 import FastAPI/存储。
- 路由层薄：`app/main.py` + `app/routes/games.py`；全局异常处理同根项目风格。
- 测试 `api/tests/`：命令校验（非法城市/超航程/现金不足/利用率超限）、回合结算数字
  可复算、§3 的 4 条平衡性断言、API 烟雾测试（TestClient 全流程：建局→买机→开航→
  指派→结算→破产路径）。
- `api/requirements.txt`（fastapi、uvicorn、pytest、httpx）；venv 放 `airline-game/api/.venv`。

## 5. 前端实现要求（`airline-game/web`）
- Next.js 15 App Router + TS strict + Tailwind 4（依赖版本对齐仓库根 `package.json`），
  函数组件+箭头函数，无 any，无 Redux/Axios。
- 手机竖屏优先的单页游戏盘面：
  - **顶栏**：航司名、现金、`2026 Q3` 回合显示、「下一季度」按钮（结算后弹出季报）。
  - **地图**：SVG 世界地图（用 npm 包 `world-atlas`(land-110m) + `topojson-client` +
    `d3-geo` 的 `geoNaturalEarth1` 投影，构建期/模块顶层生成 path，不要运行时拉网络）。
    城市为可点节点，航线画大圆弧线，HQ 高亮。
  - **底部抽屉**（移动端 tab）：航线｜机队｜机型市场｜财务｜新闻。
  - **机型市场**：真实飞机照片卡片（图片清单见 §6，`<img>` 加 `loading="lazy"`、
    onError 降级为机型剪影占位 SVG + 型号文字），含座位/航程/价格/「购买/租赁」。
  - **季报弹层**：各航线客座率/利润 + 总损益 + 新闻播报。
- 状态：每次命令/结算后以服务端返回的 `GameState` 整体替换（单 `useState`），
  API 封装在 `web/src/services/api.ts`。游戏 id 存 `localStorage` 续局。
- 视觉基调：深色「航司运营中心」风（深蓝黑底、青色航线光弧、琥珀色强调），
  画质优先：照片卡片、地图弧线动画（CSS 即可）。页脚/新闻 tab 内含「图片来源与署名」
  入口（读 aircraft-images.json 的 credit 字段逐条列出）。
- 测试（Jest + RTL，配置仿根项目）：api service 单测（fetch mock）+ 机型卡片组件
  渲染测试 + 金额格式化等工具函数测试。`npm run lint`、`npm run typecheck` 必须过。

## 6. aircraft-images.json schema（主会话负责生成数据）
```jsonc
{
  "a350-1000": {
    "url": "https://commons.wikimedia.org/wiki/Special:FilePath/<file>?width=1280",
    "filePage": "https://commons.wikimedia.org/wiki/File:<file>",
    "credit": "Photo via Wikimedia Commons（作者与许可证见文件页）"
  }
}
```
前端按 `modelId` 取图；取不到或加载失败一律走剪影降级，不得破版。
