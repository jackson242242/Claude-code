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
  lastQuarter: RouteQuarterStats | null;
};

export type RouteQuarterStats = {
  pax: number;
  capacity: number;
  loadFactor: number; // 0–1
  revenue: number;
  cost: number;
  profit: number;
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
  news: NewsItem[]; // 本回合播报
  finance: {
    lastQuarter: { revenue: number; cost: number; profit: number } | null;
    history: { turn: number; cash: number; profit: number }[];
  };
  status: 'active' | 'bankrupt';
};

export type CompetitorRoute = { cityA: string; cityB: string; weeklySeats: number }; // 每方向每周座位

export type Competitor = {
  id: string; // "ai-aurora"
  name: string; // "Aurora Pacific"（虚构品牌，避开真实航司商标）
  nameZh: string; // "极光太平洋航空"
  hqCityId: string;
  fareMult: number; // 固定性格：0.9 低价 / 1.0 均衡 / 1.1 高端
  routes: CompetitorRoute[];
  marketShare: number; // 上季度份额 0–1
};

export type NewsItem = { headline: string; detail?: string; kind: 'system' | 'event' };

export type Command =
  | { type: 'buyAircraft'; modelId: string }
  | { type: 'leaseAircraft'; modelId: string }
  | { type: 'sellAircraft'; aircraftId: string } // 残值 = price × 0.7
  | { type: 'returnLease'; aircraftId: string }
  | { type: 'openRoute'; cityA: string; cityB: string }
  | { type: 'closeRoute'; routeId: string }
  | { type: 'assignAircraft'; aircraftId: string; routeId: string | null }
  | { type: 'updateRoute'; routeId: string; weeklyFlights?: number; fareMult?: number };

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
