import { render, screen } from '@testing-library/react';
import { VideoStoryCard } from '@/components/news/VideoStoryCard';
import type { NewsItem } from '@/types/news';

const baseItem: Omit<NewsItem, 'id' | 'category' | 'title'> = {
  summary: 'Summary',
  source: 'FIFA',
  publishedIso: '2026-07-06T12:00:00Z',
  thumbnailKind: 'teal-to-turquoise',
};

const videoItem: NewsItem = {
  ...baseItem,
  id: 'v1',
  category: 'video',
  title: 'Top 10 goals',
  videoSeconds: 95,
};

const articleItem: NewsItem = {
  ...baseItem,
  id: 'live-abc',
  category: 'team',
  title: 'Quarter-final preview',
  url: 'https://example.com/story',
};

describe('VideoStoryCard', () => {
  it('gives real videos video affordances (Watch label, progress bar)', () => {
    render(<VideoStoryCard item={videoItem} />);
    expect(
      screen.getByRole('link', { name: 'Watch: Top 10 goals' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Muted')).toBeInTheDocument();
    expect(screen.getByText('1:35')).toBeInTheDocument();
  });

  it('renders live articles honestly — no play/progress affordances', () => {
    render(<VideoStoryCard item={articleItem} />);
    const link = screen.getByRole('link', {
      name: 'Read: Quarter-final preview',
    });
    expect(link).toHaveAttribute('href', 'https://example.com/story');
    // An article must not pretend to be a playable video.
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText('Muted')).not.toBeInTheDocument();
    expect(screen.getByText(/News/i)).toBeInTheDocument();
    expect(screen.getByText(/FIFA/)).toBeInTheDocument();
  });
});
