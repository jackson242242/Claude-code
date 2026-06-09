'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { TouristVideo, ThumbnailKind } from '@/types/touristVideo';

/* ------------------------------------------------------------------ */
/* Gradient map                                                         */
/* ------------------------------------------------------------------ */
const GRADIENT_MAP: Record<ThumbnailKind, string> = {
  'teal-to-turquoise': 'from-[#0a8f84] to-[#11b3c6]',
  'grape-to-turquoise': 'from-[#7c5cff] to-[#11b3c6]',
  'coral-to-gold': 'from-[#ff5d52] to-[#e0a82e]',
  'citrus-to-teal': 'from-[#7fb800] to-[#0a8f84]',
};

interface VideoLightboxProps {
  video: TouristVideo;
  onClose: () => void;
}

export const VideoLightbox = ({ video, onClose }: VideoLightboxProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const gradient = GRADIENT_MAP[video.thumbnailKind];

  /* ---- Scroll lock ------------------------------------------- */
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  /* ---- Focus management ------------------------------------- */
  useEffect(() => {
    // Move focus to close button when opened
    closeButtonRef.current?.focus();
  }, []);

  /* ---- Focus trap ------------------------------------------- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (dialog == null) return;

      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelectors),
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  /* ---- Backdrop click --------------------------------------- */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm motion-reduce:backdrop-blur-none"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      aria-hidden="false"
    >
      {/* Modal panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Video: ${video.title}`}
        className="relative w-full max-w-2xl bg-[#ffffff] rounded-[1.125rem] shadow-[0_24px_64px_rgba(13,22,33,0.22)] overflow-hidden flex flex-col"
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-[#0fb5a6] focus-visible:outline-offset-2 transition-colors duration-150 motion-reduce:transition-none"
        >
          {/* × icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 2l12 12M14 2L2 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Video or poster area */}
        <div className="w-full" style={{ aspectRatio: '16/9' }}>
          {video.videoUrl != null ? (
            <video
              className="w-full h-full object-cover"
              controls
              autoPlay
              muted
              playsInline
              poster={video.posterUrl ?? undefined}
              aria-label={video.title}
            >
              <source src={video.videoUrl} />
              Your browser does not support HTML video.
            </video>
          ) : (
            /* Gradient placeholder + honest note */
            <div
              className={`w-full h-full bg-gradient-to-br ${gradient} relative flex items-center justify-center`}
            >
              {video.posterUrl != null && (
                <img
                  src={video.posterUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div
                className="absolute inset-0 bg-black/40 flex items-center justify-center px-6 text-center"
                aria-hidden={video.posterUrl != null ? 'true' : undefined}
              >
                <p className="text-white text-sm font-medium leading-snug max-w-xs">
                  Live footage appears once a free source is connected.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="px-5 py-4 flex flex-col gap-2 bg-[#ffffff]">
          <h2 className="text-[#0c1116] font-bold text-base leading-snug m-0 pr-8">
            {video.title}
          </h2>

          {video.author != null && (
            <p className="text-[#646e7a] text-sm m-0">
              By {video.author}
            </p>
          )}

          {/* Attribution / credit line — required for Pexels licence */}
          <p className="text-[#646e7a] text-xs m-0">
            via{' '}
            <a
              href={video.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0a8f84] underline underline-offset-2 hover:text-[#0fb5a6] focus-visible:outline-2 focus-visible:outline-[#0fb5a6] focus-visible:outline-offset-1 rounded-sm transition-colors duration-150 motion-reduce:transition-none"
            >
              {video.sourceName}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
