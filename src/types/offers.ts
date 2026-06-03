export type OfferType = 'flight' | 'hotel' | 'transport';

export type TransportMode =
  | 'train'
  | 'bus'
  | 'rideshare'
  | 'shuttle'
  | 'car-rental';

interface OfferBase {
  id: string;
  type: OfferType;
  provider: string;
  /** Total price in USD for the whole offer. */
  priceUsd: number;
}

export interface FlightOffer extends OfferBase {
  type: 'flight';
  origin: string;
  destination: string;
  airline: string;
  departUtc: string;
  arriveUtc: string;
  durationMinutes: number;
  stops: number;
}

export interface HotelOffer extends OfferBase {
  type: 'hotel';
  name: string;
  cityId: string;
  /** Star rating, 1–5. */
  rating: number;
  /** Distance from the host venue in kilometres. */
  distanceKm: number;
  pricePerNightUsd: number;
  nights: number;
}

export interface TransportOffer extends OfferBase {
  type: 'transport';
  mode: TransportMode;
  origin: string;
  destination: string;
  departUtc: string;
  arriveUtc: string;
  durationMinutes: number;
}

export interface FlightSearchQuery {
  origin: string;
  destination: string;
  /** Departure date as YYYY-MM-DD. */
  date: string;
  passengers: number;
}

export interface HotelSearchQuery {
  cityId: string;
  /** Check-in date as YYYY-MM-DD. */
  checkIn: string;
  /** Check-out date as YYYY-MM-DD. */
  checkOut: string;
  guests: number;
}

export interface TransportSearchQuery {
  origin: string;
  destination: string;
  /** Travel date as YYYY-MM-DD. */
  date: string;
  mode?: TransportMode;
}
