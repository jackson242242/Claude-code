import type { City } from '@/types';

/**
 * The 16 host cities of the 2026 FIFA World Cup (USA, Canada, Mexico).
 * Coordinates are approximate stadium-area locations.
 */
export const MOCK_CITIES: City[] = [
  {
    id: 'mexico-city',
    name: 'Mexico City',
    country: 'Mexico',
    lat: 19.303,
    lng: -99.15,
    airports: ['MEX', 'NLU'],
    transportNotes:
      'Metro Línea 2 and Metrobús connect central Mexico City to Estadio Azteca in the south.',
  },
  {
    id: 'guadalajara',
    name: 'Guadalajara',
    country: 'Mexico',
    lat: 20.681,
    lng: -103.463,
    airports: ['GDL'],
    transportNotes:
      'Mi Macro Periférico bus rapid transit and rideshare serve Estadio Akron in Zapopan.',
  },
  {
    id: 'monterrey',
    name: 'Monterrey',
    country: 'Mexico',
    lat: 25.669,
    lng: -100.244,
    airports: ['MTY'],
    transportNotes:
      'Rideshare and event shuttles are the main options to Estadio BBVA in Guadalupe.',
  },
  {
    id: 'atlanta',
    name: 'Atlanta',
    country: 'USA',
    lat: 33.755,
    lng: -84.401,
    airports: ['ATL'],
    transportNotes:
      'MARTA rail links Hartsfield-Jackson airport directly to Mercedes-Benz Stadium downtown.',
  },
  {
    id: 'boston',
    name: 'Boston',
    country: 'USA',
    lat: 42.091,
    lng: -71.264,
    airports: ['BOS'],
    transportNotes:
      'Special-event commuter rail runs from Boston South Station to Foxborough on match days.',
  },
  {
    id: 'dallas',
    name: 'Dallas',
    country: 'USA',
    lat: 32.747,
    lng: -97.093,
    airports: ['DFW', 'DAL'],
    transportNotes:
      'No rail to Arlington; use event shuttles or rideshare from Dallas and Fort Worth.',
  },
  {
    id: 'houston',
    name: 'Houston',
    country: 'USA',
    lat: 29.685,
    lng: -95.411,
    airports: ['IAH', 'HOU'],
    transportNotes:
      'METRORail Red Line and park-and-ride buses serve NRG Stadium.',
  },
  {
    id: 'kansas-city',
    name: 'Kansas City',
    country: 'USA',
    lat: 39.049,
    lng: -94.484,
    airports: ['MCI'],
    transportNotes:
      'Transit is limited; rideshare and event shuttles reach Arrowhead Stadium.',
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    country: 'USA',
    lat: 33.953,
    lng: -118.339,
    airports: ['LAX'],
    transportNotes:
      'Metro K Line and shuttles serve SoFi Stadium in Inglewood, close to LAX.',
  },
  {
    id: 'miami',
    name: 'Miami',
    country: 'USA',
    lat: 25.958,
    lng: -80.239,
    airports: ['MIA', 'FLL'],
    transportNotes:
      'Tri-Rail plus event shuttles connect to Hard Rock Stadium in Miami Gardens.',
  },
  {
    id: 'new-york',
    name: 'New York / New Jersey',
    country: 'USA',
    lat: 40.814,
    lng: -74.074,
    airports: ['EWR', 'JFK', 'LGA'],
    transportNotes:
      'NJ Transit rail runs to the Meadowlands / MetLife Stadium on event days.',
  },
  {
    id: 'philadelphia',
    name: 'Philadelphia',
    country: 'USA',
    lat: 39.901,
    lng: -75.168,
    airports: ['PHL'],
    transportNotes:
      'SEPTA Broad Street Line runs directly to the South Philadelphia stadium complex.',
  },
  {
    id: 'san-francisco',
    name: 'San Francisco Bay Area',
    country: 'USA',
    lat: 37.403,
    lng: -121.97,
    airports: ['SFO', 'SJC', 'OAK'],
    transportNotes:
      'VTA light rail and Caltrain serve Levi’s Stadium in Santa Clara.',
  },
  {
    id: 'seattle',
    name: 'Seattle',
    country: 'USA',
    lat: 47.595,
    lng: -122.331,
    airports: ['SEA'],
    transportNotes:
      'Link light rail connects Sea-Tac airport to Lumen Field downtown.',
  },
  {
    id: 'toronto',
    name: 'Toronto',
    country: 'Canada',
    lat: 43.633,
    lng: -79.418,
    airports: ['YYZ'],
    transportNotes:
      'TTC streetcar and GO Transit serve BMO Field at Exhibition Place.',
  },
  {
    id: 'vancouver',
    name: 'Vancouver',
    country: 'Canada',
    lat: 49.277,
    lng: -123.112,
    airports: ['YVR'],
    transportNotes:
      'SkyTrain connects YVR airport to BC Place in downtown Vancouver.',
  },
];
