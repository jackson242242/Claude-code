import { fireEvent, render } from "@testing-library/react-native";

import type { TierEntry } from "../../api/types";
import { TierGroup } from "../TierGroup";

const entry: TierEntry = {
  ticker: "AMD",
  name: "Advanced Micro Devices",
  price: 168.2,
  oneYearChangePct: 0.58,
  tier: "S",
  relationship: "alternative",
  rationale: "Direct GPU competitor riding the same AI-compute demand.",
  tierJustification: "Strongest alternative.",
};

describe("TierGroup", () => {
  it("renders the tier badge and entry", () => {
    const { getByTestId, getByText } = render(
      <TierGroup tier="S" entries={[entry]} onPressEntry={jest.fn()} />,
    );
    expect(getByTestId("tier-S")).toBeTruthy();
    expect(getByTestId("entry-AMD")).toBeTruthy();
    expect(getByText("1 stock")).toBeTruthy();
  });

  it("shows a dash when empty", () => {
    const { getByText } = render(<TierGroup tier="F" entries={[]} onPressEntry={jest.fn()} />);
    expect(getByText("—")).toBeTruthy();
  });

  it("calls onPressEntry when an entry is tapped", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <TierGroup tier="S" entries={[entry]} onPressEntry={onPress} />,
    );
    fireEvent.press(getByTestId("entry-AMD"));
    expect(onPress).toHaveBeenCalledWith(entry);
  });
});
