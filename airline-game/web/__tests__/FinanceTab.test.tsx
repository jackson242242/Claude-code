import { render, screen, within } from '@testing-library/react';
import { FinanceTab } from '@/components/tabs/FinanceTab';
import type { Competitor, GameState } from '@/types';

const makeCompetitor = (overrides: Partial<Competitor>): Competitor => ({
  id: 'ai-aurora',
  name: 'Aurora Pacific',
  nameZh: '极光太平洋航空',
  hqCityId: 'hnd',
  fareMult: 0.9,
  routes: [],
  marketShare: 0,
  ...overrides,
});

const makeState = (overrides: Partial<GameState>): GameState => ({
  id: 'g-1',
  airlineName: '环球之翼',
  hqCityId: 'nyc',
  turn: 2,
  year: 2026,
  quarter: 4,
  cash: 400_000_000,
  fleet: [],
  routes: [],
  competitors: [],
  marketShare: 0,
  slotMarket: {},
  news: [],
  finance: { lastQuarter: null, history: [] },
  status: 'active',
  lifetime: { profit: 0, pax: 0 },
  finalResult: null,
  activeEvents: [],
  ...overrides,
});

describe('FinanceTab 市场份额 section', () => {
  it('renders player + AI names with one-decimal percentages and the background remainder', () => {
    const state = makeState({
      marketShare: 0.45,
      competitors: [
        makeCompetitor({ id: 'ai-aurora', nameZh: '极光太平洋航空', marketShare: 0.123 }),
        makeCompetitor({ id: 'ai-meridian', nameZh: '皇家子午线航空', marketShare: 0.1 }),
        makeCompetitor({ id: 'ai-falcon', nameZh: '沙丘猎鹰航空', marketShare: 0.077 }),
      ],
    });

    render(<FinanceTab state={state} />);
    const section = within(screen.getByTestId('market-share'));

    expect(section.getByText('环球之翼')).toBeInTheDocument();
    expect(section.getByText('45.0%')).toBeInTheDocument();
    expect(section.getByText('极光太平洋航空')).toBeInTheDocument();
    expect(section.getByText('12.3%')).toBeInTheDocument();
    expect(section.getByText('皇家子午线航空')).toBeInTheDocument();
    expect(section.getByText('10.0%')).toBeInTheDocument();
    expect(section.getByText('沙丘猎鹰航空')).toBeInTheDocument();
    expect(section.getByText('7.7%')).toBeInTheDocument();
    // remainder to 100%: 1 − (0.45+0.123+0.1+0.077) = 0.25
    expect(section.getByText('背景市场/其他航司')).toBeInTheDocument();
    expect(section.getByText('25.0%')).toBeInTheDocument();
  });

  it('shows the pre-settlement hint when all shares are zero', () => {
    const state = makeState({
      competitors: [makeCompetitor({}), makeCompetitor({ id: 'ai-falcon' })],
    });

    render(<FinanceTab state={state} />);
    const section = within(screen.getByTestId('market-share'));

    expect(section.getByText('结算一个季度后显示。')).toBeInTheDocument();
    expect(section.queryByText('背景市场/其他航司')).not.toBeInTheDocument();
  });
});
