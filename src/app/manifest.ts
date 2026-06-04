import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'World Cup 2026 Tour Guide',
    short_name: 'WC2026',
    description: 'Browse the 2026 World Cup schedule and book flights, hotels, and transport.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d1117',
    theme_color: '#146c34',
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
