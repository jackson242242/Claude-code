import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { runKolScan } from "../../api/endpoints";
import type { KolReport } from "../../api/types";
import { useKolReports } from "../../hooks/useKolReports";
import { KolScreen } from "../KolScreen";

jest.mock("../../hooks/useKolReports");
jest.mock("../../api/endpoints");

const mockedUseKolReports = useKolReports as jest.MockedFunction<typeof useKolReports>;
const mockedRunKolScan = runKolScan as jest.MockedFunction<typeof runKolScan>;

const renderScreen = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render(<KolScreen navigation={{ navigate: jest.fn() } as any} route={{ key: "k", name: "Kol" } as any} />);

const REPORT: KolReport = {
  handle: "serenity",
  summary: "该账号近三天几乎只晒盈利单。",
  scoreboard: {
    handle: "serenity",
    postsAnalyzed: 12,
    gainPosts: 10,
    lossPosts: 1,
    boastGainRatio: 10 / 11,
    callsTracked: 4,
    wins: 1,
    losses: 3,
    winRate: 0.25,
    avgReturnPct: -0.04,
    updatedAt: "2026-07-15T12:00:00Z",
  },
  recentPosts: [
    {
      id: "p1",
      handle: "serenity",
      date: "2026-07-14",
      url: null,
      excerpt: "Locked in +40% on NVDA calls",
      postType: "pnl_boast",
      claimedResult: "gain",
      tickers: ["NVDA"],
    },
  ],
  calls: [
    {
      id: "c1",
      handle: "serenity",
      ticker: "AMD",
      direction: "long",
      date: "2026-07-10",
      sourceExcerpt: "Long AMD here",
      entryPrice: 180,
      currentPrice: 168.2,
      returnPct: -0.0656,
    },
  ],
  generatedAt: "2026-07-15T12:00:00Z",
  disclaimer: "not advice",
};

describe("KolScreen", () => {
  afterEach(() => jest.clearAllMocks());

  it("renders scoreboard, survivorship-bias flag, and verified calls", () => {
    mockedUseKolReports.mockReturnValue({ data: [REPORT], loading: false, error: null, reload: jest.fn() });
    const { getByTestId, getByText } = renderScreen();
    expect(getByTestId("kol-serenity")).toBeTruthy();
    expect(getByText("报喜率(他自己说)")).toBeTruthy();
    // 报喜率 91% > 85% -> survivorship-bias warning shown
    expect(getByTestId("bias-flag-serenity")).toBeTruthy();
    // Real-market verification, not the poster's claims
    expect(getByText(/入场 \$180\.00/)).toBeTruthy();
    expect(getByText("Locked in +40% on NVDA calls")).toBeTruthy();
  });

  it("runs a scan on demand", async () => {
    mockedUseKolReports.mockReturnValue({ data: [], loading: false, error: null, reload: jest.fn() });
    mockedRunKolScan.mockResolvedValue([REPORT]);
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId("run-kol-scan"));
    await waitFor(() => expect(mockedRunKolScan).toHaveBeenCalled());
    await waitFor(() => expect(getByTestId("kol-serenity")).toBeTruthy());
  });

  it("hides the bias flag when the account also posts losses", () => {
    const balanced: KolReport = {
      ...REPORT,
      scoreboard: { ...REPORT.scoreboard, boastGainRatio: 0.6 },
    };
    mockedUseKolReports.mockReturnValue({ data: [balanced], loading: false, error: null, reload: jest.fn() });
    const { queryByTestId } = renderScreen();
    expect(queryByTestId("bias-flag-serenity")).toBeNull();
  });
});
