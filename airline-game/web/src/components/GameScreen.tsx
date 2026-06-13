'use client';

import { useEffect, useRef, useState } from 'react';
import { DecisionModal } from '@/components/DecisionModal';
import { EventTicker } from '@/components/EventTicker';
import { SlotBadge } from '@/components/SlotBadge';
import { TopBar } from '@/components/TopBar';
import { TutorialPanel } from '@/components/TutorialPanel';
import { WorldMap } from '@/components/WorldMap';
import { cityLabel, CITY_IMAGES, CITY_BY_ID } from '@/lib/data';
import { voice } from '@/lib/voice';
import { FinanceTab } from '@/components/tabs/FinanceTab';
import { FleetTab } from '@/components/tabs/FleetTab';
import { MarketTab } from '@/components/tabs/MarketTab';
import { NewsTab } from '@/components/tabs/NewsTab';
import { RoutesTab } from '@/components/tabs/RoutesTab';
import { useT } from '@/i18n';
import { BADGES, TIER_COLORS } from '@/lib/badges';
import { loadProfile, saveProfile, recordBadge, recordPositiveBrandDecision, hasPositiveBrandDecision } from '@/lib/profile';
import { tStandalone, getLocale } from '@/i18n/standalone';
import type { ProjectionId } from '@/lib/map';
import type { MapThemeId } from '@/lib/mapTheme';
import { PROJECTION_STORAGE_KEY, THEME_STORAGE_KEY } from '@/components/MapSettingsPopover';
import type { Command, GameState } from '@/types';
import type { BadgeId } from '@/lib/badges';

type TabId = 'routes' | 'fleet' | 'market' | 'finance' | 'news';

const TAB_IDS: TabId[] = ['routes', 'fleet', 'market', 'finance', 'news'];

// Deterministic gradient based on id charCode sum.
const GRADIENT_PAIRS: [string, string][] = [
  ['#1a3a5c', '#0d6e8a'],
  ['#2d1b69', '#7b2d8b'],
  ['#1a4731', '#2d8a5e'],
  ['#5c2a1a', '#c0692b'],
  ['#1a1a5c', '#2b4fc0'],
  ['#3d1a5c', '#8b5cf6'],
  ['#5c1a3a', '#c02b6e'],
  ['#1a4a4a', '#2b8a8a'],
];

const getGradient = (id: string): [string, string] => {
  const sum = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return GRADIENT_PAIRS[sum % GRADIENT_PAIRS.length];
};

type CityPhotoProps = { cityId: string };

const CityPhoto = ({ cityId }: CityPhotoProps) => {
  const [imgError, setImgError] = useState(false);
  const entry = CITY_IMAGES[cityId];
  const showImg = !!entry && !imgError;
  const [from, to] = getGradient(cityId);

  if (showImg) {
    return (
      <img
        src={entry.url}
        alt={`${cityId} skyline`}
        loading="lazy"
        onError={() => setImgError(true)}
        className="h-16 w-20 flex-none rounded object-cover"
      />
    );
  }
  return (
    <div
      data-testid={`city-gradient-${cityId}`}
      className="h-16 w-20 flex-none rounded"
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
    />
  );
};

type BadgeToast = {
  id: BadgeId;
  name: string;
  tier: 'bronze' | 'silver' | 'gold';
  color: string;
};

type GameScreenProps = {
  state: GameState;
  busy: boolean;
  error: string | null;
  onDismissError: () => void;
  onCommands: (commands: Command[]) => void;
  onEndTurn: () => void;
  /** V3.3: When set, the end-turn button label switches to 「准备结算」
   *  and calls onReady instead of onEndTurn. */
  matchMode?: {
    isReady: boolean;
    onReady: () => void;
  };
};

