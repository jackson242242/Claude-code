/**
 * V3.3 — LobbyScreen: room code display, player list, host start gating.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LobbyScreen } from '@/components/LobbyScreen';
import type { GameState, MatchView } from '@/types';

const gameStateFixture: GameState = {
  id: 'g-1',
  airlineName: '测试航空',
  hqCityId: 'nyc',
  turn: 1,
  year: 2026,
  quarter: 3,
  cash: 420_000_000,
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
  brand: 50,
  marketing: { digital: 0, sponsor: 0, service: 0 },
  pendingDecision: null,
};

const makeView = (overrides: Partial<MatchView> = {}): MatchView => ({
  code: 'XYZ789',
  phase: 'lobby',
  turn: 1,
  year: 2026,
  quarter: 3,
  maxPlayers: 4,
  players: [
    { playerId: 'host-1', name: '房主航空', hqCityId: 'nyc', ready: false, marketShare: 0, bankrupt: false },
    { playerId: 'guest-2', name: '访客航空', hqCityId: 'lhr', ready: false, marketShare: 0, bankrupt: false },
  ],
  you: gameStateFixture,
  turnDeadlineMs: null,
  lastReport: null,
  finalStandings: null,
  ...overrides,
});

describe('LobbyScreen — room code', () => {
  it('displays the room code prominently', () => {
    render(
      <LobbyScreen
        view={makeView()}
        myPlayerId="host-1"
        onStart={jest.fn()}
        onLeave={jest.fn()}
        busy={false}
        error={null}
      />,
    );
    expect(screen.getByTestId('lobby-room-code')).toHaveTextContent('XYZ789');
  });

  it('has a copy button', () => {
    render(
      <LobbyScreen
        view={makeView()}
        myPlayerId="host-1"
        onStart={jest.fn()}
        onLeave={jest.fn()}
        busy={false}
        error={null}
      />,
    );
    expect(screen.getByTestId('lobby-copy-btn')).toBeInTheDocument();
  });
});

describe('LobbyScreen — player list', () => {
  it('renders all players', () => {
    render(
      <LobbyScreen
        view={makeView()}
        myPlayerId="host-1"
        onStart={jest.fn()}
        onLeave={jest.fn()}
        busy={false}
        error={null}
      />,
    );
    const list = screen.getByTestId('lobby-player-list');
    expect(within(list).getByText('房主航空')).toBeInTheDocument();
    expect(within(list).getByText('访客航空')).toBeInTheDocument();
  });

  it('marks the current player with 你 tag', () => {
    render(
      <LobbyScreen
        view={makeView()}
        myPlayerId="guest-2"
        onStart={jest.fn()}
        onLeave={jest.fn()}
        busy={false}
        error={null}
      />,
    );
    // Guest sees (你) next to their own name
    const guestRow = screen.getByTestId('lobby-player-guest-2');
    expect(guestRow).toHaveTextContent('（你）');
  });

  it('shows host badge on first player', () => {
    render(
      <LobbyScreen
        view={makeView()}
        myPlayerId="host-1"
        onStart={jest.fn()}
        onLeave={jest.fn()}
        busy={false}
        error={null}
      />,
    );
    const hostRow = screen.getByTestId('lobby-player-host-1');
    expect(hostRow).toHaveTextContent('房主');
  });
});

describe('LobbyScreen — host start button gating', () => {
  it('shows start button for the host', () => {
    render(
      <LobbyScreen
        view={makeView()}
        myPlayerId="host-1"
        onStart={jest.fn()}
        onLeave={jest.fn()}
        busy={false}
        error={null}
      />,
    );
    expect(screen.getByTestId('lobby-start-btn')).toBeInTheDocument();
  });

  it('start button is enabled when ≥2 players and user is host', () => {
    render(
      <LobbyScreen
        view={makeView()}
        myPlayerId="host-1"
        onStart={jest.fn()}
        onLeave={jest.fn()}
        busy={false}
        error={null}
      />,
    );
    expect(screen.getByTestId('lobby-start-btn')).not.toBeDisabled();
  });

  it('start button is disabled when only 1 player', () => {
    const view = makeView({
      players: [
        { playerId: 'host-1', name: '房主航空', hqCityId: 'nyc', ready: false, marketShare: 0, bankrupt: false },
      ],
    });
    render(
      <LobbyScreen
        view={view}
        myPlayerId="host-1"
        onStart={jest.fn()}
        onLeave={jest.fn()}
        busy={false}
        error={null}
      />,
    );
    expect(screen.getByTestId('lobby-start-btn')).toBeDisabled();
  });

  it('does NOT show start button for non-host', () => {
    render(
      <LobbyScreen
        view={makeView()}
        myPlayerId="guest-2"
        onStart={jest.fn()}
        onLeave={jest.fn()}
        busy={false}
        error={null}
      />,
    );
    expect(screen.queryByTestId('lobby-start-btn')).not.toBeInTheDocument();
  });

  it('calls onStart when start button clicked', async () => {
    const onStart = jest.fn();
    render(
      <LobbyScreen
        view={makeView()}
        myPlayerId="host-1"
        onStart={onStart}
        onLeave={jest.fn()}
        busy={false}
        error={null}
      />,
    );
    await userEvent.click(screen.getByTestId('lobby-start-btn'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('calls onLeave when leave button clicked', async () => {
    const onLeave = jest.fn();
    render(
      <LobbyScreen
        view={makeView()}
        myPlayerId="host-1"
        onStart={jest.fn()}
        onLeave={onLeave}
        busy={false}
        error={null}
      />,
    );
    await userEvent.click(screen.getByTestId('lobby-leave-btn'));
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('shows error message when error prop is set', () => {
    render(
      <LobbyScreen
        view={makeView()}
        myPlayerId="host-1"
        onStart={jest.fn()}
        onLeave={jest.fn()}
        busy={false}
        error="启动失败"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('启动失败');
  });
});
