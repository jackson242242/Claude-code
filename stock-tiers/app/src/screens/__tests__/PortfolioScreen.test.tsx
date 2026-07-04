import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { runResearch, updatePosition } from "../../api/endpoints";
import type { PortfolioView, ResearchReport } from "../../api/types";
import { usePortfolio } from "../../hooks/usePortfolio";
import { useResearch } from "../../hooks/useResearch";
import { PortfolioScreen } from "../PortfolioScreen";

jest.mock("../../hooks/usePortfolio");
jest.mock("../../hooks/useResearch");
jest.mock("../../api/endpoints");

const mockedUsePortfolio = usePortfolio as jest.MockedFunction<typeof usePortfolio>;
const mockedUseResearch = useResearch as jest.MockedFunction<typeof useResearch>;
const mockedRunResearch = runResearch as jest.MockedFunction<typeof runResearch>;
const mockedUpdatePosition = updatePosition as jest.MockedFunction<typeof updatePosition>;

const renderScreen = () =>
  render(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <PortfolioScreen navigation={{ navigate: jest.fn() } as any} route={{ key: "k", name: "Portfolio" } as any} />,
  );

const VIEW: PortfolioView = {
  holdings: [
    {
      ticker: "NVDA",
      name: "NVIDIA",
      entryPrice: 100,
      entryDate: "2026-06-01",
      shares: 10,
      trend: "AI 平台迁移",
      thesis: "AI compute",
      currentPrice: 120,
      sinceEntryPct: 0.2,
      oneYearChangePct: 0.74,
      costBasis: 1000,
      marketValue: 1200,
      pnl: 200,
      weightPct: 1,
    },
  ],
  trendSlices: [{ trend: "AI 平台迁移", tickers: ["NVDA"], weightPct: 1 }],
  totalCost: 1000,
  totalValue: 1200,
  totalPnl: 200,
  totalPnlPct: 0.2,
  alerts: [{ level: "warning", message: "整个组合押在单一方向上" }],
  disclaimer: "not advice",
  generatedAt: "2026-07-04T00:00:00Z",
};

const REPORT: ResearchReport = {
  summary: "组合稳定。",
  notes: [{ ticker: "NVDA", headline: "需求强劲", thesisStatus: "intact", note: "订单持续。" }],
  diversification: "AI 占比高。",
  generatedAt: "2026-07-04T00:00:00Z",
  disclaimer: "not advice",
};

describe("PortfolioScreen", () => {
  afterEach(() => jest.clearAllMocks());

  it("renders totals, alerts, holdings, trend slices, and the research report", () => {
    mockedUsePortfolio.mockReturnValue({ data: VIEW, loading: false, error: null, reload: jest.fn() });
    mockedUseResearch.mockReturnValue({ data: REPORT, loading: false, error: null, reload: jest.fn() });
    const { getByTestId, getByText, getAllByText } = renderScreen();
    expect(getByTestId("portfolio-stats")).toBeTruthy();
    // Real P&L from shares — shown in both the totals card and the holding row.
    expect(getAllByText("+$200.00 (+20.0%)").length).toBeGreaterThan(0);
    expect(getByTestId("alerts")).toBeTruthy();
    expect(getByText(/单一方向/)).toBeTruthy();
    expect(getByTestId("holding-NVDA")).toBeTruthy();
    expect(getByTestId("trend-slices")).toBeTruthy();
    expect(getByTestId("note-NVDA")).toBeTruthy();
    expect(getByText("组合稳定。")).toBeTruthy();
  });

  it("shows the empty state before any position is added", () => {
    mockedUsePortfolio.mockReturnValue({
      data: { ...VIEW, holdings: [], trendSlices: [], alerts: [] },
      loading: false,
      error: null,
      reload: jest.fn(),
    });
    mockedUseResearch.mockReturnValue({ data: null, loading: false, error: null, reload: jest.fn() });
    const { getByTestId, getByText } = renderScreen();
    expect(getByText(/还没有持仓/)).toBeTruthy();
    expect(getByTestId("no-research")).toBeTruthy();
  });

  it("edits a position and saves via PATCH", async () => {
    const reload = jest.fn();
    mockedUsePortfolio.mockReturnValue({ data: VIEW, loading: false, error: null, reload });
    mockedUseResearch.mockReturnValue({ data: null, loading: false, error: null, reload: jest.fn() });
    mockedUpdatePosition.mockResolvedValue({
      ticker: "NVDA",
      name: "NVIDIA",
      entryPrice: 95,
      entryDate: "2026-06-01",
      shares: 40,
      trend: "AI 平台迁移",
      thesis: "AI compute",
      addedAt: "2026-06-01T00:00:00Z",
    });

    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId("edit-NVDA"));
    fireEvent.changeText(getByTestId("edit-shares-NVDA"), "40");
    fireEvent.changeText(getByTestId("edit-price-NVDA"), "95");
    fireEvent.press(getByTestId("save-NVDA"));

    await waitFor(() =>
      expect(mockedUpdatePosition).toHaveBeenCalledWith("NVDA", {
        shares: 40,
        entryPrice: 95,
        entryDate: "2026-06-01",
        trend: "AI 平台迁移",
      }),
    );
    await waitFor(() => expect(reload).toHaveBeenCalled());
  });

  it("runs research on demand and reloads the report", async () => {
    const reloadResearch = jest.fn();
    mockedUsePortfolio.mockReturnValue({ data: VIEW, loading: false, error: null, reload: jest.fn() });
    mockedUseResearch.mockReturnValue({ data: null, loading: false, error: null, reload: reloadResearch });
    mockedRunResearch.mockResolvedValue(REPORT);

    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId("run-research"));
    await waitFor(() => expect(mockedRunResearch).toHaveBeenCalled());
    await waitFor(() => expect(reloadResearch).toHaveBeenCalled());
  });
});
