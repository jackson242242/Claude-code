/**
 * V3.3 — MatchHud: ready indicator, deadline countdown, ready button.
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MatchHud } from '@/components/MatchHud';
import type { MatchPlayerLite } from '@/types';

const makePlayers = (overrides: Partial<MatchPlayerLite>[] = []): MatchPlayerLite[] => [
  { playerId: 'p1', name: '房主', hqCityId: 'nyc', ready: false, marketShare: 0, bankrupt: false },
  { playerId: 'p2', name: '访客', hqCityId: 'lhr', ready: false, marketShare: 0, bankrupt: false },
  ...overrides.map((o, i) => ({
    playerId: `px-${i}`,
    name: `Player ${i}`,
    hqCityId: 'sin',
    ready: false,
    marketShare: 0,
    bankrupt: false,
    ...o,
  })),
];

describe('MatchHud — basic rendering', () => {
  it('shows room code', () => {
    render(
      <MatchHud
        code="ABC123"
        turn={5}
        players={makePlayers()}
        myPlayerId="p1"
        turnDeadlineMs={null}
        isReady={false}
        onReady={jest.fn()}
        busy={false}
      />,
    );
    expect(screen.getByTestId('match-hud-code')).toHaveTextContent('ABC123');
  });

  it('shows turn counter', () => {
    render(
      <MatchHud
        code="ABC123"
        turn={7}
        players={makePlayers()}
        myPlayerId="p1"
        turnDeadlineMs={null}
        isReady={false}
        onReady={jest.fn()}
        busy={false}
      />,
    );
    expect(screen.getByTestId('match-hud-turn')).toHaveTextContent('7');
  });
});

describe('MatchHud — ready indicator', () => {
  it('shows 0/2 already ready', () => {
    render(
      <MatchHud
        code="ABC123"
        turn={1}
        players={makePlayers()}
        myPlayerId="p1"
        turnDeadlineMs={null}
        isReady={false}
        onReady={jest.fn()}
        busy={false}
      />,
    );
    const indicator = screen.getByTestId('match-hud-ready-indicator');
    expect(indicator).toHaveTextContent('0/2');
  });

  it('shows 2/2 when all players are ready', () => {
    const players = makePlayers();
    players[0].ready = true;
    players[1].ready = true;
    render(
      <MatchHud
        code="ABC123"
        turn={1}
        players={players}
        myPlayerId="p1"
        turnDeadlineMs={null}
        isReady={true}
        onReady={jest.fn()}
        busy={false}
      />,
    );
    expect(screen.getByTestId('match-hud-ready-indicator')).toHaveTextContent('2/2');
  });

  it('shows correct count when 1 of 2 ready', () => {
    const players = makePlayers();
    players[0].ready = true;
    render(
      <MatchHud
        code="ABC123"
        turn={1}
        players={players}
        myPlayerId="p1"
        turnDeadlineMs={null}
        isReady={true}
        onReady={jest.fn()}
        busy={false}
      />,
    );
    expect(screen.getByTestId('match-hud-ready-indicator')).toHaveTextContent('1/2');
  });

  it('renders player avatars', () => {
    render(
      <MatchHud
        code="ABC123"
        turn={1}
        players={makePlayers()}
        myPlayerId="p1"
        turnDeadlineMs={null}
        isReady={false}
        onReady={jest.fn()}
        busy={false}
      />,
    );
    const avatars = screen.getByTestId('match-hud-avatars');
    // 2 players → 2 avatar spans
    expect(avatars.children).toHaveLength(2);
  });
});

describe('MatchHud — ready button', () => {
  it('shows 准备结算 button when not ready', () => {
    render(
      <MatchHud
        code="ABC123"
        turn={1}
        players={makePlayers()}
        myPlayerId="p1"
        turnDeadlineMs={null}
        isReady={false}
        onReady={jest.fn()}
        busy={false}
      />,
    );
    expect(screen.getByTestId('match-hud-ready-btn')).not.toBeDisabled();
    expect(screen.getByTestId('match-hud-ready-btn')).toHaveTextContent('准备结算');
  });

  it('calls onReady when button clicked', async () => {
    const onReady = jest.fn();
    render(
      <MatchHud
        code="ABC123"
        turn={1}
        players={makePlayers()}
        myPlayerId="p1"
        turnDeadlineMs={null}
        isReady={false}
        onReady={onReady}
        busy={false}
      />,
    );
    await userEvent.click(screen.getByTestId('match-hud-ready-btn'));
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('is disabled when already ready', () => {
    render(
      <MatchHud
        code="ABC123"
        turn={1}
        players={makePlayers()}
        myPlayerId="p1"
        turnDeadlineMs={null}
        isReady={true}
        onReady={jest.fn()}
        busy={false}
      />,
    );
    expect(screen.getByTestId('match-hud-ready-btn')).toBeDisabled();
    expect(screen.getByTestId('match-hud-ready-btn')).toHaveTextContent('已就绪 ✓');
  });

  it('is disabled when busy', () => {
    render(
      <MatchHud
        code="ABC123"
        turn={1}
        players={makePlayers()}
        myPlayerId="p1"
        turnDeadlineMs={null}
        isReady={false}
        onReady={jest.fn()}
        busy={true}
      />,
    );
    expect(screen.getByTestId('match-hud-ready-btn')).toBeDisabled();
  });
});

describe('MatchHud — deadline countdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows countdown when turnDeadlineMs is set', () => {
    const deadline = Date.now() + 60_000; // 60s from now
    render(
      <MatchHud
        code="ABC123"
        turn={1}
        players={makePlayers()}
        myPlayerId="p1"
        turnDeadlineMs={deadline}
        isReady={false}
        onReady={jest.fn()}
        busy={false}
      />,
    );
    expect(screen.getByTestId('match-hud-deadline')).toBeInTheDocument();
  });

  it('does not show countdown when turnDeadlineMs is null', () => {
    render(
      <MatchHud
        code="ABC123"
        turn={1}
        players={makePlayers()}
        myPlayerId="p1"
        turnDeadlineMs={null}
        isReady={false}
        onReady={jest.fn()}
        busy={false}
      />,
    );
    expect(screen.queryByTestId('match-hud-deadline')).not.toBeInTheDocument();
  });

  it('shows "已超时" when deadline has passed', () => {
    const deadline = Date.now() - 1000; // 1s in the past
    render(
      <MatchHud
        code="ABC123"
        turn={1}
        players={makePlayers()}
        myPlayerId="p1"
        turnDeadlineMs={deadline}
        isReady={false}
        onReady={jest.fn()}
        busy={false}
      />,
    );
    expect(screen.getByTestId('match-hud-deadline')).toHaveTextContent('已超时');
  });

  it('counts down over time', () => {
    const deadline = Date.now() + 30_000; // 30 seconds
    render(
      <MatchHud
        code="ABC123"
        turn={1}
        players={makePlayers()}
        myPlayerId="p1"
        turnDeadlineMs={deadline}
        isReady={false}
        onReady={jest.fn()}
        busy={false}
      />,
    );
    const deadlineEl = screen.getByTestId('match-hud-deadline');
    // Should show ~30s
    expect(deadlineEl.textContent).toMatch(/30/);
    // Advance 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(deadlineEl.textContent).toMatch(/25/);
  });
});