export const GameScreen = ({
  state,
  busy,
  error,
  onDismissError,
  onCommands,
  onEndTurn,
  matchMode,
}: GameScreenProps) => {
  const { t, locale } = useT();
  const [tab, setTab] = useState<TabId>('routes');
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [highlightTab, setHighlightTab] = useState<string | null>(null);
  const [fleetPulse, setFleetPulse] = useState(false);
  const [showDecisionWarning, setShowDecisionWarning] = useState(false);
  const [badgeToast, setBadgeToast] = useState<BadgeToast | null>(null);

  // V3.2: Projection + theme state — hydrated from localStorage
  const [projectionId, setProjectionId] = useState<ProjectionId>('naturalEarth');
  const [themeId, setThemeId] = useState<MapThemeId>('dark-ops');

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedProj = window.localStorage.getItem(PROJECTION_STORAGE_KEY);
    if (storedProj === 'naturalEarth' || storedProj === 'globe' || storedProj === 'mercator') {
      setProjectionId(storedProj);
    }
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'dark-ops' || storedTheme === 'light-day' || storedTheme === 'retro-chart') {
      setThemeId(storedTheme);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const prevTurnRef = useRef(state.turn);
  const badgeToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Speak major events when they first appear.
  const spokenEventIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const event of state.activeEvents) {
      if (event.severity === 'major' && !spokenEventIds.current.has(event.id)) {
        spokenEventIds.current.add(event.id);
        voice.speakMajorEvent(event.headline);
      }
    }
  }, [state.activeEvents]);

  // Badge detection: run after each state change, toast new earns.
  useEffect(() => {
    const extra = { hasPositiveBrandDecision: hasPositiveBrandDecision() };
    let profile = loadProfile();
    const queue: BadgeToast[] = [];

    for (const badge of BADGES) {
      if (!profile.badges[badge.id] && badge.earned(state, extra)) {
        const locale = getLocale();
        const badgeName = tStandalone(locale, badge.nameKey);
        profile = recordBadge(profile, badge.id, badge.tier);
        queue.push({
          id: badge.id,
          name: badgeName,
          tier: badge.tier,
          color: TIER_COLORS[badge.tier],
        });
      }
    }

    if (queue.length > 0) {
      saveProfile(profile);
      // Show toasts sequentially, 2.5s apart.
      queue.forEach((toast, i) => {
        setTimeout(() => {
          setBadgeToast(toast);
          voice.speakBadge(toast.name);
          if (badgeToastTimerRef.current) clearTimeout(badgeToastTimerRef.current);
          badgeToastTimerRef.current = setTimeout(() => setBadgeToast(null), 3000);
        }, i * 2500);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Detect end-turn (turn increment) and trigger fleet pulse animation
  useEffect(() => {
    if (state.turn > prevTurnRef.current) {
      setFleetPulse(true);
      const timer = setTimeout(() => setFleetPulse(false), 700);
      prevTurnRef.current = state.turn;
      return () => clearTimeout(timer);
    }
    prevTurnRef.current = state.turn;
  }, [state.turn]);

  const handleSelectCity = (cityId: string) => {
    setSelectedCityId(cityId);
    if (cityId !== state.hqCityId) setTab('routes');
  };

  const handleEndTurnWithCheck = () => {
    if (state.pendingDecision) {
      setShowDecisionWarning(true);
      setTimeout(() => setShowDecisionWarning(false), 4000);
    }
    // V3.3: in match mode, the end-turn button calls ready instead.
    if (matchMode) {
      matchMode.onReady();
    } else {
      onEndTurn();
    }
  };

  const handleResolveDecision = (optionId: string) => {
    // Check if the chosen option has a positive brandDelta — if so, record it.
    if (state.pendingDecision) {
      const chosen = state.pendingDecision.options.find((o) => o.id === optionId);
      if (chosen && chosen.brandDelta > 0) {
        recordPositiveBrandDecision();
      }
    }
    onCommands([{ type: 'resolveDecision', optionId }]);
  };

  return (
    <div className="flex h-dvh flex-col">
      <TopBar
        state={state}
        busy={busy}
        onEndTurn={handleEndTurnWithCheck}
        projectionId={projectionId}
        themeId={themeId}
        onProjectionChange={setProjectionId}
        onThemeChange={setThemeId}
        matchMode={matchMode ? { isReady: matchMode.isReady } : undefined}
      />
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
            fleetPulse={fleetPulse}
            projectionId={projectionId}
            themeId={themeId}
          />
          {/* M2.2: tapping a city surfaces its slot market snapshot */}
          {selectedCityId && (() => {
            const tappedCity = CITY_BY_ID.get(selectedCityId);
            const airportName = tappedCity
              ? (locale === 'zh' ? tappedCity.airportZh : tappedCity.airport)
              : null;
            return (
              <div
                data-testid="map-city-slots"
                className="absolute bottom-2 left-2 flex max-w-[92%] items-start gap-2 rounded-lg border border-ops-700 bg-ops-900/90 px-2.5 py-1.5 backdrop-blur"
              >
                {/* Skyline thumbnail */}
                <CityPhoto cityId={selectedCityId} />

                {/* City name + slot badge + V3.9 airport + chips */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-200">
                    {cityLabel(selectedCityId)}
                    {tappedCity && (
                      <span
                        data-testid={`overlay-iata-${selectedCityId}`}
                        className="ml-1.5 rounded bg-ops-700 px-1 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-300"
                      >
                        {tappedCity.iata}
                      </span>
                    )}
                  </span>
                  {airportName && (
                    <span
                      data-testid={`overlay-airport-${selectedCityId}`}
                      className="truncate text-[10px] text-slate-500"
                    >
                      {airportName}
                    </span>
                  )}
                  <SlotBadge cityId={selectedCityId} info={state.slotMarket[selectedCityId]} />
                  {/* V3.9 endowment mini-chips */}
                  {tappedCity && (
                    <span className="flex flex-wrap gap-1 text-[10px]">
                      <span className="rounded-full bg-ops-700 px-1.5 py-0.5 text-slate-400">
                        {t('city.chip.population', { pop: tappedCity.population.toFixed(1) })}
                      </span>
                      {tappedCity.taxRelief > 0 && (
                        <span className="rounded-full bg-cyan-950/60 px-1.5 py-0.5 text-cyan-400">
                          {t('city.chip.taxRelief', { pct: Math.round(tappedCity.taxRelief * 100) })}
                        </span>
                      )}
                      <span
                        className={`rounded-full bg-ops-700 px-1.5 py-0.5 ${
                          tappedCity.transitIndex > 6
                            ? 'text-cyan-400'
                            : tappedCity.transitIndex < 4
                              ? 'text-slate-600'
                              : 'text-slate-400'
                        }`}
                      >
                        {t('city.chip.transit', { n: tappedCity.transitIndex })}
                      </span>
                      <span className="rounded-full bg-ops-700 px-1.5 py-0.5 text-slate-400">
                        {t(`city.terrain.${tappedCity.terrain}` as import('@/i18n').DictKeys)}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* bottom drawer / side panel */}
        <div className="flex min-h-0 flex-1 flex-col bg-ops-900/60 md:w-[420px] md:flex-none">
          <nav className="flex flex-none border-b border-ops-700" role="tablist" aria-label={t('game.aria.tabPanel')}>
            {TAB_IDS.map((id) => (
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
                {t(`game.tab.${id}` as import('@/i18n').DictKeys)}
                {highlightTab === id && (
                  <span className="tab-highlight-dot" data-testid={`tab-highlight-${id}`} />
                )}
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
            {tab === 'finance' && <FinanceTab state={state} onCommands={onCommands} />}
            {tab === 'news' && <NewsTab news={state.news} />}
          </div>
        </div>
      </div>

      {/* Tutorial panel — pinned bottom-left */}
      <TutorialPanel state={state} onHighlightTab={setHighlightTab} />

      {/* V3.7: Decision modal — shown when pendingDecision is not null */}
      {state.pendingDecision && (
        <DecisionModal
          decision={state.pendingDecision}
          onResolve={handleResolveDecision}
        />
      )}

      {/* V3.7: Warning toast when ending turn with pending decision */}
      {showDecisionWarning && (
        <div
          role="alert"
          data-testid="decision-end-turn-warning"
          className="fixed bottom-3 left-1/2 z-50 flex w-[min(92vw,28rem)] -translate-x-1/2 items-start gap-2 rounded-lg border border-amber-800 bg-amber-950/95 px-3 py-2.5 text-sm text-amber-200 shadow-xl backdrop-blur"
        >
          <span className="flex-1">{t('decision.warning.endTurn')}</span>
          <button
            type="button"
            onClick={() => setShowDecisionWarning(false)}
            className="text-amber-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="fixed bottom-3 left-1/2 z-40 flex w-[min(92vw,28rem)] -translate-x-1/2 items-start gap-2 rounded-lg border border-red-900 bg-red-950/95 px-3 py-2.5 text-sm text-red-200 shadow-xl backdrop-blur"
        >
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={onDismissError}
            aria-label={t('game.aria.dismissError')}
            className="text-red-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* V3.8: Badge toast notification */}
      {badgeToast && (
        <div
          role="status"
          data-testid="badge-toast"
          className="fixed right-3 top-16 z-50 flex items-center gap-2.5 rounded-lg border bg-ops-900/95 px-3.5 py-2.5 text-sm shadow-xl backdrop-blur"
          style={{ borderColor: badgeToast.color }}
        >
          <span className="text-lg" style={{ color: badgeToast.color }}>🏅</span>
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: badgeToast.color }}>
              {t('badge.toast.prefix')} · {t(`badge.tier.${badgeToast.tier}` as import('@/i18n').DictKeys)}
            </p>
            <p className="font-semibold text-white">{badgeToast.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};
