import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { discoverTrends } from "../../api/endpoints";
import type { SecularTrend } from "../../api/types";
import { useTrends } from "../../hooks/useTrends";
import { TrendsScreen } from "../TrendsScreen";

jest.mock("../../hooks/useTrends");
jest.mock("../../api/endpoints");

const mockedUseTrends = useTrends as jest.MockedFunction<typeof useTrends>;
const mockedDiscover = discoverTrends as jest.MockedFunction<typeof discoverTrends>;

const makeNav = () => ({ navigate: jest.fn() });
const renderScreen = (nav: ReturnType<typeof makeNav>) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render(<TrendsScreen navigation={nav as any} route={{ key: "k", name: "Trends" } as any} />);

const ANCHOR: SecularTrend = {
  id: "ai平台迁移",
  name: "AI 平台迁移",
  category: "科技",
  thesis: "AI 是十年平台迁移",
  whyNow: "算力开支加速",
  horizon: "long",
  discoveredAt: "2026-07-04T00:00:00Z",
};

const GRID: SecularTrend = {
  id: "电网升级",
  name: "电网升级",
  category: "能源",
  thesis: "电力需求加速,电网设备必须扩容",
  whyNow: "用电量首次多年加速",
  horizon: "long",
  discoveredAt: "2026-07-04T00:00:00Z",
};

describe("TrendsScreen", () => {
  afterEach(() => jest.clearAllMocks());

  it("lists tracked trends and opens one as a thesis", () => {
    mockedUseTrends.mockReturnValue({ data: [ANCHOR], loading: false, error: null, reload: jest.fn() });
    const nav = makeNav();
    const { getByTestId } = renderScreen(nav);
    fireEvent.press(getByTestId(`trend-${ANCHOR.id}`));
    expect(nav.navigate).toHaveBeenCalledWith("ThesisResults", {
      thesis: ANCHOR.thesis,
      horizon: "long",
      trendName: ANCHOR.name,
    });
  });

  it("discover appends new directions from the loop", async () => {
    mockedUseTrends.mockReturnValue({ data: [ANCHOR], loading: false, error: null, reload: jest.fn() });
    mockedDiscover.mockResolvedValue([ANCHOR, GRID]);
    const { getByTestId, queryByTestId } = renderScreen(makeNav());
    expect(queryByTestId(`trend-${GRID.id}`)).toBeNull();
    fireEvent.press(getByTestId("discover-trends"));
    await waitFor(() => expect(getByTestId(`trend-${GRID.id}`)).toBeTruthy());
  });

  it("shows the discovery error without losing the list", async () => {
    mockedUseTrends.mockReturnValue({ data: [ANCHOR], loading: false, error: null, reload: jest.fn() });
    mockedDiscover.mockRejectedValue(new Error("boom"));
    const { getByTestId, getByText } = renderScreen(makeNav());
    fireEvent.press(getByTestId("discover-trends"));
    await waitFor(() => expect(getByText("趋势发现失败")).toBeTruthy());
    expect(getByTestId(`trend-${ANCHOR.id}`)).toBeTruthy();
  });
});
