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
  | 'home.countdown.day'
  | 'home.countdown.days'
  | 'home.countdown.until'
  | 'home.trust.matches'
  | 'home.trust.hostCities'
  | 'home.trust.countries'
  | 'home.plan.title'
  | 'home.plan.flightsSub'
  | 'home.plan.hotelsSub'
  | 'home.plan.transportSub'
  | 'live.badge'
  | 'live.todaysMatches'
  | 'live.inProgress'
  | 'live.fullTime'
  | 'live.restDay'
  | 'live.fullSchedule'
  | 'newsWindow.kicker'
  | 'newsWindow.title'
  | 'newsWindow.subtitle'
  | 'newsWindow.viewAll'
  | 'newsWindow.aria'
  | 'newsWindow.tabsAria'
  | 'newsWindow.tabStars'
  | 'newsWindow.tabBloopers'
  | 'newsWindow.tabLatest'
  | 'newsWindow.tabFans'
  | 'newsWindow.starsRailAria'
  | 'newsWindow.bloopersRailAria'
  | 'newsWindow.latestRailAria'
  | 'newsWindow.fansRailAria'
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
    'home.countdown.day': 'DAY',
    'home.countdown.days': 'DAYS',
    'home.countdown.until': 'until kickoff · June 11',
    'home.trust.matches': 'matches',
    'home.trust.hostCities': 'host cities',
    'home.trust.countries': 'countries',
    'home.plan.title': 'Plan your trip',
    'home.plan.flightsSub': 'Search fares to every host city',
    'home.plan.hotelsSub': 'Stay near the stadiums',
    'home.plan.transportSub': 'Get between cities and venues',
    'live.badge': 'LIVE NOW',
    'live.todaysMatches': "Today's matches",
    'live.inProgress': 'In progress',
    'live.fullTime': 'FT',
    'live.restDay': 'Rest day — knockout action resumes soon',
    'live.fullSchedule': 'Full schedule →',
    'newsWindow.kicker': '▶ Watch',
    'newsWindow.title': 'Matchday News',
    'newsWindow.subtitle':
      'Superstars, bloopers, national teams and fan-zone clips — tap to watch.',
    'newsWindow.viewAll': 'View all →',
    'newsWindow.aria': 'Matchday news videos',
    'newsWindow.tabsAria': 'News stream',
    'newsWindow.tabStars': 'Superstars',
    'newsWindow.tabBloopers': 'Bloopers 😂',
    'newsWindow.tabLatest': 'Latest',
    'newsWindow.tabFans': 'Fan Zone',
    'newsWindow.starsRailAria': 'Superstar highlights — scroll for more',
    'newsWindow.bloopersRailAria': 'Soccer bloopers — scroll for more',
    'newsWindow.latestRailAria': 'Latest World Cup stories — scroll for more',
    'newsWindow.fansRailAria': 'Fan footage — scroll for more',
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
    'home.countdown.day': 'DÍA',
    'home.countdown.days': 'DÍAS',
    'home.countdown.until': 'para el inicio · 11 de junio',
    'home.trust.matches': 'partidos',
    'home.trust.hostCities': 'sedes',
    'home.trust.countries': 'países',
    'home.plan.title': 'Planifica tu viaje',
    'home.plan.flightsSub': 'Busca tarifas a todas las sedes',
    'home.plan.hotelsSub': 'Alójate cerca de los estadios',
    'home.plan.transportSub': 'Muévete entre ciudades y estadios',
    'live.badge': 'EN VIVO',
    'live.todaysMatches': 'Partidos de hoy',
    'live.inProgress': 'En juego',
    'live.fullTime': 'Fin',
    'live.restDay': 'Día de descanso — la eliminatoria continúa pronto',
    'live.fullSchedule': 'Calendario completo →',
    'newsWindow.kicker': '▶ Ver',
    'newsWindow.title': 'Noticias del Mundial',
    'newsWindow.subtitle':
      'Estrellas, bloopers, selecciones y zona de hinchas — toca para ver.',
    'newsWindow.viewAll': 'Ver todo →',
    'newsWindow.aria': 'Vídeos de noticias del Mundial',
    'newsWindow.tabsAria': 'Secciones de noticias',
    'newsWindow.tabStars': 'Estrellas',
    'newsWindow.tabBloopers': 'Bloopers 😂',
    'newsWindow.tabLatest': 'Lo último',
    'newsWindow.tabFans': 'Zona fan',
    'newsWindow.starsRailAria': 'Momentos de estrellas — desliza para ver más',
    'newsWindow.bloopersRailAria': 'Bloopers de fútbol — desliza para ver más',
    'newsWindow.latestRailAria':
      'Últimas historias del Mundial — desliza para ver más',
    'newsWindow.fansRailAria': 'Vídeos de hinchas — desliza para ver más',
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
    'home.countdown.day': 'JOUR',
    'home.countdown.days': 'JOURS',
    'home.countdown.until': "avant le coup d'envoi · 11 juin",
    'home.trust.matches': 'matchs',
    'home.trust.hostCities': 'villes hôtes',
    'home.trust.countries': 'pays',
    'home.plan.title': 'Planifiez votre voyage',
    'home.plan.flightsSub': 'Comparez les vols vers chaque ville hôte',
    'home.plan.hotelsSub': 'Dormez près des stades',
    'home.plan.transportSub': 'Déplacez-vous entre villes et stades',
    'live.badge': 'EN DIRECT',
    'live.todaysMatches': 'Matchs du jour',
    'live.inProgress': 'En cours',
    'live.fullTime': 'Fin',
    'live.restDay': 'Jour de repos — la phase finale reprend bientôt',
    'live.fullSchedule': 'Calendrier complet →',
    'newsWindow.kicker': '▶ Regarder',
    'newsWindow.title': 'Actus du Mondial',
    'newsWindow.subtitle':
      'Stars, bêtisiers, sélections et zone des fans — appuyez pour regarder.',
    'newsWindow.viewAll': 'Tout voir →',
    'newsWindow.aria': "Vidéos d'actus du Mondial",
    'newsWindow.tabsAria': "Flux d'actualités",
    'newsWindow.tabStars': 'Stars',
    'newsWindow.tabBloopers': 'Bêtisier 😂',
    'newsWindow.tabLatest': 'À la une',
    'newsWindow.tabFans': 'Zone fans',
    'newsWindow.starsRailAria': 'Moments de stars — faites défiler',
    'newsWindow.bloopersRailAria': 'Bêtisiers foot — faites défiler',
    'newsWindow.latestRailAria': 'Dernières actus du Mondial — faites défiler',
    'newsWindow.fansRailAria': 'Vidéos des fans — faites défiler',
    'common.skipToContent': 'Aller au contenu',
    'footer.tagline': 'Coupe du monde FIFA 2026 · États-Unis · Canada · Mexique',
  },
};
