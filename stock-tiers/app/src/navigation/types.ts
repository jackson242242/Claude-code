import type { Horizon } from "../api/types";

export type RootStackParamList = {
  ThesisInput: undefined;
  ThesisResults: { thesis: string; horizon: Horizon; trendName?: string };
  HotStocks: undefined;
  TierList: { hotStockTicker: string; hotStockName: string };
  TickerDetail: {
    ticker: string;
    name: string;
    rationale?: string;
    tierJustification?: string;
    tier?: string;
    // Context for "add to portfolio": which thesis/trend this pick expresses.
    thesis?: string;
    trendName?: string;
  };
  Portfolio: undefined;
  Trends: undefined;
  Brief: undefined;
};
