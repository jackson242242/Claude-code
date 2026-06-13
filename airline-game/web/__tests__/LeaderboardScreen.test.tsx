/**
 * V3.4 — LeaderboardScreen component tests.
 * Uses fetch mock to simulate getLeaderboard responses.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaderboardScreen } from '@/components/LeaderboardScreen';
import type { LeaderboardEntry, LeaderboardResponse } from '@/types';

const BASE = 'http://localhost:8001';

const ENTRIES: LeaderboardEntry[] = [
  { rank: 1, name: '极光环球航空', score: 9500, profit: 3_000_000_000, marketShare: 0.35 },
  { rank: 2, name: '星辰之翼', score: 8200, profit: 2_500_000_000, marketShare: 0.28, isYou: true },
  { rank: 3, name: '翱翔天际', score: 7100, profit: 2_100_000_000, marketShare: 0.20 },
];

const jsonResponse = (body: unknown, ok = true, status = 200): Response =>
  ({ ok, status, json: async () => body }) as Response;

const mockFetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit | undefined]>();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

const leaderboardResponse: LeaderboardResponse = {
  weekId: '2026-W24',
  entries: ENTRIES,
};

describe('LeaderboardScreen — normal rendering', () => {
  it('renders the heading and week id', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(leaderboardResponse));
    render(<LeaderboardScreen weekId="2026-W24" onBack={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-week-id')).toHaveTextContent('2026-W24');
    });
  });

  it('renders ranked rows in order', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(leaderboardResponse));
    render(<LeaderboardScreen weekId="2026-W24" onBack={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-row-1')).toHaveTextContent('极光环球航空');
      expect(screen.getByTestId('leaderboard-row-2')).toHaveTextContent('星辰之翼');
      expect(screen.getByTestId('leaderboard-row-3')).toHaveTextContent('翱翔天际');
    });
  });

  it('highlights the isYou row with cyan class', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(leaderboardResponse));
    render(<LeaderboardScreen weekId="2026-W24" onBack={jest.fn()} />);

    await waitFor(() => {
      const youRow = screen.getByTestId('leaderboard-row-2');
      expect(youRow).toHaveClass('text-cyan-300');
    });
  });

  it('non-you rows are not cyan', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(leaderboardResponse));
    render(<LeaderboardScreen weekId="2026-W24" onBack={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-row-1')).not.toHaveClass('text-cyan-300');
      expect(screen.getByTestId('leaderboard-row-3')).not.toHaveClass('text-cyan-300');
    });
  });

  it('shows (你) badge on the isYou row', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(leaderboardResponse));
    render(<LeaderboardScreen weekId="2026-W24" onBack={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-you-badge')).toBeInTheDocument();
    });
  });

  it('shows profit and share for all rows', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(leaderboardResponse));
    render(<LeaderboardScreen weekId="2026-W24" onBack={jest.fn()} />);

    await waitFor(() => {
      // market shares
      expect(screen.getByTestId('leaderboard-table')).toHaveTextContent('35.0%');
      expect(screen.getByTestId('leaderboard-table')).toHaveTextContent('28.0%');
      expect(screen.getByTestId('leaderboard-table')).toHaveTextContent('20.0%');
    });
  });

  it('shows top 3 medal emojis', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(leaderboardResponse));
    render(<LeaderboardScreen weekId="2026-W24" onBack={jest.fn()} />);

    await waitFor(() => {
      const table = screen.getByTestId('leaderboard-table');
      expect(table).toHaveTextContent('🥇');
      expect(table).toHaveTextContent('🥈');
      expect(table).toHaveTextContent('🥉');
    });
  });
});

describe('LeaderboardScreen — empty state', () => {
  it('shows empty state message when no entries', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ weekId: '2026-W24', entries: [] }),
    );
    render(<LeaderboardScreen weekId="2026-W24" onBack={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-empty')).toBeInTheDocument();
    });
  });
});

describe('LeaderboardScreen — error state', () => {
  it('shows error message on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    render(<LeaderboardScreen weekId="2026-W24" onBack={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-error')).toBeInTheDocument();
    });
  });
});

describe('LeaderboardScreen — refresh', () => {
  it('calls getLeaderboard again on refresh click', async () => {
    mockFetch.mockResolvedValue(jsonResponse(leaderboardResponse));
    render(<LeaderboardScreen weekId="2026-W24" onBack={jest.fn()} />);

    // Wait for table to render (first load complete, button becomes enabled)
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-table')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByTestId('leaderboard-refresh-btn');
    await waitFor(() => expect(refreshBtn).not.toBeDisabled());
    await userEvent.click(refreshBtn);

    // Should have been called twice: once on mount, once on refresh
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('LeaderboardScreen — back button', () => {
  it('calls onBack when back button is clicked', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(leaderboardResponse));
    const onBack = jest.fn();
    render(<LeaderboardScreen weekId="2026-W24" onBack={onBack} />);

    // Wait for fetch to complete so there are no pending state updates
    await waitFor(() => screen.getByTestId('leaderboard-table'));

    await userEvent.click(screen.getByTestId('leaderboard-back-btn'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('LeaderboardScreen — API path', () => {
  it('calls the correct endpoint with weekId and token', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(leaderboardResponse));
    render(<LeaderboardScreen weekId="2026-W24" token="abc123" onBack={jest.fn()} />);

    await waitFor(() => {
      const [url] = mockFetch.mock.calls[0];
      expect(String(url)).toBe(`${BASE}/api/leaderboard?weekId=2026-W24&token=abc123`);
    });
  });

  it('calls endpoint without params when weekId/token are omitted', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ weekId: '2026-W24', entries: [] }));
    render(<LeaderboardScreen onBack={jest.fn()} />);

    await waitFor(() => {
      const [url] = mockFetch.mock.calls[0];
      expect(String(url)).toBe(`${BASE}/api/leaderboard`);
    });
  });
});
