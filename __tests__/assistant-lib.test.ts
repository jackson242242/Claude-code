import {
  ASSISTANT_MODEL,
  FALLBACK_REPLY,
  MAX_HISTORY,
  MAX_MESSAGE_CHARS,
  endsWithUserTurn,
  extractReplyText,
  parseSseTextDelta,
  sanitizeHistory,
} from '@/lib/assistant';

describe('sanitizeHistory', () => {
  it('returns an empty array for non-array input', () => {
    expect(sanitizeHistory(null)).toEqual([]);
    expect(sanitizeHistory('nope')).toEqual([]);
    expect(sanitizeHistory(undefined)).toEqual([]);
  });

  it('drops malformed entries and trims content', () => {
    const out = sanitizeHistory([
      { role: 'user', content: '  hello  ' },
      { role: 'system', content: 'nope' }, // bad role
      { role: 'assistant', content: '' }, // empty after trim
      { role: 'user' }, // missing content
      { role: 'assistant', content: 'hi there' },
      null,
      42,
    ]);
    expect(out).toEqual([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi there' },
    ]);
  });

  it('caps overly long content at MAX_MESSAGE_CHARS', () => {
    const long = 'x'.repeat(MAX_MESSAGE_CHARS + 500);
    const [msg] = sanitizeHistory([{ role: 'user', content: long }]);
    expect(msg.content).toHaveLength(MAX_MESSAGE_CHARS);
  });

  it('keeps only the most recent MAX_HISTORY turns', () => {
    const many = Array.from({ length: MAX_HISTORY + 6 }, (_, i) => ({
      role: 'user' as const,
      content: `m${i}`,
    }));
    const out = sanitizeHistory(many);
    expect(out).toHaveLength(MAX_HISTORY);
    expect(out[0].content).toBe('m6');
  });
});

describe('endsWithUserTurn', () => {
  it('is false for an empty conversation', () => {
    expect(endsWithUserTurn([])).toBe(false);
  });

  it('is false when the last turn is the assistant', () => {
    expect(
      endsWithUserTurn([
        { role: 'user', content: 'a' },
        { role: 'assistant', content: 'b' },
      ]),
    ).toBe(false);
  });

  it('is true when the last turn is the user', () => {
    expect(
      endsWithUserTurn([
        { role: 'assistant', content: 'b' },
        { role: 'user', content: 'a' },
      ]),
    ).toBe(true);
  });
});

describe('extractReplyText', () => {
  it('joins text blocks and ignores non-text blocks', () => {
    expect(
      extractReplyText([
        { type: 'text', text: 'Hello' },
        { type: 'thinking', thinking: 'x' },
        { type: 'text', text: 'world' },
      ]),
    ).toBe('Hello\nworld');
  });

  it('returns an empty string for non-array or text-free content', () => {
    expect(extractReplyText(null)).toBe('');
    expect(extractReplyText([])).toBe('');
    expect(extractReplyText([{ type: 'image' }])).toBe('');
  });
});

describe('parseSseTextDelta', () => {
  it('extracts text from a content_block_delta line', () => {
    expect(
      parseSseTextDelta(
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hi"}}',
      ),
    ).toBe('Hi');
  });

  it('returns null for non-text events, headers, sentinels and bad JSON', () => {
    expect(parseSseTextDelta('event: content_block_delta')).toBeNull();
    expect(parseSseTextDelta('data: {"type":"message_stop"}')).toBeNull();
    expect(
      parseSseTextDelta(
        'data: {"type":"content_block_delta","delta":{"type":"thinking_delta"}}',
      ),
    ).toBeNull();
    expect(parseSseTextDelta('')).toBeNull();
    expect(parseSseTextDelta('data: [DONE]')).toBeNull();
    expect(parseSseTextDelta('data: not json')).toBeNull();
  });
});

describe('constants', () => {
  it('defaults to the opus model and a non-empty fallback', () => {
    expect(ASSISTANT_MODEL).toBe('claude-opus-4-8');
    expect(FALLBACK_REPLY.length).toBeGreaterThan(0);
  });
});
