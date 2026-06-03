import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'World Cup 2026 Tour Guide',
  description:
    'Browse the full 2026 World Cup schedule and book flights, hotels, and transportation around the matches you want to attend.',
};

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en">
    <body>
      <header className="site-header">
        <Link href="/" className="brand">
          ⚽ WC2026 Tour Guide
        </Link>
        <nav className="site-nav">
          <Link href="/schedule">Schedule</Link>
          <Link href="/flights">Flights</Link>
          <Link href="/hotels">Hotels</Link>
          <Link href="/transport">Transport</Link>
          <Link href="/trips">My Trips</Link>
        </nav>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        2026 FIFA World Cup · United States · Canada · Mexico
      </footer>
    </body>
  </html>
);

export default RootLayout;
