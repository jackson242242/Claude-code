/**
 * V3.3 — GameScreen in match mode: settle button fires onReady,
 * not onEndTurn; button shows "准备结算" / "已就绪 ✓" labels.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameScreen } from '@/components/GameScreen';
import type { GameState } from '@/types';

// Mock all heavy dependencies
jest.mock('@/lib/data', () => ({
  CITIES: [],
  CITY_BY_ID: new Map(),
  CITY_IMAGES: {},
  cityLabel: (id: string) => id,
  cityZh: (id: string) => id,
  modelName: (id: string) => id,
  AIRCRAFT_MODELS: [],
  MODEL_BY_ID: new Map(),
  AIRCRAFT_IMAGES: {},
}));

jest.mock('@/lib/voice', () => ({
  voice: { speakTurnReport: jest.fn(), speakMajorEvent: jest.fn(), speakBadge: jest.fn(), isEnabled: () => false, toggle: jest.fn() },
}));

jest.mock('@/lib/audio', () => ({
  audio: { start: jest.fn(), toggle: jest.fn(), isPlaying: () => false },
}));

jest.mock('@/lib/badges', () => ({
  BADGES: [],
  TIER_COLORS: { bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700' },
}));

jest.mock('@/lib/profile', () => ({
  loadProfile: () => ({ xp: 0, badges: {}, completedGames: [] }),
  saveProfile: jest.fn(),
  recordBadge: (p: unknown) => p,
  recordPositiveBrandDecision: jest.fn(),
  hasPositiveBrandDecision: () => false,
}));

jest.mock('@/lib/tutorial', () => ({
  getTutorialState: () => ({ dismissed: true, step: 0 }),
  advanceTutorial: (s: unknown) => s,
}));

jest.mock('@/components/WorldMap', () => ({
  WorldMap: () => <div data-testid="world-map" />,
}));

jest.mock('@/components/TutorialPanel', () => ({
  TutorialPanel: () => null,
}));

jest.mock('@/components/EventTicker', () => ({
  EventTicker: () => null,
}));

const makeState = (): GameState => ({
  id: 'g-1',
  airlineName: '多人测试',
  hqCityId: 'nyc',
  turn: 5,
  year: 2027,
  quarter: 1,
  cash: 300_000_000,
  fleet: [],
  routes: [],
  competitors: [],
  marketShare: 0.1,
  slotMarket: {},
  news: [],
  finance: { lastQuarter: null, history: [] },
  status: 'active',
  lifetime: { profit: 0, pax: 0 },
  finalResult: null,
  activeEvents: [],
  brand: 55,
  marketing: { digital: 0, sponsor: 0, service: 0 },
  pendingDecision: null,
});

describe('GameScreen — match mode', () => {
  it('shows 准备结算 button instead of 下一季度 when matchMode provided', () => {
    render(
      <GameScreen
        state={makeState()}
        busy={false}
        error={null}
        onDismissError={jest.fn()}
        onCommands={jest.fn()}
        onEndTurn={jest.fn()}
        matchMode={{ isReady: false, onReady: jest.fn() }}
      />,
    );
    expect(screen.getByTestId('match-settle-btn')).toHaveTextContent('准备结算');
    expect(screen.queryByText('下一季度 ▸')).not.toBeInTheDocument();
  });

  it('calls matchMode.onReady when settle button clicked (not onEndTurn)', async () => {
    const onEndTurn = jest.fn();
    const onReady = jest.fn();
    render(
      <GameScreen
        state={makeState()}
        busy={false}
        error={null}
        onDismissError={jest.fn()}
        onCommands={jest.fn()}
        onEndTurn={onEndTurn}
        matchMode={{ isReady: false, onReady }}
      />,
    );
    await userEvent.click(screen.getByTestId('match-settle-btn'));
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onEndTurn).not.toHaveBeenCalled();
  });

  it('shows 已就绪 ✓ when isReady=true', () => {
    render(
      <GameScreen
        state={makeState()}
        busy={false}
        error={null}
        onDismissError={jest.fn()}
        onCommands={jest.fn()}
        onEndTurn={jest.fn()}
        matchMode={{ isReady: true, onReady: jest.fn() }}
      />,
    );
    expect(screen.getByTestId('match-settle-btn')).toHaveTextContent('已就绪 ✓');
    expect(screen.getByTestId('match-settle-btn')).toBeDisabled();
  });

  it('shows 下一季度 button when no matchMode (single player)', () => {
    render(
      <GameScreen
        state={makeState()}
        busy={false}
        error={null}
        onDismissError={jest.fn()}
        onCommands={jest.fn()}
        onEndTurn={jest.fn()}
      />,
    );
    expect(screen.getByText('下一季度 ▸')).toBeInTheDocument();
    expect(screen.queryByTestId('match-settle-btn')).not.toBeInTheDocument();
  });
});
