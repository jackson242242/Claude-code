import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AircraftCard } from '@/components/AircraftCard';
import type { AircraftImageEntry, AircraftModel } from '@/types';

const model: AircraftModel = {
  id: 'a320neo',
  manufacturer: 'Airbus',
  name: 'A320neo',
  seats: 165,
  rangeKm: 6300,
  cruiseKmh: 833,
  price: 111_000_000,
  fuelKgPerKm: 2.5,
  introduced: 2016,
};

const image: AircraftImageEntry = {
  url: 'https://commons.wikimedia.org/wiki/Special:FilePath/a320neo.jpg?width=1280',
  filePage: 'https://commons.wikimedia.org/wiki/File:a320neo.jpg',
  credit: 'Photo via Wikimedia Commons（作者与许可证见文件页）',
};

const noop = () => undefined;

describe('AircraftCard', () => {
  it('renders the photo (lazy) plus seats, range and price', () => {
    render(
      <AircraftCard model={model} image={image} cash={500_000_000} busy={false} onBuy={noop} onLease={noop} />,
    );

    const img = screen.getByRole('img', { name: 'Airbus A320neo' });
    expect(img).toHaveAttribute('src', image.url);
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(screen.getByText('165')).toBeInTheDocument();
    expect(screen.getByText('6,300 km')).toBeInTheDocument();
    expect(screen.getByText('$111M')).toBeInTheDocument();
    expect(screen.queryByTestId('aircraft-silhouette')).not.toBeInTheDocument();
  });

  it('falls back to the silhouette when the image fails to load', () => {
    render(
      <AircraftCard model={model} image={image} cash={500_000_000} busy={false} onBuy={noop} onLease={noop} />,
    );

    fireEvent.error(screen.getByRole('img', { name: 'Airbus A320neo' }));

    expect(screen.getByTestId('aircraft-silhouette')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Airbus A320neo' })).not.toBeInTheDocument();
  });

  it('shows the silhouette directly when no manifest entry exists', () => {
    render(
      <AircraftCard model={model} cash={500_000_000} busy={false} onBuy={noop} onLease={noop} />,
    );

    expect(screen.getByTestId('aircraft-silhouette')).toBeInTheDocument();
  });

  it('fires onBuy / onLease with the model id', async () => {
    const user = userEvent.setup();
    const onBuy = jest.fn();
    const onLease = jest.fn();
    render(
      <AircraftCard model={model} image={image} cash={500_000_000} busy={false} onBuy={onBuy} onLease={onLease} />,
    );

    await user.click(screen.getByRole('button', { name: '购买' }));
    await user.click(screen.getByRole('button', { name: '租赁' }));

    expect(onBuy).toHaveBeenCalledWith('a320neo');
    expect(onLease).toHaveBeenCalledWith('a320neo');
  });

  it('disables 购买 when cash is below the price but keeps 租赁 enabled', () => {
    render(
      <AircraftCard model={model} image={image} cash={1_000_000} busy={false} onBuy={noop} onLease={noop} />,
    );

    expect(screen.getByRole('button', { name: '购买' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '租赁' })).toBeEnabled();
  });

  it('shows the badge pill when the model has one', () => {
    render(
      <AircraftCard
        model={{ ...model, id: 'b777-9', name: '777-9', badge: '2026 新机型' }}
        cash={500_000_000}
        busy={false}
        onBuy={noop}
        onLease={noop}
      />,
    );

    expect(screen.getByText('2026 新机型')).toBeInTheDocument();
  });
});
