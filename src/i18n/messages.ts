export const LOCALES = ['en', 'es', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

export type MessageKey =
  | 'nav.schedule'
  | 'nav.flights'
  | 'nav.hotels'
  | 'nav.transport'
  | 'nav.trips'
  | 'nav.bookings'
  | 'home.title'
  | 'home.subtitle'
  | 'home.exploreSchedule'
  | 'home.findHotels'
  | 'home.hostCities'
  | 'common.skipToContent'
  | 'footer.tagline';

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = {
  en: {
    'nav.schedule': 'Schedule',
    'nav.flights': 'Flights',
    'nav.hotels': 'Hotels',
    'nav.transport': 'Transport',
    'nav.trips': 'My Trips',
    'nav.bookings': 'Bookings',
    'home.title': 'Are You Going?',
    'home.subtitle':
      'Browse all 104 matches across 16 host cities in the USA, Canada and Mexico — then book the flights, hotels and transport to follow your team.',
    'home.exploreSchedule': 'Find My Match →',
    'home.findHotels': 'Find hotels',
    'home.hostCities': 'Host cities',
    'common.skipToContent': 'Skip to content',
    'footer.tagline': '2026 FIFA World Cup · United States · Canada · Mexico',
  },
  es: {
    'nav.schedule': 'Calendario',
    'nav.flights': 'Vuelos',
    'nav.hotels': 'Hoteles',
    'nav.transport': 'Transporte',
    'nav.trips': 'Mis viajes',
    'nav.bookings': 'Reservas',
    'home.title': '¿Vas a ir?',
    'home.subtitle':
      'Explora los 104 partidos en 16 sedes de EE. UU., Canadá y México, y reserva vuelos, hoteles y transporte para seguir a tu equipo.',
    'home.exploreSchedule': 'Busca tu partido →',
    'home.findHotels': 'Buscar hoteles',
    'home.hostCities': 'Sedes',
    'common.skipToContent': 'Saltar al contenido',
    'footer.tagline': 'Copa Mundial FIFA 2026 · Estados Unidos · Canadá · México',
  },
  fr: {
    'nav.schedule': 'Calendrier',
    'nav.flights': 'Vols',
    'nav.hotels': 'Hôtels',
    'nav.transport': 'Transport',
    'nav.trips': 'Mes voyages',
    'nav.bookings': 'Réservations',
    'home.title': 'Tu y vas ?',
    'home.subtitle':
      'Parcourez les 104 matchs dans 16 villes hôtes aux États-Unis, au Canada et au Mexique, puis réservez vols, hôtels et transports pour suivre votre équipe.',
    'home.exploreSchedule': 'Trouve mon match →',
    'home.findHotels': 'Trouver un hôtel',
    'home.hostCities': 'Villes hôtes',
    'common.skipToContent': 'Aller au contenu',
    'footer.tagline': 'Coupe du monde FIFA 2026 · États-Unis · Canada · Mexique',
  },
};
