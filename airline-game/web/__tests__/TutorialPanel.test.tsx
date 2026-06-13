/**
 * TutorialPanel tests — V3.5 tutorial quest chain
 */

// Mock voice module before any imports
jest.mock('@/lib/voice', () => ({
  voice: { speakQuestDone: jest.fn() },
}));

import { render, screen, fireEvent, act } from '@testing-library/react';
import { createElement } from 'react';
import { I18nProvider } from '@/i18n';
import { TutorialPanel } from '@/components/TutorialPanel';
import type { GameState } from '@/types';

// window.confirm mock
window.confirm = jest.fn(() => true);

const baseState: GameState = {
  id: 'game-test-1',
  airlineName: 'Test Air',
  hqCityId: 'nyc',
  turn: 1,
  year: 2026,
  quarter: 3,
  cash: 420_000_000,
  fleet: [],
  routes: [],
  competitors: [],
  marketShare: 0,
  slotMarket: {
    nyc: { capacity: 12, taken: 2, playerHeld: 2, playerUsed: 0 },
  },
  news: [],
  finance: { lastQuarter: null, history: [] },
  status: 'active',
  lifetime: { profit: 0, pax: 0 },
  finalResult: null,
  activeEvents: [],
};

const wrap = (node: React.ReactNode) => createElement(I18nProvider, null, node);

beforeEach(() => {
  window.localStorage.clear();
  (window.confirm as jest.Mock).mockReturnValue(true);
});

describe('TutorialPanel', () => {
  it('1. renders for new game (turn===1, no localStorage)', () => {
    render(
      wrap(
        createElement(TutorialPanel, {
          state: baseState,
          onHighlightTab: () => undefined,
        }),
      ),
    );
    expect(screen.getByTestId('tutorial-panel')).toBeInTheDocument();
  });

  it('2. does NOT render when dismissed entry in localStorage', () => {
    window.localStorage.setItem(
      'skyempire.tutorial.game-test-1',
      JSON.stringify({ dismissed: true, collapsed: false }),
    );
    render(
      wrap(
        createElement(TutorialPanel, {
          state: baseState,
          onHighlightTab: () => undefined,
        }),
      ),
    );
    expect(screen.queryByTestId('tutorial-panel')).not.toBeInTheDocument();
  });

  it('3. shows current quest title', () => {
    render(
      wrap(
        createElement(TutorialPanel, {
          state: baseState,
          onHighlightTab: () => undefined,
        }),
      ),
    );
    // Quest 0 title is "谈判获取时刻"
    expect(screen.getByTestId('tutorial-current-quest')).toBeInTheDocument();
    expect(screen.getByTestId('tutorial-current-quest').textContent).toContain('谈判获取时刻');
  });

  it('4. collapse/expand works', () => {
    render(
      wrap(
        createElement(TutorialPanel, {
          state: baseState,
          onHighlightTab: () => undefined,
        }),
      ),
    );

    // Initially expanded — quest rows visible
    expect(screen.getByTestId('tutorial-quest-0')).toBeInTheDocument();

    // Collapse
    const collapseBtn = screen.getByTestId('tutorial-collapse-btn');
    fireEvent.click(collapseBtn);

    // After collapse, quest rows should not be visible
    expect(screen.queryByTestId('tutorial-quest-0')).not.toBeInTheDocument();

    // Expand again
    fireEvent.click(collapseBtn);
    expect(screen.getByTestId('tutorial-quest-0')).toBeInTheDocument();
  });

  it('5. dismiss with confirm → panel hidden', () => {
    (window.confirm as jest.Mock).mockReturnValue(true);

    render(
      wrap(
        createElement(TutorialPanel, {
          state: baseState,
          onHighlightTab: () => undefined,
        }),
      ),
    );

    expect(screen.getByTestId('tutorial-panel')).toBeInTheDocument();

    const dismissBtn = screen.getByTestId('tutorial-dismiss-btn');
    fireEvent.click(dismissBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(screen.queryByTestId('tutorial-panel')).not.toBeInTheDocument();
  });

  it('5b. dismiss with cancel → panel stays visible', () => {
    (window.confirm as jest.Mock).mockReturnValue(false);

    render(
      wrap(
        createElement(TutorialPanel, {
          state: baseState,
          onHighlightTab: () => undefined,
        }),
      ),
    );

    const dismissBtn = screen.getByTestId('tutorial-dismiss-btn');
    fireEvent.click(dismissBtn);

    // Panel should still be visible
    expect(screen.getByTestId('tutorial-panel')).toBeInTheDocument();
  });

  it('6. tab highlight callback called with targetTab', () => {
    const onHighlightTab = jest.fn();
    render(
      wrap(
        createElement(TutorialPanel, {
          state: baseState,
          onHighlightTab,
        }),
      ),
    );
    // Quest 0 has targetTab 'routes'
    expect(onHighlightTab).toHaveBeenCalledWith('routes');
  });

  it('renders all 8 quest rows', () => {
    render(
      wrap(
        createElement(TutorialPanel, {
          state: baseState,
          onHighlightTab: () => undefined,
        }),
      ),
    );
    for (let i = 0; i < 8; i++) {
      expect(screen.getByTestId(`tutorial-quest-${i}`)).toBeInTheDocument();
    }
  });

  it('does NOT render for turn > 1 with no localStorage entry', () => {
    const laterState: GameState = { ...baseState, turn: 2 };
    render(
      wrap(
        createElement(TutorialPanel, {
          state: laterState,
          onHighlightTab: () => undefined,
        }),
      ),
    );
    // No entry and turn !== 1 → should not show
    expect(screen.queryByTestId('tutorial-panel')).not.toBeInTheDocument();
  });

  it('renders when dismissed===false entry in localStorage', () => {
    window.localStorage.setItem(
      'skyempire.tutorial.game-test-1',
      JSON.stringify({ dismissed: false, collapsed: false }),
    );
    render(
      wrap(
        createElement(TutorialPanel, {
          state: baseState,
          onHighlightTab: () => undefined,
        }),
      ),
    );
    expect(screen.getByTestId('tutorial-panel')).toBeInTheDocument();
  });
});
