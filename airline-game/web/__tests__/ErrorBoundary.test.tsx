import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const Boom = (): never => {
  throw new Error('kaboom');
};

describe('ErrorBoundary (S4)', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="ok">fine</div>
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('ok')).toBeInTheDocument();
    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
  });

  it('shows the recovery screen with a restart button when a child throws', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('restart clears session keys and reloads', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    window.localStorage.setItem('skyempire.gameId', 'g1');
    const reload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByRole('button'));

    expect(window.localStorage.getItem('skyempire.gameId')).toBeNull();
    expect(reload).toHaveBeenCalled();
    spy.mockRestore();
  });
});
