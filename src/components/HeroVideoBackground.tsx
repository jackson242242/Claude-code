'use client';

/**
 * HeroVideoBackground — cinematic, ambient football-action montage behind the
 * landing hero.
 *
 * Plays muted, license-safe Pexels clips (skills / training / stadium nights /
 * celebrations / fans), auto-advancing through them so it never feels like one
 * loop. Responsible by construction:
 *   - poster-first (doesn't block LCP), gradient fallback when no clips/key;
 *   - prefers-reduced-motion & Save-Data → static poster, no playback;
 *   - pauses when the hero scrolls offscreen or the tab is hidden;
 *   - a dark scrim keeps the hero text WCAG-AA legible over any frame.
 * Decorative only (aria-hidden) — the hero text carries all meaning.
 */

import { useEffect, useRef, useState } from 'react';
import type { TouristVideo } from '@/types/touristVideo';

const SCRIM =
  'linear-gradient(180deg, rgba(8,10,15,0.55) 0%, rgba(8,10,15,0.72) 55%, rgba(8,10,15,0.88) 100%)';
const BRAND_TINT =
  'radial-gradient(ellipse 85% 65% at 82% -5%, rgba(230,14,123,0.22), transparent 60%), radial-gradient(ellipse 70% 60% at 5% 110%, rgba(6,182,212,0.18), transparent 60%)';

interface HeroVideoBackgroundProps {
  videos: TouristVideo[];
}

export const HeroVideoBackground = ({ videos }: HeroVideoBackgroundProps) => {
  const clips = videos.filter((v) => v.videoUrl != null);
  const firstPoster = videos.map((v) => v.posterUrl).find((p) => p != null) ?? null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const [enabled, setEnabled] = useState(false);

  // Decide whether to play at all (client-only: motion + data preferences).
  useEffect(() => {
    if (clips.length === 0) return;
    const reduce =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const conn = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (!reduce && conn?.saveData !== true) setEnabled(true);
  }, [clips.length]);

  // Load + play whenever the active clip changes.
  useEffect(() => {
    if (!enabled) return;
    const el = videoRef.current;
    if (el == null) return;
    try {
      el.load();
      const p = el.play();
      if (p != null && typeof p.then === 'function') p.catch(() => {});
    } catch {
      /* media not ready / unsupported (e.g. jsdom) */
    }
  }, [index, enabled]);

  // Pause when the tab is hidden or the hero scrolls offscreen.
  useEffect(() => {
    if (!enabled) return;
    const el = videoRef.current;
    if (el == null) return;

    const safePlay = () => {
      try {
        const p = el.play();
        if (p != null && typeof p.then === 'function') p.catch(() => {});
      } catch {
        /* noop */
      }
    };
    const safePause = () => {
      try {
        el.pause();
      } catch {
        /* noop */
      }
    };

    const onVisibility = () => (document.hidden ? safePause() : safePlay());
    document.addEventListener('visibilitychange', onVisibility);

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry == null) return;
          if (entry.isIntersecting) safePlay();
          else safePause();
        },
        { threshold: 0.05 },
      );
      observer.observe(el);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
    };
  }, [enabled]);

  const activeClip = clips[index];

  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
    >
      {/* Media layer: video → poster → gradient */}
      {enabled && activeClip != null ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={activeClip.videoUrl ?? undefined}
          poster={activeClip.posterUrl ?? firstPoster ?? undefined}
          muted
          playsInline
          autoPlay
          preload="metadata"
          onEnded={() => setIndex((i) => (i + 1) % clips.length)}
        />
      ) : firstPoster != null ? (
        <img
          src={firstPoster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: 'var(--gradient-festival)' }}
        />
      )}

      {/* Scrim for text legibility */}
      <div className="absolute inset-0" style={{ background: SCRIM }} />
      {/* Subtle brand colour haze */}
      <div className="absolute inset-0" style={{ background: BRAND_TINT }} />
    </div>
  );
};
