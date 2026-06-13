'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n';
import { QUESTS, getQuestIndex } from '@/lib/tutorial';
import { voice } from '@/lib/voice';
import type { GameState } from '@/types';

type TutorialPanelProps = {
  state: GameState;
  onHighlightTab: (tab: string | null) => void;
};

type TutorialStorage = {
  dismissed: boolean;
  collapsed: boolean;
};

const storageKey = (gameId: string) => `skyempire.tutorial.${gameId}`;

const readStorage = (gameId: string): TutorialStorage | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(storageKey(gameId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TutorialStorage;
  } catch {
    return null;
  }
};

const writeStorage = (gameId: string, value: TutorialStorage): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(gameId), JSON.stringify(value));
};

export const TutorialPanel = ({ state, onHighlightTab }: TutorialPanelProps) => {
  const { t } = useT();
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const prevDoneCountRef = useRef<number>(-1);

  const currentIdx = getQuestIndex(state);
  const doneCount = currentIdx;
  const total = QUESTS.length;

  // On mount: decide visibility based on localStorage
  useEffect(() => {
    const entry = readStorage(state.id);
    if (!entry) {
      if (state.turn === 1) {
        setVisible(true);
        setCollapsed(false);
        writeStorage(state.id, { dismissed: false, collapsed: false });
      }
    } else if (!entry.dismissed) {
      setVisible(true);
      setCollapsed(entry.collapsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.id]);

  // Detect quest completions and call speakQuestDone
  useEffect(() => {
    if (prevDoneCountRef.current === -1) {
      prevDoneCountRef.current = doneCount;
      return;
    }
    if (doneCount > prevDoneCountRef.current) {
      // A quest was just completed; find which ones
      for (let i = prevDoneCountRef.current; i < doneCount; i++) {
        const quest = QUESTS[i];
        if (quest) {
          const title = t(quest.titleKey);
          voice.speakQuestDone(title);
        }
      }
    }
    prevDoneCountRef.current = doneCount;
  }, [doneCount, t]);

  // Highlight targetTab of current quest
  useEffect(() => {
    if (!visible || currentIdx >= QUESTS.length) {
      onHighlightTab(null);
      return;
    }
    const quest = QUESTS[currentIdx];
    onHighlightTab(quest?.targetTab ?? null);
  }, [visible, currentIdx, onHighlightTab]);

  const handleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    const entry = readStorage(state.id);
    writeStorage(state.id, { dismissed: entry?.dismissed ?? false, collapsed: next });
  };

  const handleDismiss = () => {
    const confirmed = window.confirm(t('tutorial.dismiss.confirm'));
    if (confirmed) {
      writeStorage(state.id, { dismissed: true, collapsed });
      setVisible(false);
      onHighlightTab(null);
    }
  };

  if (!visible) return null;

  const currentQuest = currentIdx < QUESTS.length ? QUESTS[currentIdx] : null;

  return (
    <div
      data-testid="tutorial-panel"
      className="fixed bottom-16 left-2 z-30 w-64 rounded-lg border border-ops-700 bg-ops-900/95 shadow-xl backdrop-blur"
    >
      {/* Header */}
      <div className="flex items-center gap-1 border-b border-ops-700 px-3 py-2">
        <span className="flex-1 text-xs font-bold text-accent">
          {t('tutorial.heading')}
        </span>
        <span className="text-[11px] text-slate-400">
          {t('tutorial.progress', { done: doneCount, total })}
        </span>
        <button
          type="button"
          data-testid="tutorial-collapse-btn"
          onClick={handleCollapse}
          className="ml-1 text-[11px] text-slate-500 hover:text-slate-300"
          aria-label={collapsed ? t('tutorial.expand') : t('tutorial.collapse')}
        >
          {collapsed ? '▾' : '▴'}
        </button>
        <button
          type="button"
          data-testid="tutorial-dismiss-btn"
          onClick={handleDismiss}
          className="ml-1 text-[11px] text-slate-500 hover:text-red-400"
          aria-label={t('tutorial.dismiss')}
        >
          ✕
        </button>
      </div>

      {/* Quest list */}
      {!collapsed && (
        <ul className="px-3 py-2 text-xs">
          {QUESTS.map((quest, idx) => {
            const done = idx < currentIdx;
            const isCurrent = idx === currentIdx;

            return (
              <li
                key={quest.id}
                data-testid={`tutorial-quest-${quest.id}`}
                className={`mb-1.5 flex items-start gap-1.5 ${
                  done
                    ? 'text-slate-500 line-through'
                    : isCurrent
                      ? 'text-slate-200'
                      : 'text-slate-600'
                }`}
              >
                <span className="mt-px flex-none">
                  {done ? '✓' : isCurrent ? '▶' : '○'}
                </span>
                <span
                  className={isCurrent ? 'font-semibold' : ''}
                  data-testid={isCurrent ? 'tutorial-current-quest' : undefined}
                >
                  {t(quest.titleKey)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Current quest hint */}
      {!collapsed && currentQuest && (
        <div className="border-t border-ops-700 px-3 py-2 text-[11px] text-slate-400">
          {t(currentQuest.hintKey)}
        </div>
      )}
    </div>
  );
};
