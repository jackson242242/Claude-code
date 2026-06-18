import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { getLocale } from '@/i18n/server';
import { translator } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { PwaRegistration } from '@/components/PwaRegistration';
import { ChatWidget } from '@/components/ChatWidget';
import { ContextNotebook } from '@/components/ContextNotebook';
import './globals.css';

export const metadata: Metadata = {
  title: 'Matchday26 — Your Road to the Game | World Cup 2026 Travel',
  description:
    'Matchday26 — your road to the game. Browse the full 2026 World Cup schedule and book flights, hotels, and transportation around the matches you want to attend.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Matchday26',
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = async ({ children }: RootLayoutProps) => {
  const locale = await getLocale();
  const t = translator(locale);

  return (
    <html lang={locale}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        <PwaRegistration />
        <a href="#main" className="skip-link">
          {t('common.skipToContent')}
        </a>
        <header className="site-header">
          <Link href="/" className="brand">
            ⚽ Matchday<span className="brand__accent">26</span>
          </Link>
          <nav className="site-nav">
            <Link href="/schedule">{t('nav.schedule')}</Link>
            <Link href="/flights">{t('nav.flights')}</Link>
            <Link href="/hotels">{t('nav.hotels')}</Link>
            <Link href="/transport">{t('nav.transport')}</Link>
            <Link href="/news">News</Link>
            <Link href="/fitness">运动</Link>
            <Link href="/trips">{t('nav.trips')}</Link>
            <Link href="/bookings">{t('nav.bookings')}</Link>
            <LanguageSwitcher locale={locale} />
            <Link href="/schedule" className="nav-cta">
              {t('home.exploreSchedule')}
            </Link>
          </nav>
        </header>
        <main id="main" className="site-main">
          {children}
        </main>
        <footer className="site-footer">
          <div className="site-footer__inner">
            <div className="site-footer__col">
              <div className="site-footer__brand">
                ⚽ Matchday<span className="brand__accent">26</span>
              </div>
              <p className="site-footer__tagline">{t('footer.tagline')}</p>
            </div>
            <div className="site-footer__col">
              <h4>{t('nav.schedule')}</h4>
              <Link href="/schedule">{t('nav.schedule')}</Link>
              <Link href="/news">News</Link>
              <Link href="/trips">{t('nav.trips')}</Link>
            </div>
            <div className="site-footer__col">
              <h4>{t('home.findHotels')}</h4>
              <Link href="/flights">{t('nav.flights')}</Link>
              <Link href="/hotels">{t('nav.hotels')}</Link>
              <Link href="/transport">{t('nav.transport')}</Link>
            </div>
          </div>
        </footer>
        <ContextNotebook />
        <ChatWidget />
      </body>
    </html>
  );
};

export default RootLayout;
