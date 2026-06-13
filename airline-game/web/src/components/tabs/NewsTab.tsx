'use client';

import { AIRCRAFT_IMAGES, modelName } from '@/lib/data';
import { useT } from '@/i18n';
import { localizedNewsHeadline } from '@/i18n/localizedEvent';
import type { NewsItem } from '@/types';

type NewsTabProps = {
  news: NewsItem[];
};

export const NewsTab = ({ news }: NewsTabProps) => {
  const { t, locale } = useT();
  const credits = Object.entries(AIRCRAFT_IMAGES);

  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {t('news.heading')}
        </h3>
        {news.length === 0 && <p className="text-sm text-slate-500">{t('news.empty')}</p>}
        <ul className="flex flex-col gap-2">
          {news.map((item, index) => (
            <li key={`${index}-${item.headline}`} className="panel p-3">
              <p className="flex items-start gap-2 text-sm font-semibold text-white">
                <span
                  className={`mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    item.kind === 'event'
                      ? 'bg-accent text-black'
                      : 'bg-ops-700 text-glow'
                  }`}
                >
                  {item.kind === 'event' ? t('news.kind.event') : t('news.kind.system')}
                </span>
                {localizedNewsHeadline(item, locale)}
              </p>
              {item.detail && <p className="mt-1 text-xs text-slate-400">{item.detail}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-3" data-testid="image-credits">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {t('news.credits.heading')}
        </h3>
        {credits.length === 0 ? (
          <p className="text-xs text-slate-500">
            {t('news.credits.empty')}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {credits.map(([modelId, entry]) => (
              <li key={modelId} className="text-xs text-slate-400">
                <span className="font-semibold text-slate-300">{modelName(modelId)}</span> —{' '}
                {entry.credit}{' '}
                <a
                  href={entry.filePage}
                  target="_blank"
                  rel="noreferrer"
                  className="text-glow underline decoration-dotted underline-offset-2 hover:text-white"
                >
                  {t('news.credits.filePage')}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
