import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { runBrief } from "../../api/endpoints";
import type { DailyBrief } from "../../api/types";
import { useLatestBrief } from "../../hooks/useLatestBrief";
import { BriefScreen } from "../BriefScreen";

jest.mock("../../hooks/useLatestBrief");
jest.mock("../../api/endpoints");

const mockedUseLatestBrief = useLatestBrief as jest.MockedFunction<typeof useLatestBrief>;
const mockedRunBrief = runBrief as jest.MockedFunction<typeof runBrief>;

const makeNav = () => ({ navigate: jest.fn() });
const renderScreen = (nav: ReturnType<typeof makeNav>) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render(<BriefScreen navigation={nav as any} route={{ key: "k", name: "Brief" } as any} />);

const BRIEF: DailyBrief = {
  id: "2026-07-07",
  title: "7月7日:关税与算力",
  date: "2026-07-07",
  script: "今天是七月七号……",
  highlights: [
    { topic: "股市", headline: "半导体领涨", detail: "财报预期抬升。" },
    { topic: "播客观点", headline: "大佬看多电力", detail: "在 BG2 提到电力瓶颈。" },
  ],
  swingTheses: [
    { name: "电力设备补库存", thesis: "电网订单加速", horizon: "short", whyNow: "指引上调" },
  ],
  audioUrl: "/api/briefs/audio/brief-2026-07-07.mp3",
  generatedAt: "2026-07-07T12:00:00Z",
  disclaimer: "not advice",
};

describe("BriefScreen", () => {
  afterEach(() => jest.clearAllMocks());

  it("renders highlights, podcast quotes, and the audio block", () => {
    mockedUseLatestBrief.mockReturnValue({ data: BRIEF, loading: false, error: null, reload: jest.fn() });
    const { getByText } = renderScreen(makeNav());
    expect(getByText("7月7日:关税与算力")).toBeTruthy();
    expect(getByText("半导体领涨")).toBeTruthy();
    expect(getByText("播客观点")).toBeTruthy(); // 大佬观点 section present
    expect(getByText(/BG2/)).toBeTruthy();
  });

  it("opens a swing thesis in the tier pipeline", () => {
    mockedUseLatestBrief.mockReturnValue({ data: BRIEF, loading: false, error: null, reload: jest.fn() });
    const nav = makeNav();
    const { getByTestId } = renderScreen(nav);
    fireEvent.press(getByTestId("swing-电力设备补库存"));
    expect(nav.navigate).toHaveBeenCalledWith("ThesisResults", {
      thesis: "电网订单加速",
      horizon: "short",
      trendName: "电力设备补库存",
    });
  });

  it("shows empty state and generates the first brief on demand", async () => {
    mockedUseLatestBrief.mockReturnValue({ data: null, loading: false, error: null, reload: jest.fn() });
    mockedRunBrief.mockResolvedValue(BRIEF);
    const { getByTestId, getByText } = renderScreen(makeNav());
    expect(getByTestId("no-brief")).toBeTruthy();
    fireEvent.press(getByTestId("run-brief"));
    await waitFor(() => expect(mockedRunBrief).toHaveBeenCalled());
    await waitFor(() => expect(getByText("7月7日:关税与算力")).toBeTruthy());
  });

  it("toggles the script text", () => {
    mockedUseLatestBrief.mockReturnValue({ data: BRIEF, loading: false, error: null, reload: jest.fn() });
    const { getByTestId, getByText, queryByText } = renderScreen(makeNav());
    expect(queryByText(/今天是七月七号/)).toBeNull();
    fireEvent.press(getByTestId("toggle-script"));
    expect(getByText(/今天是七月七号/)).toBeTruthy();
  });
});
