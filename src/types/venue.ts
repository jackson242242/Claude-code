export interface Venue {
  id: string;
  name: string;
  cityId: string;
  capacity: number;
  lat: number;
  lng: number;
  /** IATA codes of the airports closest to this stadium. */
  nearestAirports: string[];
}
