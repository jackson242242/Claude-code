import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleView } from '@/components/ScheduleView';
import { MOCK_MATCHES } from '@/mocks/matches';
import { MOCK_CITIES } from '@/mocks/cities';
import { MOCK_TEAMS } from '@/mocks/teams';

describe('ScheduleView', () => {
  it('shows all matches initially and narrows them by team search', async () => {
    const user = userEvent.setup();
    render(
      <ScheduleView
        matches={MOCK_MATCHES}
        cities={MOCK_CITIES}
        teams={MOCK_TEAMS}
      />,
    );

    expect(screen.getByTestId('match-count')).toHaveTextContent('104 matches');

    await user.type(screen.getByLabelText('Search team'), 'Mexico');

    expect(screen.getByTestId('match-count')).toHaveTextContent('3 matches');
  });

  it('filters by stage select', async () => {
    const user = userEvent.setup();
    render(
      <ScheduleView
        matches={MOCK_MATCHES}
        cities={MOCK_CITIES}
        teams={MOCK_TEAMS}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Stage'), 'Final');
    expect(screen.getByTestId('match-count')).toHaveTextContent('1 match');
  });
});
