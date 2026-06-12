import {
  BRIDGE_ROWS,
  CORE_TILE,
  FORTRESS,
  GATE_ROWS,
  MAP_HEIGHT,
  MAP_WIDTH,
  buildMap,
  isBuildable,
  isWalkable,
  moveCost,
  riverCenterX,
  speedFactor,
} from '@/services/game/map';
import { findPath } from '@/services/game/path';

describe('game map', () => {
  const tiles = buildMap();
  const free = (): boolean => true;

  it('has the expected dimensions and a mountain frame', () => {
    expect(tiles).toHaveLength(MAP_HEIGHT);
    expect(tiles[0]).toHaveLength(MAP_WIDTH);
    expect(tiles[0][10]).toBe('mountain');
    expect(tiles[MAP_HEIGHT - 1][10]).toBe('mountain');
  });

  it('has a river running the full height of the map', () => {
    for (let y = 1; y < MAP_HEIGHT - 1; y += 1) {
      if (BRIDGE_ROWS.includes(y)) continue;
      const waterCount = tiles[y].filter((k) => k === 'water').length;
      expect(waterCount).toBeGreaterThanOrEqual(3);
    }
  });

  it('has a bridge crossing the river on the war-road rows', () => {
    for (const y of BRIDGE_ROWS) {
      const cx = riverCenterX(y);
      expect(tiles[y][cx]).toBe('bridge');
    }
  });

  it('walls the fortress with a gate on the west side', () => {
    expect(tiles[FORTRESS.y0][FORTRESS.x0]).toBe('wall');
    expect(tiles[FORTRESS.y1][FORTRESS.x1]).toBe('wall');
    for (const y of GATE_ROWS) expect(tiles[y][FORTRESS.x0]).toBe('gate');
  });

  it('lets land troops march from the zombie spawn through bridge and gate to the core', () => {
    const path = findPath(
      tiles,
      'land',
      free,
      { x: 2, y: 14 },
      { x: CORE_TILE.x - 1, y: CORE_TILE.y },
    );
    expect(path).not.toBeNull();
    const crossesBridge = path!.some((p) => tiles[p.y][p.x] === 'bridge');
    const entersGate = path!.some((p) => tiles[p.y][p.x] === 'gate');
    expect(crossesBridge).toBe(true);
    expect(entersGate).toBe(true);
  });

  it('keeps land units out of water and mountains, but boats on water', () => {
    expect(isWalkable('water', 'land')).toBe(false);
    expect(isWalkable('water', 'water')).toBe(true);
    expect(isWalkable('water', 'amphibious')).toBe(true);
    expect(isWalkable('mountain', 'land')).toBe(false);
    expect(isWalkable('grass', 'water')).toBe(false);
    expect(isWalkable('bridge', 'water')).toBe(true);
  });

  it('lets boats travel along the river', () => {
    const top = { x: riverCenterX(3), y: 3 };
    const bottom = { x: riverCenterX(26), y: 26 };
    const path = findPath(tiles, 'water', free, top, bottom);
    expect(path).not.toBeNull();
  });

  it('makes hills slow and costly, roads fast', () => {
    expect(moveCost('hill', 'land')).toBeGreaterThan(moveCost('grass', 'land'));
    expect(moveCost('road', 'land')).toBeLessThan(moveCost('grass', 'land'));
    expect(speedFactor('hill', 'land')).toBeLessThan(1);
    expect(speedFactor('road', 'land')).toBeGreaterThan(1);
  });

  it('only allows building on grass and hills', () => {
    expect(isBuildable('grass')).toBe(true);
    expect(isBuildable('hill')).toBe(true);
    expect(isBuildable('water')).toBe(false);
    expect(isBuildable('road')).toBe(false);
    expect(isBuildable('bridge')).toBe(false);
    expect(isBuildable('wall')).toBe(false);
  });

  it('returns null when the goal is unreachable', () => {
    expect(findPath(tiles, 'land', free, { x: 2, y: 14 }, { x: 0, y: 0 })).toBeNull();
  });
});
