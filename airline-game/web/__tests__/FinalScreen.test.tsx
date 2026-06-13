/**
 * M2.4 — FinalScreen endgame component tests.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinalScreen } from '@/components/FinalScreen';
import type { FinalResult } from '@/types';

const makeFinalResult = (overrides: Partial<FinalResult> = {}): FinalResult => ({
  rank: 1,
  victory: true,
  standings: [
    { name: '环球之翼', isPlayer: true, marketShare: 0.35 },
    { name: '极光太平洋航空', isPlayer: false, marketShare: 0.25 },
    { name: '皇家子午线航空', isPlayer: false, marketShare: 0.20 },
    { name: '沙丘猎鹰航空', isPlayer: false, marketShare: 0.12 },
    { name: '矢量天空航空', isPlayer: false, marketShare: 0.08 },
  ],
  cumulativeProfit: 1_200_000_000,
  cumulativePax: 1_230_000,
  endedTurn: 80,
  ...overrides,
});

describe('FinalScreen — victory variant', () => {
  it('shows the 称霸蓝天 headline when rank === 1', () => {
    render(
      <FinalScreen
        airlineName="环球之翼"
        gameId="test-game-id"
        finalResult={makeFinalResult()}
        onRestart={jest.fn()}
      />,
    );
    expect(screen.getByTestId('final-headline')).toHaveTextContent('称霸蓝天');
  });

  it('renders standings in order with player row highlighted (has cyan class)', () => {
    render(
      <FinalScreen
        airlineName="环球之翼"
        gameId="test-game-id"
        finalResult={makeFinalResult()}
        onRestart={jest.fn()}
      />,
    );
    const standingsEl = screen.getByTestId('standings');
    const rows = within(standingsEl).getAllByRole('listitem');

    // 5 rows (1 player + 4 AI), first is player (V3.10)
    expect(rows).toHaveLength(5);
    expect(rows[0]).toHaveTextContent('环球之翼');
    expect(rows[1]).toHaveTextContent('极光太平洋航空');
    expect(rows[2]).toHaveTextContent('皇家子午线航空');
    expect(rows[3]).toHaveTextContent('沙丘猎鹰航空');
    expect(rows[4]).toHaveTextContent('矢量天空航空');

    // Player row is highlighted cyan
    expect(rows[0]).toHaveClass('text-cyan-300');
    // Non-player rows are not cyan
    expect(rows[1]).not.toHaveClass('text-cyan-300');
  });

  it('shows marketShare percentages to 1 decimal for each standing', () => {
    render(
      <FinalScreen
        airlineName="环球之翼"
        gameId="test-game-id"
        finalResult={makeFinalResult()}
        onRestart={jest.fn()}
      />,
    );
    const standingsEl = screen.getByTestId('standings');
    expect(within(standingsEl).getByText('35.0%')).toBeInTheDocument();
    expect(within(standingsEl).getByText('25.0%')).toBeInTheDocument();
    expect(within(standingsEl).getByText('20.0%')).toBeInTheDocument();
    expect(within(standingsEl).getByText('12.0%')).toBeInTheDocument();
    expect(within(standingsEl).getByText('8.0%')).toBeInTheDocument();
  });

  it('shows cumulative profit and pax', () => {
    render(
      <FinalScreen
        airlineName="环球之翼"
        gameId="test-game-id"
        finalResult={makeFinalResult()}
        onRestart={jest.fn()}
      />,
    );
    expect(screen.getByTestId('cumulative-profit')).toHaveTextContent('$1.2B');
    expect(screen.getByTestId('cumulative-pax')).toHaveTextContent('1.2M 人次');
  });

  it('calls onRestart when 再来一局 is clicked', async () => {
    const onRestart = jest.fn();
    render(
      <FinalScreen
        airlineName="环球之翼"
        gameId="test-game-id"
        finalResult={makeFinalResult()}
        onRestart={onRestart}
      />,
    );
    await userEvent.click(screen.getByTestId('restart-button'));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});

describe('FinalScreen — defeat variant', () => {
  const defeatResult = makeFinalResult({
    rank: 3,
    victory: false,
    standings: [
      { name: '极光太平洋航空', isPlayer: false, marketShare: 0.35 },
      { name: '皇家子午线航空', isPlayer: false, marketShare: 0.28 },
      { name: '联星航空', isPlayer: true, marketShare: 0.20 },
      { name: '沙丘猎鹰航空', isPlayer: false, marketShare: 0.11 },
      { name: '矢量天空航空', isPlayer: false, marketShare: 0.06 },
    ],
    cumulativeProfit: -50_000_000,
    cumulativePax: 400_000,
  });

  it('shows defeat headline (not 称霸蓝天) and rank text when rank > 1', () => {
    render(
      <FinalScreen airlineName="联星航空" gameId="test-game-id" finalResult={defeatResult} onRestart={jest.fn()} />,
    );
    expect(screen.getByTestId('final-headline')).not.toHaveTextContent('称霸蓝天');
    // Defeat rank indicator
    expect(screen.getByTestId('defeat-rank')).toHaveTextContent('第 3 名');
  });

  it('shows cumulative profit in red when negative', () => {
    render(
      <FinalScreen airlineName="联星航空" gameId="test-game-id" finalResult={defeatResult} onRestart={jest.fn()} />,
    );
    expect(screen.getByTestId('cumulative-profit')).toHaveClass('text-red-400');
    expect(screen.getByTestId('cumulative-profit')).toHaveTextContent('-$50M');
  });

  it('player row highlighted at rank 3 position', () => {
    render(
      <FinalScreen airlineName="联星航空" gameId="test-game-id" finalResult={defeatResult} onRestart={jest.fn()} />,
    );
    const standingsEl = screen.getByTestId('standings');
    const rows = within(standingsEl).getAllByRole('listitem');
    // Player is at index 2 (rank 3)
    expect(rows[2]).toHaveTextContent('联星航空');
    expect(rows[2]).toHaveClass('text-cyan-300');
    expect(rows[0]).not.toHaveClass('text-cyan-300');
  });
});

describe('FinalScreen — page-level status="finished" renders FinalScreen', () => {
  it('renders FinalScreen dialog when finalResult is provided', () => {
    render(
      <FinalScreen
        airlineName="环球之翼"
        gameId="test-game-id"
        finalResult={makeFinalResult()}
        onRestart={jest.fn()}
      />,
    );
    expect(
      screen.getByRole('dialog', { name: '游戏结束 — 终局结算' }),
    ).toBeInTheDocument();
  });
});
