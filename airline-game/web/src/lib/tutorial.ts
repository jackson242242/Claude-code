import type { GameState } from '@/types';

export type QuestId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Quest = {
  id: QuestId;
  titleKey: `tutorial.quest.${QuestId}.title`;
  hintKey: `tutorial.quest.${QuestId}.hint`;
  targetTab?: 'routes' | 'fleet' | 'market' | 'finance' | 'news';
  isDone: (state: GameState) => boolean;
};

export const QUESTS: readonly Quest[] = [
  {
    id: 0,
    titleKey: 'tutorial.quest.0.title',
    hintKey: 'tutorial.quest.0.hint',
    targetTab: 'routes',
    isDone: (state) =>
      Object.entries(state.slotMarket).some(([cityId, info]) =>
        cityId !== state.hqCityId ? info.playerHeld > 0 : info.playerHeld > 2,
      ),
  },
  {
    id: 1,
    titleKey: 'tutorial.quest.1.title',
    hintKey: 'tutorial.quest.1.hint',
    targetTab: 'market',
    isDone: (state) => state.fleet.length > 0,
  },
  {
    id: 2,
    titleKey: 'tutorial.quest.2.title',
    hintKey: 'tutorial.quest.2.hint',
    targetTab: 'routes',
    isDone: (state) => state.routes.length > 0,
  },
  {
    id: 3,
    titleKey: 'tutorial.quest.3.title',
    hintKey: 'tutorial.quest.3.hint',
    targetTab: 'routes',
    isDone: (state) => state.routes.some((r) => r.aircraftIds.length > 0),
  },
  {
    id: 4,
    titleKey: 'tutorial.quest.4.title',
    hintKey: 'tutorial.quest.4.hint',
    targetTab: undefined,
    isDone: (state) => state.turn > 1,
  },
  {
    id: 5,
    titleKey: 'tutorial.quest.5.title',
    hintKey: 'tutorial.quest.5.hint',
    targetTab: 'routes',
    isDone: (state) =>
      state.routes.some((r) => (r.lastQuarter?.loadFactor ?? 0) >= 0.7),
  },
  {
    id: 6,
    titleKey: 'tutorial.quest.6.title',
    hintKey: 'tutorial.quest.6.hint',
    targetTab: 'finance',
    isDone: (state) => (state.finance.lastQuarter?.profit ?? -Infinity) > 0,
  },
  {
    id: 7,
    titleKey: 'tutorial.quest.7.title',
    hintKey: 'tutorial.quest.7.hint',
    targetTab: 'routes',
    isDone: (state) => state.routes.length >= 2,
  },
] as const;

/** Returns the index of the first undone quest, or QUESTS.length if all done. */
export const getQuestIndex = (state: GameState): number => {
  const idx = QUESTS.findIndex((q) => !q.isDone(state));
  return idx === -1 ? QUESTS.length : idx;
};
