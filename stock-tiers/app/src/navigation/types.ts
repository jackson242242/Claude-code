export type RootStackParamList = {
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
