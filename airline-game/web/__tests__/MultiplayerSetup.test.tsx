/**
 * V3.3 — MultiplayerSetup component: create room + join room flows.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiplayerSetup } from '@/components/MultiplayerSetup';
import type { City } from '@/types';

// Mock @/lib/data so we don't need the real JSON files
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
      airport: 'JFK Airport',
      airportZh: '肯尼迪机场',
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
      airport: 'Heathrow',
      airportZh: '希思罗',
      population: 14.8,
      taxRelief: 0,
      transitIndex: 9,
      terrain: 'plain' as const,
    },
  ];
  return {
    CITIES: cities,
    CITY_BY_ID: new Map(cities.map((c) => [c.id, c])),
    CITY_IMAGES: {},
    cityLabel: (id: string) => cities.find((c) => c.id === id)?.nameZh ?? id,
    cityZh: (id: string) => cities.find((c) => c.id === id)?.nameZh ?? id,
    modelName: (id: string) => id,
  };
});

const noop = () => undefined;

describe('MultiplayerSetup — top level', () => {
  it('renders create and join options', () => {
    render(
      <MultiplayerSetup
        busy={false}
        error={null}
        onCreateRoom={noop}
        onJoinRoom={noop}
        onBack={noop}
      />,
    );
    expect(screen.getByTestId('create-room-option')).toBeInTheDocument();
    expect(screen.getByTestId('join-room-option')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    const onBack = jest.fn();
    render(
      <MultiplayerSetup
        busy={false}
        error={null}
        onCreateRoom={noop}
        onJoinRoom={noop}
        onBack={onBack}
      />,
    );
    await userEvent.click(screen.getByTestId('mp-back-btn'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('MultiplayerSetup — create room flow', () => {
  it('navigates to create form on create option click', async () => {
    render(
      <MultiplayerSetup
        busy={false}
        error={null}
        onCreateRoom={noop}
        onJoinRoom={noop}
        onBack={noop}
      />,
    );
    await userEvent.click(screen.getByTestId('create-room-option'));
    // Now in create form
    expect(screen.getByTestId('mp-airline-name')).toBeInTheDocument();
    expect(screen.getByTestId('create-room-btn')).toBeInTheDocument();
  });

  it('create button starts disabled without airline name + city', async () => {
    render(
      <MultiplayerSetup
        busy={false}
        error={null}
        onCreateRoom={noop}
        onJoinRoom={noop}
        onBack={noop}
      />,
    );
    await userEvent.click(screen.getByTestId('create-room-option'));
    expect(screen.getByTestId('create-room-btn')).toBeDisabled();
  });

  it('create button enabled after filling airline name and selecting city', async () => {
    render(
      <MultiplayerSetup
        busy={false}
        error={null}
        onCreateRoom={noop}
        onJoinRoom={noop}
        onBack={noop}
      />,
    );
    await userEvent.click(screen.getByTestId('create-room-option'));
    await userEvent.type(screen.getByTestId('mp-airline-name'), '测试航空');

    // Select a city (CityCard renders as a button with aria-pressed)
    const cityBtns = screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
    await userEvent.click(cityBtns[0]);

    expect(screen.getByTestId('create-room-btn')).not.toBeDisabled();
  });

  it('calls onCreateRoom with correct params', async () => {
    const onCreateRoom = jest.fn();
    render(
      <MultiplayerSetup
        busy={false}
        error={null}
        onCreateRoom={onCreateRoom}
        onJoinRoom={noop}
        onBack={noop}
      />,
    );
    await userEvent.click(screen.getByTestId('create-room-option'));
    await userEvent.type(screen.getByTestId('mp-airline-name'), '测试航空');

    const cityBtns = screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
    await userEvent.click(cityBtns[0]); // nyc (highest demand)

    // Verify maxPlayers default is 2
    await userEvent.click(screen.getByTestId('create-room-btn'));

    expect(onCreateRoom).toHaveBeenCalledWith(
      expect.objectContaining({
        airlineName: '测试航空',
        hqCityId: 'nyc',
        maxPlayers: 2,
        fillWithAI: true,
      }),
    );
  });

  it('maxPlayers buttons change selection', async () => {
    render(
      <MultiplayerSetup
        busy={false}
        error={null}
        onCreateRoom={noop}
        onJoinRoom={noop}
        onBack={noop}
      />,
    );
    await userEvent.click(screen.getByTestId('create-room-option'));
    // Click maxPlayers=4
    await userEvent.click(screen.getByTestId('max-players-4'));
    // Button should have active style (bg-accent text-white class)
    expect(screen.getByTestId('max-players-4')).toHaveClass('bg-accent');
    expect(screen.getByTestId('max-players-2')).not.toHaveClass('bg-accent');
  });
});

describe('MultiplayerSetup — join room flow', () => {
  it('navigates to join form on join option click', async () => {
    render(
      <MultiplayerSetup
        busy={false}
        error={null}
        onCreateRoom={noop}
        onJoinRoom={noop}
        onBack={noop}
      />,
    );
    await userEvent.click(screen.getByTestId('join-room-option'));
    expect(screen.getByTestId('join-code-input')).toBeInTheDocument();
    expect(screen.getByTestId('join-room-btn')).toBeInTheDocument();
  });

  it('join button disabled without complete code + name + city', async () => {
    render(
      <MultiplayerSetup
        busy={false}
        error={null}
        onCreateRoom={noop}
        onJoinRoom={noop}
        onBack={noop}
      />,
    );
    await userEvent.click(screen.getByTestId('join-room-option'));
    // Only type partial code
    await userEvent.type(screen.getByTestId('join-code-input'), 'ABC');
    expect(screen.getByTestId('join-room-btn')).toBeDisabled();
  });

  it('join button enabled after code (6 chars) + name + city', async () => {
    render(
      <MultiplayerSetup
        busy={false}
        error={null}
        onCreateRoom={noop}
        onJoinRoom={noop}
        onBack={noop}
      />,
    );
    await userEvent.click(screen.getByTestId('join-room-option'));
    await userEvent.type(screen.getByTestId('join-code-input'), 'ABC123');
    await userEvent.type(screen.getByTestId('join-airline-name'), '挑战者');
    const cityBtns = screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
    await userEvent.click(cityBtns[0]);
    expect(screen.getByTestId('join-room-btn')).not.toBeDisabled();
  });

  it('calls onJoinRoom with correct params', async () => {
    const onJoinRoom = jest.fn();
    render(
      <MultiplayerSetup
        busy={false}
        error={null}
        onCreateRoom={noop}
        onJoinRoom={onJoinRoom}
        onBack={noop}
      />,
    );
    await userEvent.click(screen.getByTestId('join-room-option'));
    await userEvent.type(screen.getByTestId('join-code-input'), 'ABC123');
    await userEvent.type(screen.getByTestId('join-airline-name'), '挑战者');
    const cityBtns = screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
    await userEvent.click(cityBtns[0]); // nyc
    await userEvent.click(screen.getByTestId('join-room-btn'));

    expect(onJoinRoom).toHaveBeenCalledWith({
      code: 'ABC123',
      airlineName: '挑战者',
      hqCityId: 'nyc',
    });
  });

  it('code input uppercases and limits to 6 chars', async () => {
    render(
      <MultiplayerSetup
        busy={false}
        error={null}
        onCreateRoom={noop}
        onJoinRoom={noop}
        onBack={noop}
      />,
    );
    await userEvent.click(screen.getByTestId('join-room-option'));
    const codeInput = screen.getByTestId('join-code-input') as HTMLInputElement;
    await userEvent.type(codeInput, 'abcdefghij');
    // maxLength=6, uppercased
    expect(codeInput.value).toBe('ABCDEF');
  });
});
