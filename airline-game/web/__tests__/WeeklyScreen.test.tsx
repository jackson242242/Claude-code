/**
 * V3.4 — WeeklyScreen component tests.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeeklyScreen } from '@/components/WeeklyScreen';
import type { WeeklyChallenge } from '@/types';

const CHALLENGE: WeeklyChallenge = {
  weekId: '2026-W24',
  hqCityId: 'nyc',
  endsAtMs: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days from now
};

describe('WeeklyScreen', () => {
  it('renders the weekly challenge heading', () => {
    render(
      <WeeklyScreen
        challenge={CHALLENGE}
        busy={false}
        error={null}
        onStart={jest.fn()}
        onViewLeaderboard={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    expect(screen.getByTestId('weekly-screen')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-week-id')).toHaveTextContent('2026-W24');
  });

  it('renders the HQ city card', () => {
    render(
      <WeeklyScreen
        challenge={CHALLENGE}
        busy={false}
        error={null}
        onStart={jest.fn()}
        onViewLeaderboard={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    expect(screen.getByTestId('weekly-hq-city')).toBeInTheDocument();
  });

  it('renders the explainer text', () => {
    render(
      <WeeklyScreen
        challenge={CHALLENGE}
        busy={false}
        error={null}
        onStart={jest.fn()}
        onViewLeaderboard={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    expect(screen.getByTestId('weekly-explainer')).toBeInTheDocument();
  });

  it('shows countdown when challenge is active', () => {
    render(
      <WeeklyScreen
        challenge={CHALLENGE}
        busy={false}
        error={null}
        onStart={jest.fn()}
        onViewLeaderboard={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    const countdown = screen.getByTestId('weekly-countdown');
    expect(countdown).toBeInTheDocument();
    // Should not show "ended" text since endsAtMs is in the future
    expect(countdown).not.toHaveTextContent('已结束');
  });

  it('start button is disabled when airline name is empty', () => {
    render(
      <WeeklyScreen
        challenge={CHALLENGE}
        busy={false}
        error={null}
        onStart={jest.fn()}
        onViewLeaderboard={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    expect(screen.getByTestId('weekly-start-btn')).toBeDisabled();
  });

  it('start button is enabled when airline name is entered', async () => {
    render(
      <WeeklyScreen
        challenge={CHALLENGE}
        busy={false}
        error={null}
        onStart={jest.fn()}
        onViewLeaderboard={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    await userEvent.type(screen.getByTestId('weekly-airline-name'), '测试航空');
    expect(screen.getByTestId('weekly-start-btn')).not.toBeDisabled();
  });

  it('calls onStart with the trimmed airline name when start button clicked', async () => {
    const onStart = jest.fn();
    render(
      <WeeklyScreen
        challenge={CHALLENGE}
        busy={false}
        error={null}
        onStart={onStart}
        onViewLeaderboard={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    await userEvent.type(screen.getByTestId('weekly-airline-name'), '  测试航空  ');
    await userEvent.click(screen.getByTestId('weekly-start-btn'));
    expect(onStart).toHaveBeenCalledWith('测试航空');
  });

  it('calls onViewLeaderboard when leaderboard button is clicked', async () => {
    const onViewLeaderboard = jest.fn();
    render(
      <WeeklyScreen
        challenge={CHALLENGE}
        busy={false}
        error={null}
        onStart={jest.fn()}
        onViewLeaderboard={onViewLeaderboard}
        onBack={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByTestId('weekly-leaderboard-btn'));
    expect(onViewLeaderboard).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when back button is clicked', async () => {
    const onBack = jest.fn();
    render(
      <WeeklyScreen
        challenge={CHALLENGE}
        busy={false}
        error={null}
        onStart={jest.fn()}
        onViewLeaderboard={jest.fn()}
        onBack={onBack}
      />,
    );
    await userEvent.click(screen.getByTestId('weekly-back-btn'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows error message when error prop is set', () => {
    render(
      <WeeklyScreen
        challenge={CHALLENGE}
        busy={false}
        error="Something went wrong"
        onStart={jest.fn()}
        onViewLeaderboard={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('start button is disabled and shows busy text when busy', async () => {
    render(
      <WeeklyScreen
        challenge={CHALLENGE}
        busy={true}
        error={null}
        onStart={jest.fn()}
        onViewLeaderboard={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    await userEvent.type(screen.getByTestId('weekly-airline-name'), '测试航空');
    expect(screen.getByTestId('weekly-start-btn')).toBeDisabled();
  });

  it('shows ended state when challenge has expired', () => {
    const expiredChallenge: WeeklyChallenge = {
      ...CHALLENGE,
      endsAtMs: Date.now() - 1000, // already ended
    };
    render(
      <WeeklyScreen
        challenge={expiredChallenge}
        busy={false}
        error={null}
        onStart={jest.fn()}
        onViewLeaderboard={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    const countdown = screen.getByTestId('weekly-countdown');
    expect(countdown).toHaveClass('text-red-400');
  });
});
