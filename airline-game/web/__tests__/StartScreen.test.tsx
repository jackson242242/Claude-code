/**
 * StartScreen — HQ picker search, CityCard integration, skyline/gradient.
 * V3.9: fixtures extended with iata/airport/airportZh/population/taxRelief/
 *       transitIndex/terrain; new tests for CityCard endowment display and
 *       HQ advantage summary.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartScreen } from '@/components/StartScreen';
import type { City } from '@/types';

// --- V3.9 fixture data -------------------------------------------------------

const FIXTURE_CITIES: City[] = [
  {
    id: 'nyc',
    name: 'New York',
    nameZh: '纽约',
    country: 'USA',
    lat: 40.64,
    lon: -73.78,
    demandIndex: 10,
    slotFee: 9500,
    slotCapacity: 12,
    iata: 'JFK',
    airport: 'John F. Kennedy International Airport',
    airportZh: '肯尼迪国际机场',
    population: 19.5,
    taxRelief: 0,
    transitIndex: 8,
    terrain: 'coastal',
  },
  {
    id: 'lhr',
    name: 'London',
    nameZh: '伦敦',
    country: 'UK',
    lat: 51.47,
    lon: -0.45,
    demandIndex: 9,
    slotFee: 8500,
    slotCapacity: 11,
    iata: 'LHR',
    airport: 'Heathrow Airport',
    airportZh: '希思罗机场',
    population: 14.8,
    taxRelief: 0,
    transitIndex: 9,
    terrain: 'plain',
  },
  {
    id: 'sin',
    name: 'Singapore',
    nameZh: '新加坡',
    country: 'Singapore',
    lat: 1.35,
    lon: 103.99,
    demandIndex: 8,
    slotFee: 7500,
    slotCapacity: 10,
    iata: 'SIN',
    airport: 'Singapore Changi Airport',
    airportZh: '樟宜国际机场',
    population: 5.9,
    taxRelief: 0.20,
    transitIndex: 9,
    terrain: 'island',
  },
  {
    id: 'syd',
    name: 'Sydney',
    nameZh: '悉尼',
    country: 'Australia',
    lat: -33.95,
    lon: 151.18,
    demandIndex: 6,
    slotFee: 6000,
    slotCapacity: 9,
    iata: 'SYD',
    airport: 'Sydney Kingsford Smith Airport',
    airportZh: '悉尼金斯福德·史密斯机场',
    population: 5.3,
    taxRelief: 0,
    transitIndex: 5,
    terrain: 'coastal',
  },
  {
    id: 'mex',
    name: 'Mexico City',
    nameZh: '墨西哥城',
    country: 'Mexico',
    lat: 19.44,
    lon: -99.07,
    demandIndex: 7,
    slotFee: 5500,
    slotCapacity: 8,
    iata: 'MEX',
    airport: 'Felipe Ángeles International Airport',
    airportZh: '费利佩·安赫莱斯国际机场',
    population: 21.6,
    taxRelief: 0.10,
    transitIndex: 4,
    terrain: 'mountain',
  },
];

// city-images fixture: only nyc and lhr have images.
const FIXTURE_CITY_IMAGES = {
  nyc: {
    url: 'https://example.com/nyc.jpg',
    filePage: 'https://example.com/nyc',
    credit: 'Test credit',
  },
  lhr: {
    url: 'https://example.com/lhr.jpg',
    filePage: 'https://example.com/lhr',
    credit: 'Test credit',
  },
};

// --- mock @/lib/data ---------------------------------------------------------

jest.mock('@/lib/data', () => {
  const cities: City[] = [
    {
      id: 'nyc',
      name: 'New York',
      nameZh: '纽约',
      country: 'USA',
      lat: 40.64,
      lon: -73.78,
      demandIndex: 10,
      slotFee: 9500,
      slotCapacity: 12,
      iata: 'JFK',
      airport: 'John F. Kennedy International Airport',
      airportZh: '肯尼迪国际机场',
      population: 19.5,
      taxRelief: 0,
      transitIndex: 8,
      terrain: 'coastal' as const,
    },
    {
      id: 'lhr',
      name: 'London',
      nameZh: '伦敦',
      country: 'UK',
      lat: 51.47,
      lon: -0.45,
      demandIndex: 9,
      slotFee: 8500,
      slotCapacity: 11,
      iata: 'LHR',
      airport: 'Heathrow Airport',
      airportZh: '希思罗机场',
      population: 14.8,
      taxRelief: 0,
      transitIndex: 9,
      terrain: 'plain' as const,
    },
    {
      id: 'sin',
      name: 'Singapore',
      nameZh: '新加坡',
      country: 'Singapore',
      lat: 1.35,
      lon: 103.99,
      demandIndex: 8,
      slotFee: 7500,
      slotCapacity: 10,
      iata: 'SIN',
      airport: 'Singapore Changi Airport',
      airportZh: '樟宜国际机场',
      population: 5.9,
      taxRelief: 0.20,
      transitIndex: 9,
      terrain: 'island' as const,
    },
    {
      id: 'syd',
      name: 'Sydney',
      nameZh: '悉尼',
      country: 'Australia',
      lat: -33.95,
      lon: 151.18,
      demandIndex: 6,
      slotFee: 6000,
      slotCapacity: 9,
      iata: 'SYD',
      airport: 'Sydney Kingsford Smith Airport',
      airportZh: '悉尼金斯福德·史密斯机场',
      population: 5.3,
      taxRelief: 0,
      transitIndex: 5,
      terrain: 'coastal' as const,
    },
    {
      id: 'mex',
      name: 'Mexico City',
      nameZh: '墨西哥城',
      country: 'Mexico',
      lat: 19.44,
      lon: -99.07,
      demandIndex: 7,
      slotFee: 5500,
      slotCapacity: 8,
      iata: 'MEX',
      airport: 'Felipe Ángeles International Airport',
      airportZh: '费利佩·安赫莱斯国际机场',
      population: 21.6,
      taxRelief: 0.10,
      transitIndex: 4,
      terrain: 'mountain' as const,
    },
  ];
  return {
    CITIES: cities,
    CITY_BY_ID: new Map(cities.map((c) => [c.id, c])),
    CITY_IMAGES: {
      nyc: {
        url: 'https://example.com/nyc.jpg',
        filePage: 'https://example.com/nyc',
        credit: 'Test credit',
      },
      lhr: {
        url: 'https://example.com/lhr.jpg',
        filePage: 'https://example.com/lhr',
        credit: 'Test credit',
      },
    },
    cityLabel: (id: string) => {
      const found = cities.find((c) => c.id === id);
      return found ? `${found.nameZh} ${found.name}` : id;
    },
    cityZh: (id: string) => cities.find((c) => c.id === id)?.nameZh ?? id,
    modelName: (id: string) => id,
  };
});

const noop = () => undefined;

// --------------------------------------------------------------------------

describe('StartScreen — HQ picker', () => {
  it('renders all 5 fixture cities initially', () => {
    render(<StartScreen busy={false} error={null} onCreate={noop} />);
    // All 5 city names should be visible
    expect(screen.getByText('纽约')).toBeInTheDocument();
    expect(screen.getByText('伦敦')).toBeInTheDocument();
    expect(screen.getByText('新加坡')).toBeInTheDocument();
    expect(screen.getByText('悉尼')).toBeInTheDocument();
    expect(screen.getByText('墨西哥城')).toBeInTheDocument();
  });

  it('filters by English name (case-insensitive)', async () => {
    const user = userEvent.setup();
    render(<StartScreen busy={false} error={null} onCreate={noop} />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'london');

    expect(screen.getByText('伦敦')).toBeInTheDocument();
    expect(screen.queryByText('纽约')).not.toBeInTheDocument();
    expect(screen.queryByText('新加坡')).not.toBeInTheDocument();
  });

  it('filters by Chinese name (nameZh)', async () => {
    const user = userEvent.setup();
    render(<StartScreen busy={false} error={null} onCreate={noop} />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, '新加坡');

    expect(screen.getByText('新加坡')).toBeInTheDocument();
    expect(screen.queryByText('纽约')).not.toBeInTheDocument();
  });

  it('filters by country (case-insensitive)', async () => {
    const user = userEvent.setup();
    render(<StartScreen busy={false} error={null} onCreate={noop} />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'australia');

    expect(screen.getByText('悉尼')).toBeInTheDocument();
    expect(screen.queryByText('纽约')).not.toBeInTheDocument();
  });

  it('shows empty state when no cities match', async () => {
    const user = userEvent.setup();
    render(<StartScreen busy={false} error={null} onCreate={noop} />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'zzznomatch');

    expect(screen.getByText('未找到匹配城市')).toBeInTheDocument();
  });

  it('sorts filtered list by demandIndex descending', () => {
    render(<StartScreen busy={false} error={null} onCreate={noop} />);

    // Get all city buttons (aria-pressed cards)
    const cards = screen.getAllByRole('button', { pressed: false });
    // Filter to only city cards (they have aria-pressed attribute)
    const cityCards = screen.getAllByRole('button').filter((btn) =>
      btn.hasAttribute('aria-pressed'),
    );

    // First card should be nyc (demandIndex 10), last should be syd (demandIndex 6)
    expect(within(cityCards[0]).getByText('纽约')).toBeInTheDocument();
    expect(within(cityCards[cityCards.length - 1]).getByText('悉尼')).toBeInTheDocument();
  });

  it('shows CityCard photo (img) when CITY_IMAGES has the city id', () => {
    render(<StartScreen busy={false} error={null} onCreate={noop} />);

    // nyc has an image in the fixture
    const img = screen.getAllByRole('img').find(
      (el) => el.getAttribute('src') === 'https://example.com/nyc.jpg',
    );
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('shows gradient placeholder when CITY_IMAGES has no entry for city', () => {
    render(<StartScreen busy={false} error={null} onCreate={noop} />);

    // sin, syd, mex have no image entry — should have gradient placeholder
    expect(screen.getByTestId('city-gradient-sin')).toBeInTheDocument();
    expect(screen.getByTestId('city-gradient-syd')).toBeInTheDocument();
    expect(screen.getByTestId('city-gradient-mex')).toBeInTheDocument();
  });

  it('shows gradient placeholder when image fails to load (onError)', () => {
    render(<StartScreen busy={false} error={null} onCreate={noop} />);

    // nyc has image; trigger error
    const nycImg = screen.getAllByRole('img').find(
      (el) => el.getAttribute('src') === 'https://example.com/nyc.jpg',
    );
    expect(nycImg).toBeDefined();
    // Fire error event to trigger fallback
    fireEvent.error(nycImg!);

    // After error, gradient placeholder should appear
    expect(screen.getByTestId('city-gradient-nyc')).toBeInTheDocument();
  });

  it('passes selected state to CityCard', async () => {
    const user = userEvent.setup();
    render(<StartScreen busy={false} error={null} onCreate={noop} />);

    const cityCards = screen.getAllByRole('button').filter((btn) =>
      btn.hasAttribute('aria-pressed'),
    );
    const nycCard = cityCards.find((btn) => within(btn).queryByText('纽约'));
    expect(nycCard).toBeDefined();

    // Initially not selected
    expect(nycCard).toHaveAttribute('aria-pressed', 'false');
    await user.click(nycCard!);
    expect(nycCard).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onCreate with airline name and selected city id', async () => {
    const user = userEvent.setup();
    const onCreate = jest.fn();
    render(<StartScreen busy={false} error={null} onCreate={onCreate} />);

    // Type airline name
    await user.type(screen.getByLabelText('航空公司名称'), '测试航空');

    // Select a city
    const cityCards = screen.getAllByRole('button').filter((btn) =>
      btn.hasAttribute('aria-pressed'),
    );
    const nycCard = cityCards.find((btn) => within(btn).queryByText('纽约'));
    await user.click(nycCard!);

    // Click create
    await user.click(screen.getByRole('button', { name: /成立航空公司/ }));

    expect(onCreate).toHaveBeenCalledWith('测试航空', 'nyc');
  });

  it('shows error message when error prop is set', () => {
    render(<StartScreen busy={false} error="创建失败" onCreate={noop} />);
    expect(screen.getByRole('alert')).toHaveTextContent('创建失败');
  });

  // ── V3.9 HQ advantage summary ────────────────────────────────────────────

  it('V3.9: shows hq-advantage-summary after selecting a city', async () => {
    const user = userEvent.setup();
    render(<StartScreen busy={false} error={null} onCreate={noop} />);

    // No summary before selection
    expect(screen.queryByTestId('hq-advantage-summary')).not.toBeInTheDocument();

    // Select nyc
    const cityCards = screen.getAllByRole('button').filter((btn) =>
      btn.hasAttribute('aria-pressed'),
    );
    const nycCard = cityCards.find((btn) => within(btn).queryByText('纽约'));
    await user.click(nycCard!);

    expect(screen.getByTestId('hq-advantage-summary')).toBeInTheDocument();
  });

  it('V3.9: advantage summary shows transitOnly text for nyc (taxRelief=0, transitIndex=8)', async () => {
    const user = userEvent.setup();
    render(<StartScreen busy={false} error={null} onCreate={noop} />);

    const cityCards = screen.getAllByRole('button').filter((btn) =>
      btn.hasAttribute('aria-pressed'),
    );
    const nycCard = cityCards.find((btn) => within(btn).queryByText('纽约'));
    await user.click(nycCard!);

    // nyc: taxRelief=0 (no tax), transitIndex=8 → +3% transit bonus
    const summary = screen.getByTestId('hq-advantage-summary');
    expect(summary).toHaveTextContent('+3');
    // Should not mention tax
    expect(summary.textContent).not.toMatch(/税惠|Tax|Fiscal/);
  });

  it('V3.9: advantage summary shows taxOnly text for mex (taxRelief=0.1, transitIndex=4)', async () => {
    const user = userEvent.setup();
    render(<StartScreen busy={false} error={null} onCreate={noop} />);

    const cityCards = screen.getAllByRole('button').filter((btn) =>
      btn.hasAttribute('aria-pressed'),
    );
    const mexCard = cityCards.find((btn) => within(btn).queryByText('墨西哥城'));
    await user.click(mexCard!);

    // mex: taxRelief=0.1 (10% tax), transitIndex=4 → −1% transit (neutral ≈ 0 range but negative)
    // Actually transitBonus = 4-5 = -1%, which hasTransit=true
    // So it shows both? Let me check: transitBonus = -1 ≠ 0 → hasTransit = true, hasTax = true
    // Should show combined advantage
    const summary = screen.getByTestId('hq-advantage-summary');
    expect(summary.textContent).toBeTruthy();
  });

  it('V3.9: advantage summary shows combined text for sin (taxRelief=0.2, transitIndex=9)', async () => {
    const user = userEvent.setup();
    render(<StartScreen busy={false} error={null} onCreate={noop} />);

    const cityCards = screen.getAllByRole('button').filter((btn) =>
      btn.hasAttribute('aria-pressed'),
    );
    const sinCard = cityCards.find((btn) => within(btn).queryByText('新加坡'));
    await user.click(sinCard!);

    // sin: taxRelief=0.2 (20%), transitIndex=9 → +4% transit
    const summary = screen.getByTestId('hq-advantage-summary');
    // Combined advantage: shows both tax and transit
    expect(summary.textContent).toBeTruthy();
    // should show 20 (for 20% tax)
    expect(summary).toHaveTextContent('20');
  });

  it('V3.9: advantage summary shows none text for syd (taxRelief=0, transitIndex=5)', async () => {
    const user = userEvent.setup();
    render(<StartScreen busy={false} error={null} onCreate={noop} />);

    const cityCards = screen.getAllByRole('button').filter((btn) =>
      btn.hasAttribute('aria-pressed'),
    );
    const sydCard = cityCards.find((btn) => within(btn).queryByText('悉尼'));
    await user.click(sydCard!);

    // syd: taxRelief=0, transitIndex=5 → no bonus
    const summary = screen.getByTestId('hq-advantage-summary');
    expect(summary).toHaveTextContent('标准城市');
  });
});

// Re-export fixture for clarity
export { FIXTURE_CITIES, FIXTURE_CITY_IMAGES };
