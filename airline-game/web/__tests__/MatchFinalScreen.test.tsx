/**
 * V3.3 — FinalScreen renders correctly with multiplayer match standings.
 * Tests that the existing FinalScreen correctly handles match-style standings
 * (multiple isPlayer=true is theoretically possible but normally 1).
 */
import { render, screen, within } from '@testing-library/react';
import { FinalScreen } from '@/components/FinalScreen';
import type { FinalResult } from '@/types';

const makeMatchFinalResult = (overrides: Partial<FinalResult> = {}): FinalResult => ({
  rank: 1,
  victory: true,
  standings: [
    { name: '胜利者航空', isPlayer: true, marketShare: 0.32 },
    { name: '挑战者2号', isPlayer: false, marketShare: 0.28 },
    { name: '极光太平洋航空', isPlayer: false, marketShare: 0.22 },
    { name: '皇家子午线航空', isPlayer: false, marketShare: 0.18 },
  ],
  cumulativeProfit: 800_000_000,
  cumulativePax: 950_000,
  endedTurn: 80,
  ...overrides,
});

describe('FinalScreen with multiplayer standings', () => {
  it('renders all standings including human opponents', () => {
    render(
      <FinalScreen
        airlineName="胜利者航空"
        gameId="match-ABC123"
        finalResult={makeMatchFinalResult()}
        onRestart={jest.fn()}
      />,
    );
    const standings = screen.getByTestId('standings');
    const rows = within(standings).getAllByRole('listitem');
    expect(rows).toHaveLength(4);
    expect(rows[0]).toHaveTextContent('胜利者航空');
    expect(rows[1]).toHaveTextContent('挑战者2号');
  });

  it('highlights the player row (isPlayer=true)', () => {
    render(
      <FinalScreen
        airlineName="胜利者航空"
        gameId="match-ABC123"
        finalResult={makeMatchFinalResult()}
        onRestart={jest.fn()}
      />,
    );
    const standings = screen.getByTestId('standings');
    const rows = within(standings).getAllByRole('listitem');
    expect(rows[0]).toHaveClass('text-cyan-300'); // player row
    expect(rows[1]).not.toHaveClass('text-cyan-300'); // human opponent — no highlight
  });

  it('shows victory headline when rank === 1', () => {
    render(
      <FinalScreen
        airlineName="胜利者航空"
        gameId="match-ABC123"
        finalResult={makeMatchFinalResult({ rank: 1, victory: true })}
        onRestart={jest.fn()}
      />,
    );
    expect(screen.getByTestId('final-headline')).toHaveTextContent('称霸蓝天');
  });

  it('shows defeat headline when rank > 1', () => {
    render(
      <FinalScreen
        airlineName="挑战者"
        gameId="match-ABC123"
        finalResult={makeMatchFinalResult({
          rank: 2,
          victory: false,
          standings: [
            { name: '胜者', isPlayer: false, marketShare: 0.40 },
            { name: '挑战者', isPlayer: true, marketShare: 0.30 },
            { name: '第三名', isPlayer: false, marketShare: 0.30 },
          ],
        })}
        onRestart={jest.fn()}
      />,
    );
    expect(screen.getByTestId('final-headline')).not.toHaveTextContent('称霸蓝天');
    expect(screen.getByTestId('defeat-rank')).toHaveTextContent('第 2 名');
  });
});
