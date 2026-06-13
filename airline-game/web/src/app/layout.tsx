import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { I18nProvider } from '@/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkyEmpire 航空帝国',
  description: '回合制航空公司经营游戏 — SkyEmpire M1',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#04070f',
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="zh-CN">
    <body className="min-h-dvh bg-ops-950 font-sans">
      <I18nProvider>{children}</I18nProvider>
    </body>
  </html>
);

export default RootLayout;
