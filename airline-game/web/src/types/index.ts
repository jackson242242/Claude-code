// Core types — mirror airline-game/CONTRACT.md §2 exactly. JSON is camelCase end to end.

export type City = {
  id: string; // "nyc"
  name: string; // "New York"
  nameZh: string; // "纽约"
  country: string;
  lat: number;
  lon: number;
  demandIndex: number; // 1–10
  slotFee: number; // 每次起降的机场费用（美元）
  slotCapacity: number; // M2.2：机场时刻（slot）总池
  // V3.9 城市禀赋（寓教于乐 + 开局差异化）
  iata: string; // "JFK"——真实主机场 IATA 代码
  airport: string; // "John F. Kennedy International Airport"
  airportZh: string; // "肯尼迪国际机场"
  population: number; // 都会区人口（百万，1 位小数）——展示与教学用，不进公式
  taxRelief: number; // 0–0.3：HQ 设此城时总部/管理开销 ×(1−taxRelief)
  transitIndex: number; // 1–10：城市公共交通成熟度，5 为中性
  terrain: 'coastal' | 'mountain' | 'island' | 'plain' | 'desert';
};

// M2.2 slot 市场（服务端每次响应计算好，前端只读）
export type CitySlotInfo = {
  capacity: number; // 总池 = city.slotCapacity
  taken: number; // 已被占用：AI 航线两端各占 1 + 玩家已持有(held)
  playerHeld: number; // 玩家持有的 slot 数（含已用）
  playerUsed: number; // 玩家航线占用数（每条航线在两端各用 1）
};

export type AircraftModel = {
  id: string; // "a320neo"
  manufacturer: string; // "Airbus"
  name: string; // "A320neo"
  seats: number;
  rangeKm: number;
  cruiseKmh: number;
  price: number; // 购置价（美元）
  fuelKgPerKm: number; // 巡航油耗
  introduced: number; // 投入运营年份
  badge?: string; // 例如 "2026 新机型"
};

export type FleetAircraft = {
  id: string; // "ac-1"
  modelId: string;
  ownership: 'owned' | 'leased';
  routeId: string | null; // 当前指派的航线
};

export type Route = {
  id: string; // "rt-1"
  cityA: string;
  cityB: string;
  distanceKm: number;
  aircraftIds: string[];
  weeklyFlights: number; // 每个方向每周班次
  fareMult: number; // 0.6–1.6，缺省 1.0
  cabinMix: CabinMix; // M2.3：占地百分比，三项整数和=100，缺省 {100,0,0}
  serviceTier: 1 | 2 | 3; // M2.3：1 低成本 / 2 标准 / 3 豪华，缺省 2
  lastQuarter: RouteQuarterStats | null;
};

export type CabinMix = { economy: number; business: number; first: number };

export type ClassStats = { pax: number; capacity: number; revenue: number };

export type RouteQuarterStats = {
  pax: number;
  capacity: number;
  loadFactor: number; // 0–1（按总座位）
  revenue: number;
  cost: number;
  profit: number;
  classes: { economy: ClassStats; business: ClassStats; first: ClassStats }; // M2.3
};

// M2.4 终局结算
export type FinalResult = {
  rank: number; // 玩家名次（含 4 家 AI 共 5 席，V3.10 起）
  victory: boolean; // rank === 1
  standings: { name: string; isPlayer: boolean; marketShare: number }[]; // 按名次排序
  cumulativeProfit: number;
  cumulativePax: number;
  endedTurn: number; // = GAME_LENGTH_TURNS
};

export type GameState = {
  id: string;
  airlineName: string;
  hqCityId: string;
  turn: number; // 从 1 开始
  year: number;
  quarter: 1 | 2 | 3 | 4; // 起始 2026 Q3
  cash: number;
  fleet: FleetAircraft[];
  routes: Route[];
  competitors: Competitor[]; // M2.1：3 家 AI 航司
  marketShare: number; // 玩家上季度客流占全市场服务客流比例 0–1（开局 0）
  slotMarket: { [cityId: string]: CitySlotInfo }; // M2.2：全城市 slot 市场快照
  news: NewsItem[]; // 本回合播报
  finance: {
    lastQuarter: { revenue: number; cost: number; profit: number } | null;
    history: { turn: number; cash: number; profit: number }[];
  };
  status: 'active' | 'bankrupt' | 'finished'; // finished：M2.4 到期结算
  lifetime: { profit: number; pax: number }; // M2.4：累计利润/乘客（每季累加）
  finalResult: FinalResult | null; // M2.4：终局前为 null
  activeEvents: ActiveEvent[]; // M3.1：当前生效事件
  brand: number; // V3.7：品牌声誉 0–100，开局 50
  marketing: Marketing; // V3.7：当前季度营销投放，开局 {0,0,0}
  pendingDecision: (DecisionEvent & { drawnTurn: number }) | null; // V3.7
};

