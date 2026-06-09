import { render, screen } from '@testing-library/react';
import { ConversionBridge } from '@/components/news/ConversionBridge';
import type { NewsItem } from '@/types/news';

const itemWithCity: NewsItem = {
  id: 'bridge-test-01',
  category: 'city',
  title: 'Dallas Match Day Guide',
  summary: 'Everything you need for match day in Dallas.',
  source: 'Matchday26',
  publishedIso: '2026-06-06T09:15:00Z',
  thumbnailKind: 'teal-to-turquoise',
  minutesRead: 4,
  cityId: 'dallas',
  ctaCityId: 'dallas',
};

const itemWithoutCity: NewsItem = {
  id: 'bridge-test-02',
  category: 'player',
  title: 'Best Midfielders',
  summary: 'A look at the top midfielders.',
  source: 'Matchday26 Editorial',
  publishedIso: '2026-06-04T11:00:00Z',
  thumbnailKind: 'grape-to-turquoise',
  minutesRead: 5,
};

describe('ConversionBridge', () => {
  it('renders the booking CTA with a city-prefilled link', () => {
    render(<ConversionBridge item={itemWithCity} />);
    const link = screen.getByTestId('conversion-bridge-hotels-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('dallas'));
  });

  it('renders the city name', () => {
    render(<ConversionBridge item={itemWithCity} />);
    expect(screen.getByText('Dallas')).toBeInTheDocument();
  });

  it('renders "Book this trip →" label', () => {
    render(<ConversionBridge item={itemWithCity} />);
    expect(screen.getByText('Book this trip →')).toBeInTheDocument();
  });

  it('renders nothing when ctaCityId is absent', () => {
    const { container } = render(<ConversionBridge item={itemWithoutCity} />);
    expect(container.firstChild).toBeNull();
  });
});
