'use client';

import { useState } from 'react';
import { EventTicker } from '@/components/EventTicker';
import { SlotBadge } from '@/components/SlotBadge';
import { TopBar } from '@/components/TopBar';
import { WorldMap } from '@/components/WorldMap';
import { cityLabel } from '@/lib/data';
import { FinanceTab } from '@/components/tabs/FinanceTab';
import { FleetTab } from '@/components/tabs/FleetTab';
import { MarketTab } from '@/components/tabs/MarketTab';
import { NewsTab } from '@/components/tabs/NewsTab';
import { RoutesTab } from '@/components/tabs/RoutesTab';
import type { Command, GameState } from '@/types';

type TabId = 'routes' | 'fleet' | 'market' | 'finance' | 'news';

const TABS: { id: TabId; label: string }[] = [
  { id: 'routes', label: '航线' },
  { id: 'fleet', label: '机队' },
  { id: 'market', label: '机型市场' },
  { id: 'finance', label: '财务' },
  { id: 'news', label: '新闻' },
];

type GameScreenProps = {
  state: GameState;
  busy: boolean;
  error: string | null;
  onDismissError: () => void;
  onCommands: (commands: Command[]) => void;
  onEndTurn: () => void;
};

export const GameScreen = ({
  state,
  busy,
  error,
  onDismissError,
  onCommands,
  onEndTurn,
}: GameScreenProps) => {
  const [tab, setTab] = useState<TabId>('routes');
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  const handleSelectCity = (cityId: string) => {
    setSelectedCityId(cityId);
    if (cityId !== state.hqCityId) setTab('routes');
  };

  return (
    <div className="flex h-dvh flex-col">
      <TopBar state={state} busy={busy} onEndTurn={onEndTurn} />
      <EventTicker events={state.activeEvents} />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* map */}
        <div className="relative h-[36dvh] flex-none border-b border-ops-700 md:h-auto md:flex-1 md:border-b-0 md:border-r">
          <WorldMap
            hqCityId={state.hqCityId}
            routes={state.routes}
            competitors={state.competitors}
            selectedCityId={selectedCityId}
            onSelectCity={handleSelectCity}
          />
          {/* M2.2: tapping a city surfaces its slot market snapshot */}
          {selectedCityId && (
            <div
              data-testid="map-city-slots"
              className="absolute bottom-2 left-2 flex max-w-[92%] flex-wrap items-center gap-2 rounded-lg border border-ops-700 bg-ops-900/90 px-2.5 py-1.5 backdrop-blur"
            >
              <span className="text-xs font-semibold text-slate-200">
                {cityLabel(selectedCityId)}
              </span>
              <SlotBadge cityId={selectedCityId} info={state.slotMarket[selectedCityId]} />
            </div>
          )}
        </div>

        {/* bottom drawer / side panel */}
        <div className="flex min-h-0 flex-1 flex-col bg-ops-900/60 md:w-[420px] md:flex-none">
          <nav className="flex flex-none border-b border-ops-700" role="tablist" aria-label="操作面板">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`flex-1 whitespace-nowrap px-1 py-2.5 text-[13px] font-semibold transition ${
                  tab === id
                    ? 'border-b-2 border-accent text-accent'
                    : 'border-b-2 border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {tab === 'routes' && (
              <RoutesTab
                state={state}
                busy={busy}
                selectedCityId={selectedCityId}
                onCommands={onCommands}
              />
            )}
            {tab === 'fleet' && <FleetTab state={state} busy={busy} onCommands={onCommands} />}
            {tab === 'market' && (
              <MarketTab cash={state.cash} busy={busy} onCommands={onCommands} />
            )}
            {tab === 'finance' && <FinanceTab state={state} />}
            {tab === 'news' && <NewsTab news={state.news} />}
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="fixed bottom-3 left-1/2 z-40 flex w-[min(92vw,28rem)] -translate-x-1/2 items-start gap-2 rounded-lg border border-red-900 bg-red-950/95 px-3 py-2.5 text-sm text-red-200 shadow-xl backdrop-blur"
        >
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={onDismissError}
            aria-label="关闭提示"
            className="text-red-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
