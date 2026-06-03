export type BookingStatus = 'reserved' | 'paid';

export interface BookingLine {
  kind: string;
  title: string;
  subtitle: string | null;
  priceUsd: number;
  deepLink: string | null;
}

export interface Booking {
  id: string;
  userId: string;
  tripId: string | null;
  tripName: string;
  status: BookingStatus;
  confirmationCode: string;
  currency: string;
  totalUsd: number;
  paymentProvider: string;
  createdAt: string;
  lines: BookingLine[];
}

export interface BookingSummary {
  id: string;
  tripName: string;
  status: BookingStatus;
  confirmationCode: string;
  totalUsd: number;
  lineCount: number;
  createdAt: string;
}
