import { render, screen } from '@testing-library/react';
import { BookingDetailView } from '@/components/BookingDetailView';
import { getBooking } from '@/services/bookingsService';
import type { Booking } from '@/types';

jest.mock('@/services/bookingsService');

const mockedGetBooking = getBooking as jest.MockedFunction<typeof getBooking>;

const booking: Booking = {
  id: 'b1',
  userId: 'u1',
  tripId: 't1',
  tripName: 'My Trip',
  status: 'reserved',
  confirmationCode: 'WC-ABC123',
  currency: 'USD',
  totalUsd: 540,
  paymentProvider: 'none',
  createdAt: '2026-01-01T00:00:00.000Z',
  lines: [
    {
      kind: 'hotel',
      title: 'Grand Plaza',
      subtitle: null,
      priceUsd: 540,
      deepLink: 'https://www.booking.com/x',
    },
  ],
};

describe('BookingDetailView', () => {
  afterEach(() => {
    mockedGetBooking.mockReset();
  });

  it('renders the confirmation code, lines and a partner deep link', async () => {
    mockedGetBooking.mockResolvedValue(booking);
    render(<BookingDetailView bookingId="b1" />);

    expect(await screen.findByText('WC-ABC123')).toBeInTheDocument();
    expect(screen.getByText('Grand Plaza')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open/ })).toHaveAttribute(
      'href',
      'https://www.booking.com/x',
    );
  });
});
