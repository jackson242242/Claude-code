'use client';

/**
 * useHoverContext — privacy-safe anticipation primitive.
 *
 * Watches the page for hover/focus over any element carrying `data-ctx-*`
 * attributes and returns a debounced snapshot of what the fan is looking at.
 *
 * Privacy by design: it reads ONLY the `data-ctx-*` attributes already rendered
 * into the DOM. No cursor coordinates are stored, no network calls are made, and
 * nothing is persisted — so it can anticipate intent without surveilling the user.
 */

import { useEffect, useState } from 'react';

export interface HoverContext {
  /** Category, e.g. "city" or "match". */
  kind: string;
  /** Headline, e.g. a city or fixture name. */
  title: string;
  /** Supporting line, e.g. country + airports, or stage + kickoff. */
  detail: string;
  /** Optional in-app destination the notebook can link to. */
  href: string | null;
}

const readContext = (target: Element): HoverContext | null => {
  const host = target.closest<HTMLElement>('[data-ctx-kind]');
  if (!host) return null;

  const kind = host.dataset.ctxKind ?? '';
  const title = host.dataset.ctxTitle ?? '';
  if (kind.length === 0 || title.length === 0) return null;

  return {
    kind,
    title,
    detail: host.dataset.ctxDetail ?? '',
    href: host.dataset.ctxHref ?? null,
  };
};

export const useHoverContext = (
  debounceMs = 220,
): { context: HoverContext | null; clear: () => void } => {
  const [context, setContext] = useState<HoverContext | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const onPointer = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const next = readContext(target);
      if (!next) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setContext(next), debounceMs);
    };

    document.addEventListener('pointerover', onPointer, { passive: true });
    document.addEventListener('focusin', onPointer);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('pointerover', onPointer);
      document.removeEventListener('focusin', onPointer);
    };
  }, [debounceMs]);

  return { context, clear: () => setContext(null) };
};
