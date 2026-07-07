import type { FlightOffer, HotelOffer, TransportOffer } from './offers';

export type TripItemKind = 'match' | 'flight' | 'hotel' | 'transport';

export interface User {
  id: string;
  displayName: string;
  createdAt: string;
}

export interface TripItem {
  id: string;
  tripId: string;
  kind: TripItemKind;
  matchId: string | null;
  cityId: string | null;
  title: string;
  subtitle: string | null;
  priceUsd: number;
  startsAt: string | null;
  sortOrder: number;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface Trip {
  id: string;
  userId: string;
  name: string;
  shareToken: string;
  createdAt: string;
  updatedAt: string;
  items: TripItem[];
  itemCount: number;
  totalUsd: number;
}

export interface TripSummary {
  id: string;
  name: string;
  shareToken: string;
  itemCount: number;
  totalUsd: number;
  updatedAt: string;
}

/**
 * Public projection returned by the `/shared/{token}` link. Intentionally has
 * no `userId` or `shareToken` — the backend withholds them because `userId`
 * doubles as the auth credential.
 */
export interface SharedTrip {
  id: string;
  name: string;
  items: TripItem[];
  itemCount: number;
  totalUsd: number;
}

export interface AddTripItemInput {
  kind: TripItemKind;
  matchId?: string;
  cityId?: string;
  title: string;
  subtitle?: string;
  priceUsd?: number;
  startsAt?: string;
  payload?: Record<string, unknown>;
}

export interface CityStay {
  cityId: string;
  cityName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  hotel: HotelOffer | null;
}

export interface TravelLeg {
  fromCityId: string;
  fromCityName: string;
  toCityId: string;
  toCityName: string;
  date: string;
  flight: FlightOffer | null;
  transport: TransportOffer | null;
}

export interface TripSuggestions {
  cityStays: CityStay[];
  legs: TravelLeg[];
}
