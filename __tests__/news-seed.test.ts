import { NEWS_ITEMS, PLAYER_SPOTLIGHTS, TEAM_BRIEFS } from '@/mocks/news';
import type { NewsCategory } from '@/types/news';

const VALID_CATEGORIES: NewsCategory[] = ['team', 'player', 'schedule', 'city', 'video'];

describe('News seed data integrity', () => {
  it('has at least 10 news items', () => {
    expect(NEWS_ITEMS.length).toBeGreaterThanOrEqual(10);
  });

  it('every news item has a non-empty title', () => {
    NEWS_ITEMS.forEach((item) => {
      expect(item.title.trim()).not.toBe('');
    });
  });

  it('every news item has a non-empty summary', () => {
    NEWS_ITEMS.forEach((item) => {
      expect(item.summary.trim()).not.toBe('');
    });
  });

  it('every news item has a non-empty source', () => {
    NEWS_ITEMS.forEach((item) => {
      expect(item.source.trim()).not.toBe('');
    });
  });

  it('every news item has a valid category', () => {
    NEWS_ITEMS.forEach((item) => {
      expect(VALID_CATEGORIES).toContain(item.category);
    });
  });

  it('every news item has a non-empty id', () => {
    NEWS_ITEMS.forEach((item) => {
      expect(item.id.trim()).not.toBe('');
    });
  });

  it('news item ids are unique', () => {
    const ids = NEWS_ITEMS.map((item) => item.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('video items have videoSeconds defined', () => {
    const videoItems = NEWS_ITEMS.filter((item) => item.category === 'video');
    expect(videoItems.length).toBeGreaterThan(0);
    videoItems.forEach((item) => {
      expect(typeof item.videoSeconds).toBe('number');
    });
  });

  it('has at least 3 player spotlights', () => {
    expect(PLAYER_SPOTLIGHTS.length).toBeGreaterThanOrEqual(3);
  });

  it('every player spotlight has non-empty name and description', () => {
    PLAYER_SPOTLIGHTS.forEach((p) => {
      expect(p.name.trim()).not.toBe('');
      expect(p.description.trim()).not.toBe('');
    });
  });

  it('has at least 6 team briefs', () => {
    expect(TEAM_BRIEFS.length).toBeGreaterThanOrEqual(6);
  });

  it('team briefs have valid W/D/L numbers', () => {
    TEAM_BRIEFS.forEach((team) => {
      expect(typeof team.wins).toBe('number');
      expect(typeof team.draws).toBe('number');
      expect(typeof team.losses).toBe('number');
      expect(team.wins).toBeGreaterThanOrEqual(0);
      expect(team.draws).toBeGreaterThanOrEqual(0);
      expect(team.losses).toBeGreaterThanOrEqual(0);
    });
  });
});
