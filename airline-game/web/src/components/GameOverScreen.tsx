'use client';

import { useEffect } from 'react';
import { useT } from '@/i18n';
import { loadProfile, saveProfile, awardGameEnd } from '@/lib/profile';

type GameOverScreenProps = {
  airlineName: string;
  gameId: string;
  onRestart: () => void;
};

export const GameOverScreen = ({ airlineName, gameId, onRestart }: GameOverScreenProps) => {
  const { t } = useT();

  // Award game-end XP (no victory) once per game id.
  useEffect(() => {
    const profile = loadProfile();
    const { profile: updated, awarded } = awardGameEnd(profile, gameId, false);
    if (awarded) saveProfile(updated);
  }, [gameId]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label={t('gameover.aria')}
    >
      <div className="panel mx-4 w-full max-w-sm p-6 text-center">
        <p className="text-4xl">🛬</p>
        <h2 className="mt-3 text-xl font-bold text-red-400">{t('gameover.heading')}</h2>
        <p className="mt-2 text-sm text-slate-400">
          {t('gameover.body', { airlineName })}
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="btn-primary mt-5 w-full px-4 py-3 text-sm"
        >
          {t('gameover.btn.restart')}
        </button>
      </div>
    </div>
  );
};
