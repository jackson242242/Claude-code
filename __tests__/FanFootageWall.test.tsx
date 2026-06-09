import { render, screen, fireEvent } from '@testing-library/react';
import { FanFootageWall } from '@/components/news/FanFootageWall';
import type { TouristVideo } from '@/types/touristVideo';

/* ------------------------------------------------------------------ */
/* Sample fixtures                                                       */
/* ------------------------------------------------------------------ */
const sampleVideos: TouristVideo[] = [
  {
    id: 'vid-01',
    title: 'Dallas fans celebrate after the final whistle',
    cityId: 'dallas',
    query: 'Dallas World Cup fan footage',
    posterUrl: null,
    videoUrl: null,
    durationSeconds: 93,
    sourceName: 'Pexels',
    sourceUrl: 'https://www.pexels.com/video/12345',
    author: 'Jane Smith',
    thumbnailKind: 'teal-to-turquoise',
  },
  {
    id: 'vid-02',
    title: 'New York City march to the stadium',
    cityId: 'new-york',
    query: 'NYC World Cup march',
    posterUrl: null,
    videoUrl: 'https://example.com/video.mp4',
    durationSeconds: 47,
    sourceName: 'Matchday26',
    sourceUrl: 'https://matchday26.app/footage/vid-02',
    author: null,
    thumbnailKind: 'coral-to-gold',
  },
];

/* ------------------------------------------------------------------ */
/* Tests                                                                 */
/* ------------------------------------------------------------------ */
describe('FanFootageWall', () => {
  it('renders a tile for each supplied video', () => {
    render(<FanFootageWall videos={sampleVideos} />);
    // Each tile has aria-label="Watch: <title>"
    expect(
      screen.getByRole('button', {
        name: /Dallas fans celebrate/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /New York City march/i,
      }),
    ).toBeInTheDocument();
  });

  it('renders nothing when the videos array is empty', () => {
    const { container } = render(<FanFootageWall videos={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the section heading', () => {
    render(<FanFootageWall videos={sampleVideos} />);
    expect(
      screen.getByText('Fan footage from the host cities'),
    ).toBeInTheDocument();
  });

  it('does not render the lightbox initially', () => {
    render(<FanFootageWall videos={sampleVideos} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the lightbox when a tile is clicked — title appears', () => {
    render(<FanFootageWall videos={sampleVideos} />);

    const tile = screen.getByRole('button', {
      name: /Dallas fans celebrate/i,
    });
    fireEvent.click(tile);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // The title appears in both the tile overlay and the lightbox heading
    const matches = screen.getAllByText('Dallas fans celebrate after the final whistle');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('opens the lightbox when a tile is clicked — credit line appears', () => {
    render(<FanFootageWall videos={sampleVideos} />);

    fireEvent.click(
      screen.getByRole('button', { name: /Dallas fans celebrate/i }),
    );

    // "via Pexels" link
    const creditLink = screen.getByRole('link', { name: /Pexels/i });
    expect(creditLink).toBeInTheDocument();
    expect(creditLink).toHaveAttribute(
      'href',
      'https://www.pexels.com/video/12345',
    );
  });

  it('closes the lightbox when ESC is pressed', () => {
    render(<FanFootageWall videos={sampleVideos} />);

    fireEvent.click(
      screen.getByRole('button', { name: /Dallas fans celebrate/i }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('dialog').parentElement!, {
      key: 'Escape',
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the lightbox when the close button is clicked', () => {
    render(<FanFootageWall videos={sampleVideos} />);

    fireEvent.click(
      screen.getByRole('button', { name: /Dallas fans celebrate/i }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Close video/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows author name when present', () => {
    render(<FanFootageWall videos={sampleVideos} />);

    fireEvent.click(
      screen.getByRole('button', { name: /Dallas fans celebrate/i }),
    );

    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
  });

  it('opens a different video when a different tile is clicked', () => {
    render(<FanFootageWall videos={sampleVideos} />);

    fireEvent.click(
      screen.getByRole('button', { name: /New York City march/i }),
    );

    // The title appears in the tile overlay and the lightbox heading — either is fine
    const matches = screen.getAllByText('New York City march to the stadium');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    // Matchday26 credit
    expect(screen.getByRole('link', { name: /Matchday26/i })).toBeInTheDocument();
  });
});