export type CompetitorRoute = { cityA: string; cityB: string; weeklySeats: number }; // 每方向每周座位

export type Competitor = {
  id: string; // "ai-aurora"
  name: string; // "Aurora Pacific"（虚构品牌，避开真实航司商标）
  nameZh: string; // "极光太平洋航空"
  hqCityId: string;
  fareMult: number; // 固定性格：0.9 低价 / 1.0 均衡 / 1.1 高端
  style: 'aggressive' | 'premium' | 'budget' | 'network'; // V3.10：AI 管理风格
  styleZh?: string; // V3.10：风格中文显示名
  routes: CompetitorRoute[];
  marketShare: number; // 上季度份额 0–1
};

export type NewsItem = { headline: string; detail?: string; kind: 'system' | 'event' };

// M3.1 动态事件（静态库与 M4 新闻管道共用同一 schema）
export type EventEffect = {
  target: 'fuelCost' | 'demand' | 'slotFee' | 'serviceCost';
  mult: number; // 单条限 [0.5, 2.0]，越界事件整条作废
};

export type GameEvent = {
  id: string; // 静态库内唯一，如 "evt-fuel-spike"
  source: 'static' | 'news';
  headline: string; // 中文播报标题
  headlineEn?: string; // V3.1：英文标题（缺省回落中文）
  headlineEs?: string; // V3.1：西语标题（缺省回落中文）
  detail?: string;
  detailEn?: string; // V3.1：可选英文详情
  detailEs?: string; // V3.1：可选西语详情
  sourceUrl?: string; // news 事件的原始新闻链接（M4）
  scope: { kind: 'global' | 'city' | 'route'; ids: string[] };
  effects: EventEffect[]; // 1–3 条
  durationTurns: number; // 限 [1, 8]
  severity: 'minor' | 'major';
};

export type ActiveEvent = GameEvent & { startedTurn: number; remainingTurns: number };

// V3.7 互动 PR/营销
export type DecisionOption = {
  id: string;
  label: string;
  labelEn?: string;
  labelEs?: string;
  cashDelta: number; // 立即现金变动（负=花钱），限 [-30M, +10M]
  brandDelta: number; // 品牌变动，限 [-15, +15]
  isDefault?: boolean; // 恰一项为 true：超时/结算时自动采用
};

export type DecisionEvent = {
  id: string;
  prompt: string;
  promptEn?: string;
  promptEs?: string;
  detail?: string;
  detailEn?: string;
  detailEs?: string;
  options: DecisionOption[]; // 2–3 项
  expiresTurn: number; // 抽出回合+1：结算该回合时若未决则按 default 自动采用
};

export type Marketing = { digital: number; sponsor: number; service: number }; // 各 0–10（$M/季）

export type Command =
  | { type: 'resolveDecision'; optionId: string } // V3.7：裁决待定抉择
  | { type: 'setMarketing'; marketing: Marketing } // V3.7：设季度营销投放
  | { type: 'buyAircraft'; modelId: string }
  | { type: 'leaseAircraft'; modelId: string }
  | { type: 'sellAircraft'; aircraftId: string } // 残值 = price × 0.7
  | { type: 'returnLease'; aircraftId: string }
  | { type: 'negotiateSlot'; cityId: string } // M2.2：谈判获取 1 个 slot
  | { type: 'openRoute'; cityA: string; cityB: string }
  | { type: 'closeRoute'; routeId: string }
  | { type: 'assignAircraft'; aircraftId: string; routeId: string | null }
  | {
      type: 'updateRoute';
      routeId: string;
      weeklyFlights?: number;
      fareMult?: number;
      cabinMix?: CabinMix; // 三项非负整数和必须=100
      serviceTier?: 1 | 2 | 3;
    };

export type TurnReport = {
  turn: number;
  year: number;
  quarter: number;
  routeStats: (RouteQuarterStats & { routeId: string })[];
  totals: { revenue: number; cost: number; profit: number };
  news: NewsItem[];
};

export type CommandResult = { index: number; ok: boolean; message?: string };

export type Meta = { cities: City[]; aircraftModels: AircraftModel[] };

export type CommandsResponse = { state: GameState; results: CommandResult[] };

export type EndTurnResponse = { state: GameState; report: TurnReport };

// aircraft-images.json manifest entry — CONTRACT §6.
export type AircraftImageEntry = {
  url: string;
  filePage: string;
  credit: string;
};

export type AircraftImageManifest = Record<string, AircraftImageEntry>;

// city-images.json manifest entry — skyline photos.
export type CityImageEntry = {
  url: string;
  filePage: string;
  credit: string;
};

export type CityImageManifest = Record<string, CityImageEntry>;
