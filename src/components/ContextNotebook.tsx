'use client';

/**
 * ContextNotebook — the anticipatory "notebook".
 *
 * As the fan hovers cities and fixtures, a small card slides in (bottom-left,
 * opposite the chat launcher) with a relevant, non-intrusive prompt and one or
 * two booking-oriented actions. It never steals focus or blocks the page, and it
 * can be dismissed. Anticipation is heuristic + instant (no per-hover AI calls —
 * that would be slow, costly and privacy-hostile); the "Ask the concierge →"
 * action bridges to the AI ChatWidget via a window event for a deeper answer.
 */

import Link from 'next/link';
import { useState } from 'react';
import { useHoverContext, type HoverContext } from '@/lib/useHoverContext';
import { ASK_EVENT, type AskEventDetail } from '@/components/ChatWidget';

interface NotebookCopy {
  eyebrow: string;
  body: string;
  primaryLabel: string;
  question: string;
}

const buildCopy = (ctx: HoverContext): NotebookCopy => {
  if (ctx.kind === 'city') {
    return {
      eyebrow: 'Heading to this host city?',
      body: ctx.detail
        ? `${ctx.title} — ${ctx.detail}.`
        : `${ctx.title} is a 2026 host city.`,
      primaryLabel: 'Find hotels',
      question: `I'm thinking about going to ${ctx.title} for the World Cup — where should I start?`,
    };
  }
  if (ctx.kind === 'match') {
    return {
      eyebrow: 'Want to be there?',
      body: ctx.detail ? `${ctx.title} · ${ctx.detail}.` : ctx.title,
      primaryLabel: 'Plan this trip',
      question: `Help me plan a trip to see ${ctx.title}.`,
    };
  }
  return {
    eyebrow: 'On your radar',
    body: ctx.detail ? `${ctx.title} — ${ctx.detail}.` : ctx.title,
    primaryLabel: 'Explore',
    question: `Tell me more about ${ctx.title}.`,
  };
};

interface ContextNotebookProps {
  /** Hover debounce in ms; exposed mainly so tests can drop it to 0. */
  debounceMs?: number;
}

export const ContextNotebook = ({ debounceMs = 220 }: ContextNotebookProps) => {
  const { context, clear } = useHoverContext(debounceMs);
  // Title that the fan dismissed — suppressed until a different context appears.
  const [dismissedTitle, setDismissedTitle] = useState<string | null>(null);

  if (!context) return null;
  if (dismissedTitle === context.title) return null;

  const copy = buildCopy(context);

  const askConcierge = () => {
    const detail: AskEventDetail = { question: copy.question };
    window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail }));
    clear();
  };

  return (
    <aside
      aria-label="Suggestions"
      className="fixed bottom-5 left-5 z-40 w-[18rem] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-[1.125rem] border border-[#243042] bg-[#141d2b] text-[#f3f6fa] shadow-[0_16px_48px_rgba(0,0,0,0.5)] motion-safe:animate-[fadeIn_160ms_ease-out]"
    >
      <div className="flex items-start justify-between gap-2 px-4 pt-3">
        <p className="m-0 text-[0.66rem] font-bold uppercase tracking-widest text-[#3d8bff]">
          {copy.eyebrow}
        </p>
        <button
          type="button"
          onClick={() => setDismissedTitle(context.title)}
          aria-label="Dismiss suggestion"
          className="-mr-1 -mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-[#8a97a8] hover:bg-[#1b2636] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3d8bff]"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <p className="m-0 px-4 pb-3 pt-1 text-sm font-medium leading-snug">
        {copy.body}
      </p>

      <div className="flex items-center gap-2 border-t border-[#243042] px-4 py-2.5">
        {context.href && (
          <Link
            href={context.href}
            className="rounded-lg bg-[#3d8bff] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#5a9dff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3d8bff]"
          >
            {copy.primaryLabel}
          </Link>
        )}
        <button
          type="button"
          onClick={askConcierge}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#3d8bff] underline underline-offset-2 hover:text-[#5a9dff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3d8bff]"
        >
          Ask the concierge →
        </button>
      </div>
    </aside>
  );
};
