'use client';

import { type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/i18n/messages';

interface LanguageSwitcherProps {
  locale: Locale;
}

export const LanguageSwitcher = ({ locale }: LanguageSwitcherProps) => {
  const router = useRouter();

  const onChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const next = event.target.value;
    document.cookie = `locale=${next}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <select
      className="lang"
      aria-label="Language"
      value={locale}
      onChange={onChange}
    >
      {LOCALES.map((option) => (
        <option key={option} value={option}>
          {LOCALE_LABELS[option]}
        </option>
      ))}
    </select>
  );
};
