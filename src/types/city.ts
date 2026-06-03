export type Country = 'USA' | 'Canada' | 'Mexico';

export interface City {
  id: string;
  name: string;
  country: Country;
  lat: number;
  lng: number;
  /** IATA codes of airports serving this host city. */
  airports: string[];
  transportNotes: string;
}
