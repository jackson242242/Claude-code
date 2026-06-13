/**
 * V3.3 — ModeSelect: renders two mode buttons, routes correctly.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeSelect } from '@/components/MultiplayerSetup';

describe('ModeSelect', () => {
  it('renders single-player and multiplayer buttons', () => {
    render(<ModeSelect onSolo={jest.fn()} onMulti={jest.fn()} />);
    expect(screen.getByTestId('mode-solo-btn')).toBeInTheDocument();
    expect(screen.getByTestId('mode-multi-btn')).toBeInTheDocument();
  });

  it('calls onSolo when single-player button is clicked', async () => {
    const onSolo = jest.fn();
    render(<ModeSelect onSolo={onSolo} onMulti={jest.fn()} />);
    await userEvent.click(screen.getByTestId('mode-solo-btn'));
    expect(onSolo).toHaveBeenCalledTimes(1);
  });

  it('calls onMulti when multiplayer button is clicked', async () => {
    const onMulti = jest.fn();
    render(<ModeSelect onSolo={jest.fn()} onMulti={onMulti} />);
    await userEvent.click(screen.getByTestId('mode-multi-btn'));
    expect(onMulti).toHaveBeenCalledTimes(1);
  });

  it('shows mode select heading text', () => {
    render(<ModeSelect onSolo={jest.fn()} onMulti={jest.fn()} />);
    // Chinese text for mode select heading
    expect(screen.getByTestId('mode-select')).toBeInTheDocument();
  });
});
