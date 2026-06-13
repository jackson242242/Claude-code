'use client';

import { useT } from '@/i18n';

type GameOverScreenProps = {
  airlineName: string;
  onRestart: () => void;
};

export const GameOverScreen = ({ airlineName, onRestart }: GameOverScreenProps) => {
  const { t } = useT();
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
