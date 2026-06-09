import { render, screen } from '@testing-library/react';
import { NewsCard } from '@/components/news/NewsCard';
import type { NewsItem } from '@/types/news';

const item: NewsItem = {
  id: 'test-01',
  category: 'schedule',
  title: 'Group Stage Fixtures Announced',
  summary: 'The full group stage schedule has been confirmed across all 16 host cities.',
  source: 'Matchday26',
  publishedIso: '2026-06-07T14:30:00Z',
  thumbnailKind: 'teal-to-turquoise',
  minutesRead: 4,
};

describe('NewsCard (grid variant)', () => {
  it('renders the article title', () => {
    render(<NewsCard item={item} variant="grid" />);
    expect(screen.getByText('Group Stage Fixtures Announced')).toBeInTheDocument();
  });

  it('renders the source', () => {
    render(<NewsCard item={item} variant="grid" />);
    expect(screen.getByText(/Matchday26/)).toBeInTheDocument();
  });

  it('renders the minutes read', () => {
    render(<NewsCard item={item} variant="grid" />);
    expect(screen.getByText(/4 min read/)).toBeInTheDocument();
  });

  it('renders the category badge', () => {
    render(<NewsCard item={item} variant="grid" />);
    expect(screen.getByText('Schedule')).toBeInTheDocument();
  });
});

describe('NewsCard (list variant)', () => {
  it('renders the article title in list mode', () => {
    render(<NewsCard item={item} variant="list" />);
    expect(screen.getByText('Group Stage Fixtures Announced')).toBeInTheDocument();
  });

  it('renders the source in list mode', () => {
    render(<NewsCard item={item} variant="list" />);
    expect(screen.getByText(/Matchday26/)).toBeInTheDocument();
  });
});
