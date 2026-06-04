import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Matchday26 — Your Road to the Game',
    short_name: 'Matchday26',
    description: 'Your road to the game. Browse the 2026 World Cup schedule and book flights, hotels, and transport.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f1419',
    theme_color: '#1fb88f',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
