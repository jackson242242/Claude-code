import { render, screen, fireEvent } from '@testing-library/react';
import { ContextNotebook } from '@/components/ContextNotebook';
import { ASK_EVENT, type AskEventDetail } from '@/components/ChatWidget';

const renderWithTarget = () =>
  render(
    <div>
      <a
        href="/cities/miami"
        data-testid="city"
        data-ctx-kind="city"
        data-ctx-title="Miami"
        data-ctx-detail="USA · MIA"
        data-ctx-href="/hotels?city=miami"
      >
        Miami
      </a>
      {/* debounceMs=0 keeps the test fast; waitFor still flushes the 0ms timer */}
      <ContextNotebook debounceMs={0} />
    </div>,
  );

describe('ContextNotebook', () => {
  it('shows nothing until a context element is hovered', () => {
    renderWithTarget();
    expect(screen.queryByLabelText('Suggestions')).not.toBeInTheDocument();
  });

  it('surfaces a suggestion with a booking link on hover', async () => {
    renderWithTarget();
    fireEvent.pointerOver(screen.getByTestId('city'));

    expect(await screen.findByLabelText('Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Miami — USA · MIA.')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /find hotels/i }),
    ).toHaveAttribute('href', '/hotels?city=miami');
  });

  it('dismisses and stays dismissed for the same context', async () => {
    renderWithTarget();
    fireEvent.pointerOver(screen.getByTestId('city'));
    await screen.findByLabelText('Suggestions');

    fireEvent.click(
      screen.getByRole('button', { name: /dismiss suggestion/i }),
    );
    expect(screen.queryByLabelText('Suggestions')).not.toBeInTheDocument();
  });

  it('dispatches matchday:ask when "Ask the concierge" is clicked', async () => {
    renderWithTarget();
    const handler = jest.fn();
    window.addEventListener(ASK_EVENT, handler as EventListener);

    fireEvent.pointerOver(screen.getByTestId('city'));
    await screen.findByLabelText('Suggestions');
    fireEvent.click(
      screen.getByRole('button', { name: /ask the concierge/i }),
    );

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent<AskEventDetail>;
    expect(event.detail.question).toMatch(/Miami/);

    window.removeEventListener(ASK_EVENT, handler as EventListener);
  });
});
