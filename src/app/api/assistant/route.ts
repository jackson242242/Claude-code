/**
 * POST /api/assistant — Matchday26 AI concierge (streaming).
 *
 * Calls the Anthropic Messages API via native fetch (no SDK dependency) with
 * `stream: true` and pipes the text deltas straight back to the client as a
 * text/plain stream, so replies render token-by-token. Degrades gracefully:
 * with no ANTHROPIC_API_KEY (or any upstream error) it returns the honest
 * fallback line instead of failing. Testable logic lives in src/lib/assistant.ts.
 */

import { NextResponse } from 'next/server';
import type { AssistantResponse } from '@/types/assistant';
import {
  ANTHROPIC_URL,
  ANTHROPIC_VERSION,
  ASSISTANT_MODEL,
  FALLBACK_REPLY,
  MAX_TOKENS,
  SYSTEM_PROMPT,
  endsWithUserTurn,
  parseSseTextDelta,
  sanitizeHistory,
} from '@/lib/assistant';

export const dynamic = 'force-dynamic';

const TEXT_HEADERS = {
  'content-type': 'text/plain; charset=utf-8',
  'cache-control': 'no-store',
};

const textResponse = (body: string): Response =>
  new Response(body, { status: 200, headers: TEXT_HEADERS });

const jsonError = (
  message: string,
  type: string,
  status: number,
): NextResponse<AssistantResponse> =>
  NextResponse.json({ error: { message, type } }, { status });

export const POST = async (req: Request): Promise<Response> => {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 'invalid_request', 400);
  }

  const messages = sanitizeHistory(
    (payload as { messages?: unknown } | null)?.messages,
  );
  if (!endsWithUserTurn(messages)) {
    return jsonError(
      'Expected a non-empty conversation ending in a user message',
      'invalid_request',
      400,
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No key configured yet — serve the honest fallback rather than failing.
    return textResponse(FALLBACK_REPLY);
  }

  let upstream: Response;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ASSISTANT_MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        stream: true,
        messages,
      }),
    });
  } catch {
    return textResponse(FALLBACK_REPLY);
  }

  if (!upstream.ok || upstream.body == null) {
    return textResponse(FALLBACK_REPLY);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await reader.read();
        if (done) {
          const tail = parseSseTextDelta(buffer);
          if (tail) controller.enqueue(encoder.encode(tail));
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const text = parseSseTextDelta(line);
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch {
        controller.close();
      }
    },
    cancel() {
      void reader.cancel();
    },
  });

  return new Response(stream, { status: 200, headers: TEXT_HEADERS });
};
