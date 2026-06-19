import { fireEvent, render } from "@testing-library/react-native";

import type { HotStock } from "../../api/types";
import { useHotStocks } from "../../hooks/useHotStocks";
import { HotStocksScreen } from "../HotStocksScreen";

jest.mock("../../hooks/useHotStocks");

const mockedUseHotStocks = useHotStocks as jest.MockedFunction<typeof useHotStocks>;

const makeNav = () => ({ navigate: jest.fn() });
// Props are loosely typed for the test harness.
const renderScreen = (nav: ReturnType<typeof makeNav>) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render(<HotStocksScreen navigation={nav as any} route={{ key: "k", name: "HotStocks" } as any} />);

const SAMPLE: HotStock[] = [
  { ticker: "NVDA", name: "NVIDIA", price: 178.34, oneYearChangePct: 0.74, sector: "Semis" },
];

describe("HotStocksScreen", () => {
  afterEach(() => jest.clearAllMocks());

  it("shows the loading state", () => {
    mockedUseHotStocks.mockReturnValue({ data: null, loading: true, error: null, reload: jest.fn() });
    const { getByTestId } = renderScreen(makeNav());
    expect(getByTestId("async-loading")).toBeTruthy();
  });

  it("renders rows on success and navigates on tap", () => {
    mockedUseHotStocks.mockReturnValue({ data: SAMPLE, loading: false, error: null, reload: jest.fn() });
    const nav = makeNav();
    const { getByTestId } = renderScreen(nav);
    fireEvent.press(getByTestId("row-NVDA"));
    expect(nav.navigate).toHaveBeenCalledWith("TierList", {
      hotStockTicker: "NVDA",
      hotStockName: "NVIDIA",
    });
  });

  it("shows the empty state when there are no hot stocks", () => {
    mockedUseHotStocks.mockReturnValue({ data: [], loading: false, error: null, reload: jest.fn() });
    const { getByTestId } = renderScreen(makeNav());
    expect(getByTestId("async-empty")).toBeTruthy();
  });

  it("shows error and retries", () => {
    const reload = jest.fn();
    mockedUseHotStocks.mockReturnValue({ data: null, loading: false, error: "boom", reload });
    const { getByTestId } = renderScreen(makeNav());
    expect(getByTestId("async-error")).toBeTruthy();
    fireEvent.press(getByTestId("async-retry"));
    expect(reload).toHaveBeenCalled();
  });
});
