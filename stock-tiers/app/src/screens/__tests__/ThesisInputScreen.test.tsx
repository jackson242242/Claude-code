import { fireEvent, render } from "@testing-library/react-native";

import { ThesisInputScreen } from "../ThesisInputScreen";

const makeNav = () => ({ navigate: jest.fn() });
const renderScreen = (nav: ReturnType<typeof makeNav>) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render(<ThesisInputScreen navigation={nav as any} route={{ key: "k", name: "ThesisInput" } as any} />);

describe("ThesisInputScreen", () => {
  it("tapping a paradigm fills the input template", () => {
    const { getByTestId } = renderScreen(makeNav());
    fireEvent.press(getByTestId("paradigm-政策"));
    expect(getByTestId("thesis-input").props.value).toContain("政策");
  });

  it("does not navigate when the thesis is empty", () => {
    const nav = makeNav();
    const { getByTestId } = renderScreen(nav);
    fireEvent.press(getByTestId("generate"));
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it("navigates to ThesisResults with thesis + chosen horizon", () => {
    const nav = makeNav();
    const { getByTestId } = renderScreen(nav);
    fireEvent.changeText(getByTestId("thesis-input"), "AI power demand drives the grid");
    fireEvent.press(getByTestId("horizon-short"));
    fireEvent.press(getByTestId("generate"));
    expect(nav.navigate).toHaveBeenCalledWith("ThesisResults", {
      thesis: "AI power demand drives the grid",
      horizon: "short",
    });
  });

  it("offers a path to browse hot stocks", () => {
    const nav = makeNav();
    const { getByTestId } = renderScreen(nav);
    fireEvent.press(getByTestId("browse-hot"));
    expect(nav.navigate).toHaveBeenCalledWith("HotStocks");
  });
});
