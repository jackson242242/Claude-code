import { getDictionary, isLocale, translate, translator } from '@/i18n';

describe('i18n', () => {
  it('translates a key across locales', () => {
    expect(translate('en', 'nav.schedule')).toBe('Schedule');
    expect(translate('es', 'nav.schedule')).toBe('Calendario');
    expect(translate('fr', 'nav.schedule')).toBe('Calendrier');
  });

  it('provides a bound translator', () => {
    expect(translator('es')('nav.bookings')).toBe('Reservas');
  });

  it('recognizes valid locales only', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it('exposes a full dictionary per locale', () => {
    expect(getDictionary('fr')['home.hostCities']).toBe('Villes hôtes');
  });

  it('covers the home page plan/live/news-window strings in every locale', () => {
    expect(translate('es', 'home.plan.title')).toBe('Planifica tu viaje');
    expect(translate('fr', 'live.badge')).toBe('EN DIRECT');
    expect(translate('es', 'newsWindow.tabLatest')).toBe('Lo último');
    // en stays the source copy
    expect(translate('en', 'home.plan.title')).toBe('Plan your trip');
  });
});
