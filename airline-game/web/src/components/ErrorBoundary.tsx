'use client';

import { Component, type ReactNode } from 'react';
import { getLocale, tStandalone } from '@/i18n/standalone';

// S4: top-level React error boundary — a render crash shows a friendly recovery
// screen with a restart button instead of a blank white page. Class component
// because only class components can be error boundaries; it uses the standalone
// (non-hook) i18n helpers.
type Props = { children: ReactNode };
type State = { hasError: boolean };

const SESSION_KEYS = [
  'skyempire.gameId',
  'skyempire.matchCode',
  'skyempire.matchPlayerId',
  'skyempire.weekly.gameId',
  'skyempire.weekly.token',
];

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    // eslint-disable-next-line no-console
    console.error('SkyEmpire render error:', error);
  }

  private handleRestart = (): void => {
    if (typeof window !== 'undefined') {
      for (const key of SESSION_KEYS) window.localStorage.removeItem(key);
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    const locale = getLocale();
    return (
      <div
        data-testid="error-boundary"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
          background: '#0a0f1e',
          color: '#e2e8f0',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
          {tStandalone(locale, 'boundary.title')}
        </h1>
        <p style={{ maxWidth: '32rem', lineHeight: 1.6, color: '#94a3b8' }}>
          {tStandalone(locale, 'boundary.body')}
        </p>
        <button
          type="button"
          onClick={this.handleRestart}
          style={{
            marginTop: '0.5rem',
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: '#06b6d4',
            color: '#06283d',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {tStandalone(locale, 'boundary.restart')}
        </button>
      </div>
    );
  }
}
