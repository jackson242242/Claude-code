import { render, screen, fireEvent } from '@testing-library/react';
import { HomeNewsWindow } from '@/components/news/HomeNewsWindow';
import type { NewsItem } from '@/types/news';
import type { TouristVideo } from '@/types/touristVideo';
import type { SuperstarVideo } from '@/mocks/superstars';

const superstars: SuperstarVideo[] = [
  {
    id: 's1',
    name: 'Cristiano Ronaldo',
    nation: 'Portugal',
    flag: '🇵🇹',
    blurb: 'Goals & skills',
    watchUrl: 'https://www.youtube.com/results?search_query=Cristiano+Ronaldo',
    thumbnailKind: 'coral-to-gold',
  },
  {
    id: 's2',
    name: 'Kylian Mbappé',
    nation: 'France',
    flag: '🇫🇷',
    blurb: 'Pace & finishing',
    watchUrl: 'https://www.youtube.com/results?search_query=Kylian+Mbappe',
    thumbnailKind: 'grape-to-turquoise',
  },
];

const videoStories: NewsItem[] = [
  {
    id: 'n1',
    category: 'video',
    title: 'Brazil squad touch down in Miami',
    summary: 'The Seleção arrive ahead of their group opener.',
    source: 'Matchday26',
    publishedIso: '2026-06-01T00:00:00Z',
    thumbnailKind: 'teal-to-turquoise',
    videoSeconds: 65,
    teamName: 'Brazil',
  },
];

const fanFootage: TouristVideo[] = [
  {
    id: 'f1',
    title: 'Mexico City fans fill the plaza',
    cityId: 'mexico-city',
    query: 'soccer fans mexico city',
    posterUrl: null,
    videoUrl: null,
    durationSeconds: 90,
    sourceName: 'Pexels',
    sourceUrl: 'https://www.pexels.com/video/55555',
    author: 'Ana Lopez',
    thumbnailKind: 'teal-to-turquoise',
  },
];

describe('HomeNewsWindow', () => {
  it('renders nothing when every stream is empty', () => {
    const { container } = render(
      <HomeNewsWindow superstars={[]} videoStories={[]} fanFootage={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows the heading and all three tabs', () => {
    render(
      <HomeNewsWindow
        superstars={superstars}
        videoStories={videoStories}
        fanFootage={fanFootage}
      />,
    );
    expect(screen.getByText('Matchday News')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Superstars/i })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /Latest/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Fan Zone/i })).toBeInTheDocument();
  });

  it('defaults to Superstars and renders external YouTube links (new tab)', () => {
    render(
      <HomeNewsWindow
        superstars={superstars}
        videoStories={videoStories}
        fanFootage={fanFootage}
      />,
    );
    const link = screen.getByRole('link', { name: /Cristiano Ronaldo/i });
    expect(link).toHaveAttribute(
      'href',
      'https://www.youtube.com/results?search_query=Cristiano+Ronaldo',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    // Other streams are not rendered until their tab is selected
    expect(
      screen.queryByRole('link', { name: /Brazil squad touch down/i }),
    ).not.toBeInTheDocument();
  });

  it('switches to the Fan Zone rail and opens the lightbox on a tile click', () => {
    render(
      <HomeNewsWindow
        superstars={superstars}
        videoStories={videoStories}
        fanFootage={fanFootage}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: /Fan Zone/i }));

    const tile = screen.getByRole('button', { name: /Mexico City fans/i });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(tile);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Pexels/i })).toHaveAttribute(
      'href',
      'https://www.pexels.com/video/55555',
    );
  });

  it('falls back to another tab when there are no superstars', () => {
    render(
      <HomeNewsWindow
        superstars={[]}
        videoStories={videoStories}
        fanFootage={fanFootage}
      />,
    );
    expect(
      screen.queryByRole('tab', { name: /Superstars/i }),
    ).not.toBeInTheDocument();
    // Defaults to the Latest rail
    expect(
      screen.getByRole('link', { name: /Brazil squad touch down/i }),
    ).toBeInTheDocument();
  });
});
