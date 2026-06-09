/**
 * Pure, network-free helpers + constants for the AI concierge.
 *
 * The route handler (src/app/api/assistant/route.ts) is a thin shell over these
 * functions so the sanitisation / reply-parsing logic can be unit-tested without
 * a live Anthropic call or a Request/Response polyfill.
 */

import type { AssistantHealth, ChatMessage } from '@/types/assistant';

// ---------------------------------------------------------------------------
// Anthropic Messages API config (called via native fetch — no SDK dependency)
// ---------------------------------------------------------------------------

/**
 * Default model — Haiku 4.5: fastest + cheapest tier ($1 / $5 per 1M tokens)
 * and plenty for a travel concierge. One-line swaps for more capability:
 *   'claude-sonnet-4-6' — $3 / $15 per 1M, mid-tier
 *   'claude-opus-4-8'   — $5 / $25 per 1M, most capable
 * For cross-vendor / open-source cheaper options, see docs/chatbot-model-options.md.
 */
export const ASSISTANT_MODEL = 'claude-haiku-4-5';
export const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_VERSION = '2023-06-01';

export const MAX_HISTORY = 12;
export const MAX_TOKENS = 600;
export const MAX_MESSAGE_CHARS = 2000;

/** Served when ANTHROPIC_API_KEY is absent, or as a last-resort safety net. */
export const FALLBACK_REPLY =
  "I'm your Matchday26 travel concierge — ask me about host cities, fixtures, " +
  'or planning a trip around the matches you want to attend. ' +
  '(Live AI replies switch on once the assistant key is configured.)';

/**
 * System prompt — sports + travel only, honest, conversion-aware but never
 * pushy or fabricated (see marketing/engagement-crm.md for the ethics charter).
 */
export const SYSTEM_PROMPT = [
  'You are the "Matchday26 Concierge", a warm, knowledgeable travel companion',
  'for fans attending the 2026 FIFA World Cup across the USA, Canada and Mexico.',
  '',
  'Tone: kind, warm and welcoming, but straight to the point. Lead with the answer',
  'in one or two short sentences, then at most one helpful next step. Keep replies',
  'under ~70 words unless more detail is asked for. No filler, no over-apologising —',
  'just genuinely helpful, friendly service.',
  '',
  'Scope: football/soccer and the logistics of attending matches — host cities,',
  'fixtures, stadiums, getting around, where to stay, and trip planning. Politely',
  'decline anything outside sport + travel (politics, legal, medical, betting) and',
  'offer what you can help with instead.',
  '',
  'Honesty (non-negotiable): never invent match results, scores, exact prices,',
  'availability, or guarantees. If you are unsure, say so plainly and point to where',
  'in the app to check (Schedule, Hotels, Flights, Transport). When a fan is ready',
  'to go, warmly guide them to the right booking step — never pushy, never fake urgency.',
].join('\n');

// ---------------------------------------------------------------------------
// Request sanitisation
// ---------------------------------------------------------------------------

const isChatRole = (value: unknown): value is ChatMessage['role'] =>
  value === 'user' || value === 'assistant';

/**
 * Coerce arbitrary request input into a safe, capped list of chat messages:
 * drops malformed entries, trims, enforces a per-message length cap, and keeps
 * only the most recent MAX_HISTORY turns.
 */
export const sanitizeHistory = (input: unknown): ChatMessage[] => {
  if (!Array.isArray(input)) return [];

  const cleaned: ChatMessage[] = [];
  for (const entry of input) {
    if (entry == null || typeof entry !== 'object') continue;
    const { role, content } = entry as { role?: unknown; content?: unknown };
    if (!isChatRole(role) || typeof content !== 'string') continue;
    const trimmed = content.trim();
    if (trimmed.length === 0) continue;
    cleaned.push({ role, content: trimmed.slice(0, MAX_MESSAGE_CHARS) });
  }

  return cleaned.slice(-MAX_HISTORY);
};

/** A valid turn must end with the user speaking. */
export const endsWithUserTurn = (messages: ChatMessage[]): boolean =>
  messages.length > 0 && messages[messages.length - 1].role === 'user';

// ---------------------------------------------------------------------------
// Health probe
// ---------------------------------------------------------------------------

/**
 * Build the safe health payload for GET /api/assistant. Reports whether the key
 * is configured and which model is wired — never the key value itself.
 */
export const buildHealth = (hasKey: boolean): AssistantHealth => ({
  configured: hasKey,
  model: ASSISTANT_MODEL,
});

// ---------------------------------------------------------------------------
// Response parsing
// ---------------------------------------------------------------------------

interface AnthropicTextBlock {
  type: string;
  text?: string;
}

const isTextBlock = (block: unknown): block is AnthropicTextBlock =>
  block != null &&
  typeof block === 'object' &&
  (block as AnthropicTextBlock).type === 'text' &&
  typeof (block as AnthropicTextBlock).text === 'string';

/** Concatenate the text blocks from an Anthropic Messages API `content` array. */
export const extractReplyText = (content: unknown): string => {
  if (!Array.isArray(content)) return '';
  return content
    .filter(isTextBlock)
    .map((block) => block.text as string)
    .join('\n')
    .trim();
};

// ---------------------------------------------------------------------------
// Streaming (SSE) parsing
// ---------------------------------------------------------------------------

interface AnthropicStreamEvent {
  type?: string;
  delta?: { type?: string; text?: string };
}

/**
 * Parse one line of the Anthropic SSE stream. Returns the text fragment for a
 * `content_block_delta` of type `text_delta`, or null for everything else
 * (event headers, pings, non-text deltas, blanks, `[DONE]`, malformed JSON).
 */
export const parseSseTextDelta = (line: string): string | null => {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return null;
  const payload = trimmed.slice('data:'.length).trim();
  if (payload === '' || payload === '[DONE]') return null;
  try {
    const event = JSON.parse(payload) as AnthropicStreamEvent;
    if (
      event.type === 'content_block_delta' &&
      event.delta?.type === 'text_delta' &&
      typeof event.delta.text === 'string'
    ) {
      return event.delta.text;
    }
  } catch {
    return null;
  }
  return null;
};
