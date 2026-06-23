'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, getMatch } from '@/services/api';
import type { MatchView } from '@/types';

const POLL_INTERVAL_MS = 2000;

type UseMatchPollResult = {
  view: MatchView | null;
  loading: boolean;
  error: string | null;
  /** S5: true when the room returned 404 (server restarted, room lost in memory). */
  roomGone: boolean;
  refresh: () => void;
};

/**
 * V3.3: Polls GET /api/matches/{code}?playerId every 2 s while phase is
 * "lobby" or "active".  Pauses when the tab is hidden (visibilitychange).
 * Stops permanently when phase becomes "finished".
 * S5: Sets roomGone=true and stops polling on 404 (server restarted, room lost).
 */
export const useMatchPoll = (
  code: string | null,
  playerId: string | null,
): UseMatchPollResult => {
  const [view, setView] = useState<MatchView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomGone, setRoomGone] = useState(false);

  // Refs to avoid stale closures in the interval callback.
  const viewRef = useRef<MatchView | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiddenRef = useRef(false);
  const activeRef = useRef(true); // set to false when component unmounts
  const roomGoneRef = useRef(false); // set to true permanently on 404

  const fetchNow = useCallback(async () => {
    if (!code || !playerId) return;
    setLoading(true);
    try {
      const next = await getMatch(code, playerId);
      if (activeRef.current) {
        viewRef.current = next;
        setView(next);
        setError(null);
      }
    } catch (err) {
      if (activeRef.current) {
        if (err instanceof ApiError && err.status === 404) {
          roomGoneRef.current = true;
          setRoomGone(true);
        }
        setError(err instanceof Error ? err.message : '轮询失败');
      }
    } finally {
      if (activeRef.current) {
        setLoading(false);
      }
    }
  }, [code, playerId]);

  // Schedule the next poll tick (does NOT fire if phase=finished, tab hidden, or room gone).
  const schedulePoll = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!activeRef.current) return;
    const phase = viewRef.current?.phase;
    if (phase === 'finished') return; // stop permanently
    if (hiddenRef.current) return;    // pause while hidden
    if (roomGoneRef.current) return;  // stop permanently when room is gone (S5)

    timerRef.current = setTimeout(async () => {
      await fetchNow();
      schedulePoll();
    }, POLL_INTERVAL_MS);
  }, [fetchNow]);

  // Initial fetch + start polling loop.
  useEffect(() => {
    if (!code || !playerId) return;
    activeRef.current = true;

    void fetchNow().then(() => {
      schedulePoll();
    });

    const handleVisibility = () => {
      hiddenRef.current = document.hidden;
      if (!document.hidden) {
        // Tab became visible — fetch immediately then reschedule.
        void fetchNow().then(() => schedulePoll());
      } else {
        // Tab hidden — cancel pending timer.
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      activeRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, playerId]);

  return { view, loading, error, roomGone, refresh: fetchNow };
};
