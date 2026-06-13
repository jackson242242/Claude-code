import { render, screen } from '@testing-library/react';
import { WorldMap } from '@/components/WorldMap';
import type { Competitor } from '@/types';

const competitorsFixture: Competitor[] = [
  {
    id: 'ai-aurora',
    name: 'Aurora Pacific',
    nameZh: '极光太平洋航空',
    hqCityId: 'hnd',
    fareMult: 0.9,
    style: 'budget',
    routes: [
      { cityA: 'hnd', cityB: 'pvg', weeklySeats: 2200 },
      { cityA: 'hnd', cityB: 'sin', weeklySeats: 2200 },
    ],
    marketShare: 0.12,
  },
  {
    id: 'ai-falcon',
    name: 'Falcon Dunes',
    nameZh: '沙丘猎鹰航空',
    hqCityId: 'dxb',
    fareMult: 1.0,
    style: 'network',
    routes: [{ cityA: 'dxb', cityB: 'cdg', weeklySeats: 2000 }],
    marketShare: 0.08,
  },
];

describe('WorldMap competitor arcs', () => {
  it('renders one faded arc per competitor route, behind the player arcs', () => {
    render(
      <WorldMap
        hqCityId="nyc"
        routes={[]}
        competitors={competitorsFixture}
        selectedCityId={null}
        onSelectCity={() => undefined}
      />,
    );

    const arcs = screen.getAllByTestId('competitor-arc');
    expect(arcs).toHaveLength(3);
    arcs.forEach((arc) => {
      expect(arc.getAttribute('d')).toBeTruthy();
      expect(arc).toHaveAttribute('opacity', '0.35');
    });
  });

  it('renders no competitor arcs when there are no competitors', () => {
    render(
      <WorldMap
        hqCityId="nyc"
        routes={[]}
        competitors={[]}
        selectedCityId={null}
        onSelectCity={() => undefined}
      />,
    );

    expect(screen.queryByTestId('competitor-arc')).not.toBeInTheDocument();
  });
});
