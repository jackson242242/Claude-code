import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { runResearch } from "../../api/endpoints";
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
      trend: "AI 平台迁移",
      thesis: "AI compute",
      currentPrice: 120,
      sinceEntryPct: 0.2,
      oneYearChangePct: 0.74,
    },
  ],
  trendSlices: [{ trend: "AI 平台迁移", tickers: ["NVDA"], weightPct: 1 }],
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

  it("renders holdings, trend slices, and the research report", () => {
    mockedUsePortfolio.mockReturnValue({ data: VIEW, loading: false, error: null, reload: jest.fn() });
    mockedUseResearch.mockReturnValue({ data: REPORT, loading: false, error: null, reload: jest.fn() });
    const { getByTestId, getByText } = renderScreen();
    expect(getByTestId("holding-NVDA")).toBeTruthy();
    expect(getByTestId("trend-slices")).toBeTruthy();
    expect(getByTestId("note-NVDA")).toBeTruthy();
    expect(getByText("组合稳定。")).toBeTruthy();
  });

  it("shows the empty state before any position is added", () => {
    mockedUsePortfolio.mockReturnValue({
      data: { ...VIEW, holdings: [], trendSlices: [] },
      loading: false,
      error: null,
      reload: jest.fn(),
    });
    mockedUseResearch.mockReturnValue({ data: null, loading: false, error: null, reload: jest.fn() });
    const { getByTestId, getByText } = renderScreen();
    expect(getByText(/还没有持仓/)).toBeTruthy();
    expect(getByTestId("no-research")).toBeTruthy();
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
