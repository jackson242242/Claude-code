'use client';

/**
 * ChatWidget — floating AI concierge.
 *
 * A bottom-right launcher that opens a chat panel talking to POST /api/assistant.
 * It also listens for `matchday:ask` window events (dispatched by the
 * ContextNotebook) so "Ask the concierge →" can open the panel pre-filled — a
 * lightweight bridge that needs no global store (per the no-Redux rule).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/types/assistant';

/** Detail shape for the `matchday:ask` bridge event. */
export interface AskEventDetail {
  question: string;
}

export const ASK_EVENT = 'matchday:ask';

const GREETING: ChatMessage = {
  role: 'assistant',
  content:
    "Hi! I'm your Matchday26 concierge. Ask me about host cities, fixtures, or planning your World Cup trip.",
};

const QUICK_REPLIES: readonly string[] = [
  'Which cities host the most matches?',
  'Help me plan a trip to a match',
  'How do I get between stadiums?',
];

const NETWORK_ERROR =
  "Sorry — I couldn't reach the assistant just now. Please try again in a moment.";

/** Replace the final message (the streaming assistant turn) with new content. */
const replaceLastAssistant = (
  messages: ChatMessage[],
  content: string,
): ChatMessage[] => {
  const copy = messages.slice();
  copy[copy.length - 1] = { role: 'assistant', content };
  return copy;
};

export const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  // Mirror messages into a ref so event-driven sends read the latest history.
  const messagesRef = useRef<ChatMessage[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length === 0 || loading) return;

      const next: ChatMessage[] = [
        ...messagesRef.current,
        { role: 'user', content: trimmed },
      ];
      setMessages(next);
      setInput('');
      setLoading(true);

      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messages: next }),
        });

        if (!res.ok) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: NETWORK_ERROR },
          ]);
          return;
        }

        const body = res.body;
        if (body && typeof body.getReader === 'function') {
          // Streaming: render the reply token-by-token as it arrives.
          const reader = body.getReader();
          const decoder = new TextDecoder();
          let acc = '';
          let started = false;
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            acc += decoder.decode(value, { stream: true });
            const current = acc;
            const isFirst = !started;
            started = true;
            setMessages((prev) =>
              isFirst
                ? [...prev, { role: 'assistant', content: current }]
                : replaceLastAssistant(prev, current),
            );
          }
          if (!started) {
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: NETWORK_ERROR },
            ]);
          }
        } else {
          // Non-stream fallback (e.g. a test env with no readable body).
          const text = (await res.text()).trim();
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: text || NETWORK_ERROR },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: NETWORK_ERROR },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  // Bridge: open + ask when another component dispatches `matchday:ask`.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<AskEventDetail>).detail;
      if (detail && typeof detail.question === 'string') {
        setOpen(true);
        void send(detail.question);
      }
    };
    window.addEventListener(ASK_EVENT, handler);
    return () => window.removeEventListener(ASK_EVENT, handler);
  }, [send]);

  // Keep the transcript pinned to the latest message (guarded for jsdom).
  useEffect(() => {
    const el = scrollRef.current;
    if (el && typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight });
    }
  }, [messages, open, loading]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void send(input);
  };

  const showQuickReplies = messages.length <= 1 && !loading;
  // Show the typing dots only until the first streamed token lands (i.e. while
  // the last turn is still the user's); after that the bubble streams in place.
  const awaitingFirstToken =
    loading && messages[messages.length - 1]?.role === 'user';

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open travel assistant"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#0a8f84] text-2xl text-white shadow-[0_16px_48px_rgba(13,22,33,0.24)] transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#0fb5a6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a8f84] motion-reduce:transition-none"
      >
        <span aria-hidden="true">💬</span>
      </button>
    );
  }

  return (
    <section
      aria-label="Travel assistant"
      className="fixed bottom-5 right-5 z-50 flex h-[32rem] max-h-[80vh] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[1.125rem] bg-white text-[#0c1116] shadow-[0_16px_48px_rgba(13,22,33,0.24)]"
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-2 bg-gradient-to-r from-[#0a8f84] to-[#11b3c6] px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-lg">
            ⚽
          </span>
          <div className="leading-tight">
            <p className="m-0 text-sm font-bold">Matchday26 Concierge</p>
            <p className="m-0 text-[0.7rem] text-white/80">
              Sports &amp; travel — here to help
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close travel assistant"
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/90 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </header>

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto bg-[#f6f7f9] px-4 py-4"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
            }
          >
            <p
              className={
                message.role === 'user'
                  ? 'm-0 max-w-[85%] rounded-2xl rounded-br-sm bg-[#0a8f84] px-3.5 py-2 text-sm leading-relaxed text-white'
                  : 'm-0 max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 text-sm leading-relaxed text-[#0c1116] shadow-[0_6px_24px_rgba(13,22,33,0.08)]'
              }
            >
              {message.content}
            </p>
          </div>
        ))}

        {awaitingFirstToken && (
          <div className="flex justify-start" aria-live="polite">
            <p className="m-0 rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 text-sm text-[#646e7a] shadow-[0_6px_24px_rgba(13,22,33,0.08)]">
              <span aria-label="Assistant is typing">Typing…</span>
            </p>
          </div>
        )}

        {showQuickReplies && (
          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => void send(reply)}
                className="rounded-full border border-[#e8ebef] bg-white px-3 py-1.5 text-left text-xs font-semibold text-[#0a8f84] transition-colors hover:bg-[#f0fffe] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a8f84]"
              >
                {reply}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-[#e8ebef] bg-white px-3 py-3"
      >
        <label htmlFor="assistant-input" className="sr-only">
          Ask the travel assistant
        </label>
        <input
          id="assistant-input"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about cities, fixtures, trips…"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-full border border-[#e8ebef] bg-[#f6f7f9] px-4 py-2 text-sm text-[#0c1116] outline-none focus:border-[#0fb5a6] focus:bg-white"
        />
        <button
          type="submit"
          disabled={loading || input.trim().length === 0}
          aria-label="Send message"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#0a8f84] text-white transition-colors hover:bg-[#0fb5a6] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a8f84]"
        >
          <span aria-hidden="true">↑</span>
        </button>
      </form>
    </section>
  );
};
