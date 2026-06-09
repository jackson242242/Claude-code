import { render } from '@testing-library/react';
import { HeroVideoBackground } from '@/components/HeroVideoBackground';
import type { TouristVideo } from '@/types/touristVideo';

const makeVideo = (over: Partial<TouristVideo>): TouristVideo => ({
  id: 'h1',
  title: 'Soccer Player Skills',
  cityId: null,
  query: 'soccer player skills',
  posterUrl: null,
  videoUrl: null,
  durationSeconds: 12,
  sourceName: 'Pexels',
  sourceUrl: 'https://www.pexels.com/video/1',
  author: 'A. Creator',
  thumbnailKind: 'teal-to-turquoise',
  ...over,
});

// jsdom doesn't implement media playback — stub it so the ambient effects are
// inert (and the console stays quiet) while still rendering the elements.
beforeAll(() => {
  Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: jest.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
    configurable: true,
    value: jest.fn(),
  });
});

describe('HeroVideoBackground', () => {
  it('falls back to a gradient (no media element) when there are no clips', () => {
    const { container } = render(<HeroVideoBackground videos={[]} />);
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    // Always renders the decorative background container
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('shows a static poster (no video) when a clip has a poster but no videoUrl', () => {
    const videos = [
      makeVideo({ posterUrl: 'https://img.example/poster.jpg', videoUrl: null }),
    ];
    const { container } = render(<HeroVideoBackground videos={videos} />);
    expect(container.querySelector('video')).toBeNull();
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', 'https://img.example/poster.jpg');
  });

  it('plays the clip via a muted, inline <video> when a videoUrl is present', () => {
    const videos = [
      makeVideo({
        videoUrl: 'https://video.example/clip.mp4',
        posterUrl: 'https://img.example/poster.jpg',
      }),
    ];
    const { container } = render(<HeroVideoBackground videos={videos} />);
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute('src', 'https://video.example/clip.mp4');
    // Muted + inline are required for autoplay and courtesy
    expect((video as HTMLVideoElement).muted).toBe(true);
    expect(video).toHaveAttribute('playsInline');
  });
});
