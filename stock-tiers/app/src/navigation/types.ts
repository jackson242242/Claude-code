import type { Horizon } from "../api/types";

export type RootStackParamList = {
  ThesisInput: undefined;
  ThesisResults: { thesis: string; horizon: Horizon };
  HotStocks: undefined;
  TierList: { hotStockTicker: string; hotStockName: string };
  TickerDetail: {
    ticker: string;
    name: string;
    rationale?: string;
    tierJustification?: string;
    tier?: string;
  };
};
