/**
 * M2.3 cabin editor tests — RoutePanel 舱位配置 section.
 * Tests the cabin editor within RoutesTab by expanding a route.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoutesTab } from '@/components/tabs/RoutesTab';
import type { CitySlotInfo, GameState, Route } from '@/types';

const slot = (overrides: Partial<CitySlotInfo> = {}): CitySlotInfo => ({
  capacity: 10,
  taken: 2,
  playerHeld: 2,
  playerUsed: 1,
  ...overrides,
});

const makeRoute = (overrides: Partial<Route> = {}): Route => ({
  id: 'rt-1',
  cityA: 'nyc',
  cityB: 'lhr',
  distanceKm: 5500,
  aircraftIds: [],
  weeklyFlights: 7,
  fareMult: 1.0,
  cabinMix: { economy: 100, business: 0, first: 0 },
  serviceTier: 2,
  lastQuarter: null,
  ...overrides,
});

const makeState = (overrides: Partial<GameState> = {}): GameState => ({
  id: 'g-1',
  airlineName: '环球之翼',
  hqCityId: 'nyc',
  turn: 1,
  year: 2026,
  quarter: 3,
  cash: 420_000_000,
  fleet: [],
  routes: [makeRoute()],
  competitors: [],
  marketShare: 0,
  slotMarket: {
    nyc: slot(),
    lhr: slot(),
  },
  news: [],
  finance: { lastQuarter: null, history: [] },
  status: 'active',
  lifetime: { profit: 0, pax: 0 },
  finalResult: null,
  activeEvents: [],
  brand: 50,
  marketing: { digital: 0, sponsor: 0, service: 0 },
  pendingDecision: null,
  ...overrides,
});

const expandRoute = async () => {
  const toggle = screen.getByRole('button', { name: /纽约.*伦敦|伦敦.*纽约/ });
  await userEvent.click(toggle);
};

const renderTab = (state: GameState = makeState(), onCommands = jest.fn()) => {
  render(
    <RoutesTab state={state} busy={false} selectedCityId={null} onCommands={onCommands} />,
  );
  return onCommands;
};

describe('CabinEditor — invalid mix disables confirm + shows error', () => {
  it('shows error text and disables confirm button when mix sum ≠ 100', async () => {
    const onCommands = renderTab();
    await expandRoute();

    const section = within(screen.getByRole('group', { name: '服务等级' }).closest('section')!);

    // Set economy to 80 — sum becomes 80+0+0=80 ≠ 100.
    const econInput = screen.getByLabelText('经济 %');
    await userEvent.clear(econInput);
    await userEvent.type(econInput, '80');

    // Error message appears.
    expect(screen.getByTestId('cabin-sum-error')).toHaveTextContent('须为 100');

    // Confirm button disabled.
    expect(screen.getByTestId('cabin-confirm')).toBeDisabled();
  });
});

describe('CabinEditor — valid edit fires updateRoute', () => {
  it('fires updateRoute with cabinMix and serviceTier when confirmed', async () => {
    const onCommands = renderTab();
    await expandRoute();

    // Set valid mix: 70/20/10.
    const econInput = screen.getByLabelText('经济 %');
    const bizInput = screen.getByLabelText('商务 %');
    const firstInput = screen.getByLabelText('头等 %');

    await userEvent.clear(econInput);
    await userEvent.type(econInput, '70');
    await userEvent.clear(bizInput);
    await userEvent.type(bizInput, '20');
    await userEvent.clear(firstInput);
    await userEvent.type(firstInput, '10');

    // Switch to tier 3.
    await userEvent.click(screen.getByRole('button', { name: '豪华' }));

    // Confirm.
    await userEvent.click(screen.getByTestId('cabin-confirm'));

    expect(onCommands).toHaveBeenCalledWith([
      {
        type: 'updateRoute',
        routeId: 'rt-1',
        cabinMix: { economy: 70, business: 20, first: 10 },
        serviceTier: 3,
      },
    ]);
  });

  it('confirms with default tier 2 when tier unchanged', async () => {
    const onCommands = renderTab();
    await expandRoute();

    // Change only business from 0→10, economy from 100→90.
    const econInput = screen.getByLabelText('经济 %');
    const bizInput = screen.getByLabelText('商务 %');

    await userEvent.clear(econInput);
    await userEvent.type(econInput, '90');
    await userEvent.clear(bizInput);
    await userEvent.type(bizInput, '10');

    await userEvent.click(screen.getByTestId('cabin-confirm'));

    expect(onCommands).toHaveBeenCalledWith([
      {
        type: 'updateRoute',
        routeId: 'rt-1',
        cabinMix: { economy: 90, business: 10, first: 0 },
        serviceTier: 2,
      },
    ]);
  });
});

describe('CabinEditor — seat preview', () => {
  it('shows seat count preview when aircraft is assigned', async () => {
    const state = makeState({
      fleet: [{ id: 'ac-1', modelId: 'a320neo', ownership: 'owned', routeId: 'rt-1' }],
      routes: [makeRoute({ aircraftIds: ['ac-1'] })],
    });

    renderTab(state);
    await expandRoute();

    // a320neo has 165 seats; default 100/0/0 → 165 economy, 0 biz, 0 first
    expect(screen.getByLabelText('经济 %').closest('div')).toHaveTextContent('165 座');
  });
});
