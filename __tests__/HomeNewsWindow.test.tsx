import { render, screen, fireEvent } from '@testing-library/react';
import { HomeNewsWindow } from '@/components/news/HomeNewsWindow';
import type { NewsItem } from '@/types/news';
import type { TouristVideo } from '@/types/touristVideo';

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
  {
    id: 'n2',
    category: 'video',
    title: 'Canada train under the lights in Toronto',
    summary: 'Final session before kickoff.',
    source: 'Matchday26',
    publishedIso: '2026-06-02T00:00:00Z',
    thumbnailKind: 'coral-to-gold',
    videoSeconds: 48,
    teamName: 'Canada',
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
  it('renders nothing when both streams are empty', () => {
    const { container } = render(
      <HomeNewsWindow videoStories={[]} fanFootage={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows the window heading and both tabs when both streams have content', () => {
    render(
      <HomeNewsWindow videoStories={videoStories} fanFootage={fanFootage} />,
    );
    expect(screen.getByText('Matchday News')).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /National Teams/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Fan Zone/i })).toBeInTheDocument();
  });

  it('defaults to the National Teams rail', () => {
    render(
      <HomeNewsWindow videoStories={videoStories} fanFootage={fanFootage} />,
    );
    expect(
      screen.getByRole('link', { name: /Brazil squad touch down/i }),
    ).toBeInTheDocument();
    // Fan footage is on the other tab, not yet rendered
    expect(
      screen.queryByRole('button', { name: /Mexico City fans/i }),
    ).not.toBeInTheDocument();
  });

  it('switches to the Fan Zone rail and opens the lightbox on a tile click', () => {
    render(
      <HomeNewsWindow videoStories={videoStories} fanFootage={fanFootage} />,
    );

    fireEvent.click(screen.getByRole('tab', { name: /Fan Zone/i }));

    const tile = screen.getByRole('button', { name: /Mexico City fans/i });
    expect(tile).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(tile);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Pexels credit link from the lightbox
    expect(screen.getByRole('link', { name: /Pexels/i })).toHaveAttribute(
      'href',
      'https://www.pexels.com/video/55555',
    );
  });

  it('shows only the Fan Zone tab when there are no team videos', () => {
    render(<HomeNewsWindow videoStories={[]} fanFootage={fanFootage} />);
    expect(
      screen.queryByRole('tab', { name: /National Teams/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Fan Zone/i })).toBeInTheDocument();
    // Fan rail is active by default since it is the only stream
    expect(
      screen.getByRole('button', { name: /Mexico City fans/i }),
    ).toBeInTheDocument();
  });
});
