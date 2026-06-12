import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoutesTab } from '@/components/tabs/RoutesTab';
import type { CitySlotInfo, GameState } from '@/types';

const slot = (overrides: Partial<CitySlotInfo>): CitySlotInfo => ({
  capacity: 10,
  taken: 0,
  playerHeld: 0,
  playerUsed: 0,
  ...overrides,
});

const makeState = (overrides: Partial<GameState>): GameState => ({
  id: 'g-1',
  airlineName: '环球之翼',
  hqCityId: 'nyc',
  turn: 1,
  year: 2026,
  quarter: 3,
  cash: 420_000_000,
  fleet: [],
  routes: [],
  competitors: [],
  marketShare: 0,
  slotMarket: {
    nyc: slot({ capacity: 12, taken: 4, playerHeld: 2 }),
    lhr: slot({ capacity: 10, taken: 5 }),
  },
  news: [],
  finance: { lastQuarter: null, history: [] },
  status: 'active',
  lifetime: { profit: 0, pax: 0 },
  finalResult: null,
  ...overrides,
});

const renderTab = (state: GameState, onCommands = jest.fn()) => {
  render(
    <RoutesTab state={state} busy={false} selectedCityId={null} onCommands={onCommands} />,
  );
  return onCommands;
};

const pickDestination = (cityId: string) =>
  userEvent.selectOptions(screen.getByLabelText('选择目的地城市'), cityId);

describe('RoutesTab slot 谈判 (M2.2)', () => {
  it('shows the negotiate button with the computed cost when the end lacks a free held slot, and sends negotiateSlot', async () => {
    // lhr: slotFee 11,000 × 800 × (1 + 5/10) = $13.2M
    const onCommands = renderTab(makeState({}));
    await pickDestination('lhr');

    const row = within(screen.getByTestId('slot-end-lhr'));
    expect(row.getByTestId('slot-badge-lhr')).toHaveTextContent('持有 0');
    expect(row.getByTestId('slot-badge-lhr')).toHaveTextContent('池 5/10');

    const negotiate = row.getByRole('button', { name: '谈判获取 slot · $13.2M' });
    expect(negotiate).toBeEnabled();
    await userEvent.click(negotiate);

    expect(onCommands).toHaveBeenCalledWith([{ type: 'negotiateSlot', cityId: 'lhr' }]);
  });

  it('disables negotiation and shows 池已满 when the city pool is full', async () => {
    const state = makeState({});
    state.slotMarket.lhr = slot({ capacity: 10, taken: 10 });
    renderTab(state);
    await pickDestination('lhr');

    const row = within(screen.getByTestId('slot-end-lhr'));
    const button = row.getByRole('button', { name: '池已满' });
    expect(button).toBeDisabled();
    expect(row.queryByRole('button', { name: /谈判获取 slot/ })).not.toBeInTheDocument();
  });

  it('disables negotiation when cash cannot cover the slot cost', async () => {
    renderTab(makeState({ cash: 1_000_000 }));
    await pickDestination('lhr');

    const row = within(screen.getByTestId('slot-end-lhr'));
    expect(row.getByRole('button', { name: '谈判获取 slot · $13.2M' })).toBeDisabled();
  });

  it('keeps 开通 disabled until both ends have a free held slot', async () => {
    renderTab(makeState({})); // lhr holds no slot yet
    await pickDestination('lhr');

    expect(screen.getByRole('button', { name: '开通' })).toBeDisabled();
    expect(
      screen.getByText('两端都需要 1 个空闲持有 slot 才能开航 — 先通过谈判获取。'),
    ).toBeInTheDocument();
  });

  it('enables 开通 once both ends hold a free slot, and hides the negotiate button', async () => {
    const state = makeState({});
    state.slotMarket.lhr = slot({ capacity: 10, taken: 6, playerHeld: 1 });
    const onCommands = renderTab(state);
    await pickDestination('lhr');

    expect(screen.queryByRole('button', { name: /谈判获取 slot|池已满/ })).not.toBeInTheDocument();
    const open = screen.getByRole('button', { name: '开通' });
    expect(open).toBeEnabled();
    await userEvent.click(open);

    expect(onCommands).toHaveBeenCalledWith([{ type: 'openRoute', cityA: 'nyc', cityB: 'lhr' }]);
  });

  it('keeps 开通 disabled when the HQ end has no free held slot (all held slots used)', async () => {
    const state = makeState({});
    state.slotMarket.nyc = slot({ capacity: 12, taken: 4, playerHeld: 2, playerUsed: 2 });
    state.slotMarket.lhr = slot({ capacity: 10, taken: 6, playerHeld: 1 });
    renderTab(state);
    await pickDestination('lhr');

    expect(screen.getByRole('button', { name: '开通' })).toBeDisabled();
    // HQ end offers its own inline negotiation.
    const hqRow = within(screen.getByTestId('slot-end-nyc'));
    expect(hqRow.getByRole('button', { name: /谈判获取 slot/ })).toBeInTheDocument();
  });
});
