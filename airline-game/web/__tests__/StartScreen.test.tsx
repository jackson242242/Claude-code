/**
 * StartScreen — HQ picker search, CityCard integration, skyline/gradient.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartScreen } from '@/components/StartScreen';
import type { City } from '@/types';

// --- fixture data ----------------------------------------------------------

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

// --- mock @/lib/data -------------------------------------------------------

jest.mock('@/lib/data', () => ({
  CITIES: [
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
    },
  ] as City[],
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
}));

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
});

// Re-export fixture for clarity
export { FIXTURE_CITIES, FIXTURE_CITY_IMAGES };
