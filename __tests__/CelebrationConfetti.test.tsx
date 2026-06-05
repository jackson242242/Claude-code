import { render, screen } from '@testing-library/react';
import { CelebrationConfetti } from '@/components/CelebrationConfetti';

describe('CelebrationConfetti', () => {
  it('renders a decorative confetti layer with multiple pieces', () => {
    const { container } = render(<CelebrationConfetti />);
    const layer = screen.getByTestId('confetti');
    expect(layer).toBeInTheDocument();
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('.confetti').length).toBeGreaterThan(5);
  });
});
