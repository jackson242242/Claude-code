import { getLiveNews, parseRss } from '@/services/newsService';

const SAMPLE_RSS_MANY = `<rss version="2.0"><channel>
  <item><title>Story one</title><link>https://example.com/1</link><description>One</description><pubDate>Tue, 10 Jun 2026 10:00:00 GMT</pubDate></item>
  <item><title>Story two</title><link>https://example.com/2</link><description>Two</description><pubDate>Tue, 10 Jun 2026 11:00:00 GMT</pubDate></item>
  <item><title>Story three</title><link>https://example.com/3</link><description>Three</description><pubDate>Tue, 10 Jun 2026 12:00:00 GMT</pubDate></item>
  <item><title>Story four</title><link>https://example.com/4</link><description>Four</description><pubDate>Tue, 10 Jun 2026 13:00:00 GMT</pubDate></item>
</channel></rss>`;

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Football | The Guardian</title>
    <item>
      <title><![CDATA[Mbappé hat-trick sinks rivals as France cruise]]></title>
      <link>https://www.theguardian.com/football/2026/jun/10/france-mbappe</link>
      <description><![CDATA[<p>Kylian Mbappé scored three as France <b>won</b> 4-0.</p>]]></description>
      <pubDate>Tue, 10 Jun 2026 19:30:00 GMT</pubDate>
      <guid>https://www.theguardian.com/football/2026/jun/10/france-mbappe</guid>
    </item>
    <item>
      <title>Canada name squad for home World Cup</title>
      <link>https://www.theguardian.com/football/2026/jun/09/canada-squad</link>
      <description>Alphonso Davies headlines the 26-man group.</description>
      <pubDate>Mon, 09 Jun 2026 09:00:00 GMT</pubDate>
    </item>
    <item>
      <title>No link should be skipped</title>
      <description>This item has no link and must be dropped.</description>
    </item>
  </channel>
</rss>`;

describe('parseRss', () => {
  it('parses RSS items into NewsItems, decoding CDATA + entities and stripping HTML', () => {
    const items = parseRss(SAMPLE_RSS, 'The Guardian');
    expect(items).toHaveLength(2); // the link-less item is dropped

    const [first] = items;
    expect(first.title).toBe('Mbappé hat-trick sinks rivals as France cruise');
    expect(first.url).toBe(
      'https://www.theguardian.com/football/2026/jun/10/france-mbappe',
    );
    expect(first.source).toBe('The Guardian');
    // HTML stripped from the summary
    expect(first.summary).toBe('Kylian Mbappé scored three as France won 4-0.');
    expect(first.summary).not.toContain('<');
    // Valid ISO date parsed from pubDate
    expect(first.publishedIso).toBe('2026-06-10T19:30:00.000Z');
    // Stable, prefixed id
    expect(first.id).toMatch(/^live-/);
  });

  it('is deterministic (same input → same ids/order)', () => {
    expect(parseRss(SAMPLE_RSS, 'The Guardian')).toEqual(
      parseRss(SAMPLE_RSS, 'The Guardian'),
    );
  });

  it('caps the number of items and returns [] for non-feed input', () => {
    expect(parseRss(SAMPLE_RSS, 'The Guardian', 1)).toHaveLength(1);
    expect(parseRss('not xml at all', 'X')).toEqual([]);
    expect(parseRss('', 'X')).toEqual([]);
  });
});

describe('getLiveNews', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  it('returns live items + source name when a feed answers', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, text: async () => SAMPLE_RSS_MANY }) as unknown as typeof fetch;

    const res = await getLiveNews('en');
    expect(res.live).toBe(true);
    expect(res.source).toBe('The Guardian'); // first English feed
    expect(res.items[0].url).toBe('https://example.com/1');
    // Curated video stories are appended after the live articles.
    expect(res.items.some((i) => i.category === 'video')).toBe(true);
  });

  it('falls back to the seed (live=false) when every feed fails', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('blocked')) as unknown as typeof fetch;

    const res = await getLiveNews('en');
    expect(res.live).toBe(false);
    expect(res.source).toBeNull();
    expect(res.items.length).toBeGreaterThan(0); // the static seed
  });

  it('tries the locale feed before the English fallback (es → Marca first)', async () => {
    const calls: string[] = [];
    global.fetch = jest.fn().mockImplementation((url: string) => {
      calls.push(String(url));
      return Promise.resolve({ ok: true, text: async () => SAMPLE_RSS_MANY });
    }) as unknown as typeof fetch;

    const res = await getLiveNews('es');
    expect(res.source).toBe('Marca');
    expect(calls[0]).toContain('marca');
  });
});
