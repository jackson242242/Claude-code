import { render, screen } from '@testing-library/react';
import { SkeletonCard } from '@/components/SkeletonCard';

describe('SkeletonCard', () => {
  it('renders skeleton card with correct class', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.skeleton-card')).toBeInTheDocument();
  });

  it('renders exactly 4 skeleton lines', () => {
    const { container } = render(<SkeletonCard />);
    const skeletonLines = container.querySelectorAll('.skeleton-line');
    expect(skeletonLines).toHaveLength(4);
  });

  it('applies correct class names to skeleton elements', () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons).toHaveLength(4);
    expect(skeletons[0]).toHaveClass('skeleton-line', 'title');
    expect(skeletons[3]).toHaveClass('skeleton-line', 'price');
  });
});
