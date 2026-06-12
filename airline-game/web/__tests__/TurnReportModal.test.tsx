/**
 * M2.3 — TurnReportModal per-class stats rendering.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TurnReportModal } from '@/components/TurnReportModal';
import type { ClassStats, GameState, RouteQuarterStats, TurnReport } from '@/types';

const classStats = (overrides: Partial<ClassStats> = {}): ClassStats => ({
  pax: 0,
  capacity: 0,
  revenue: 0,
  ...overrides,
});

const routeStats = (
  routeId: string,
  overrides: Partial<RouteQuarterStats> = {},
): RouteQuarterStats & { routeId: string } => ({
  routeId,
  pax: 10000,
  capacity: 12000,
  loadFactor: 0.833,
  revenue: 5_000_000,
  cost: 3_000_000,
  profit: 2_000_000,
  classes: {
    economy: classStats({ pax: 8800, capacity: 10500, revenue: 3_000_000 }),
    business: classStats({ pax: 900, capacity: 1200, revenue: 1_500_000 }),
    first: classStats({ pax: 300, capacity: 300, revenue: 500_000 }),
  },
  ...overrides,
});

const makeReport = (overrides: Partial<TurnReport> = {}): TurnReport => ({
  turn: 1,
  year: 2026,
  quarter: 3,
  routeStats: [],
  totals: { revenue: 5_000_000, cost: 3_000_000, profit: 2_000_000 },
  news: [],
  ...overrides,
});

const makeState = (overrides: Partial<GameState> = {}): GameState => ({
  id: 'g-1',
  airlineName: '环球之翼',
  hqCityId: 'nyc',
  turn: 2,
  year: 2026,
  quarter: 4,
  cash: 420_000_000,
  fleet: [],
  routes: [
    {
      id: 'rt-1',
      cityA: 'nyc',
      cityB: 'lhr',
      distanceKm: 5500,
      aircraftIds: [],
      weeklyFlights: 7,
      fareMult: 1.0,
      cabinMix: { economy: 70, business: 20, first: 10 },
      serviceTier: 2,
      lastQuarter: null,
    },
  ],
  competitors: [],
  marketShare: 0,
  slotMarket: {},
  news: [],
  finance: { lastQuarter: null, history: [] },
  status: 'active',
  lifetime: { profit: 0, pax: 0 },
  finalResult: null,
  ...overrides,
});

describe('TurnReportModal per-class stats (M2.3)', () => {
  it('shows per-class breakdown table when premium cabins exist', () => {
    const report = makeReport({ routeStats: [routeStats('rt-1')] });
    const state = makeState();

    render(<TurnReportModal report={report} state={state} onClose={jest.fn()} />);

    // The per-class table is shown.
    const breakdown = screen.getByTestId('class-breakdown');
    const table = within(breakdown);

    // Header labels.
    expect(table.getByText('舱位')).toBeInTheDocument();
    expect(table.getByText('客流')).toBeInTheDocument();
    expect(table.getByText('容量')).toBeInTheDocument();
    expect(table.getByText('收入')).toBeInTheDocument();

    // Class rows.
    expect(table.getByText('经济')).toBeInTheDocument();
    expect(table.getByText('商务')).toBeInTheDocument();
    expect(table.getByText('头等')).toBeInTheDocument();

    // Business pax shows up.
    expect(table.getByText('900')).toBeInTheDocument();
    // First pax and capacity are both 300 — use getAllByText.
    expect(table.getAllByText('300')).toHaveLength(2);
  });

  it('hides per-class breakdown when all premium class capacities are zero (default economy only)', () => {
    const stats = routeStats('rt-1', {
      classes: {
        economy: classStats({ pax: 10000, capacity: 12000, revenue: 5_000_000 }),
        business: classStats({ pax: 0, capacity: 0, revenue: 0 }),
        first: classStats({ pax: 0, capacity: 0, revenue: 0 }),
      },
    });
    const report = makeReport({ routeStats: [stats] });
    const state = makeState();

    render(<TurnReportModal report={report} state={state} onClose={jest.fn()} />);

    expect(screen.queryByTestId('class-breakdown')).not.toBeInTheDocument();
  });

  it('keeps total row (load factor + profit) intact regardless of classes', () => {
    const report = makeReport({ routeStats: [routeStats('rt-1')] });
    const state = makeState();

    render(<TurnReportModal report={report} state={state} onClose={jest.fn()} />);

    // Total row shows load factor (formatPercent rounds to integer).
    expect(screen.getByText('83%')).toBeInTheDocument();
    // Total profit shows (formatMoney strips trailing .0).
    // Two elements show $2M: the totals header card and the route row profit.
    expect(screen.getAllByText('$2M')).toHaveLength(2);
  });

  it('calls onClose when the continue button is clicked', async () => {
    const onClose = jest.fn();
    render(<TurnReportModal report={makeReport()} state={makeState()} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: /继续经营/ }));

    expect(onClose).toHaveBeenCalled();
  });
});
