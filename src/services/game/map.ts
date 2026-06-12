import type { Domain, Point, TerrainKind } from '@/types/game';
import { mulberry32 } from './rng';

export const MAP_WIDTH = 48;
export const MAP_HEIGHT = 30;
export const TILE_SIZE = 20;

/** Rows where the stone bridge crosses the river and the war road runs. */
export const BRIDGE_ROWS: readonly number[] = [14, 15];

/** The walled main fortress on the east side (your base). */
export const FORTRESS = { x0: 33, y0: 8, x1: 44, y1: 22 } as const;
export const GATE_ROWS: readonly number[] = [14, 15];
export const CORE_TILE: Point = { x: 39, y: 15 };
export const TOWER_TILES: readonly Point[] = [
  { x: 33, y: 8 },
  { x: 44, y: 8 },
  { x: 33, y: 22 },
  { x: 44, y: 22 },
];

/** Building is only allowed in your territory, east of the river. */
export const TERRITORY_MIN_X = 20;
export const ZOMBIE_SPAWN_X = 2;

/** The river winds north-south; this is its center column per row. */
export const riverCenterX = (y: number): number => 17 + Math.round(Math.sin(y * 0.35) * 2);

export const inBounds = (x: number, y: number): boolean =>
  x >= 0 && y >= 0 && x < MAP_WIDTH && y < MAP_HEIGHT;

export const buildMap = (seed = 7): TerrainKind[][] => {
  const rand = mulberry32(seed);
  const tiles: TerrainKind[][] = Array.from({ length: MAP_HEIGHT }, () =>
    Array.from({ length: MAP_WIDTH }, (): TerrainKind => 'grass'),
  );

  const blob = (cx: number, cy: number, r: number, kind: TerrainKind): void => {
    for (let y = cy - r; y <= cy + r; y += 1) {
      for (let x = cx - r; x <= cx + r; x += 1) {
        if (y < 1 || y >= MAP_HEIGHT - 1 || x < 1 || x >= MAP_WIDTH - 1) continue;
        if (Math.hypot(x - cx, y - cy) <= r * (0.6 + rand() * 0.45)) tiles[y][x] = kind;
      }
    }
  };

  // Rolling hills (high ground) and interior mountain clusters
  blob(7, 8, 3, 'hill');
  blob(11, 22, 3, 'hill');
  blob(26, 9, 2, 'hill');
  blob(25, 21, 2, 'hill');
  blob(39, 4, 2, 'hill');
  blob(39, 26, 2, 'hill');
  blob(9, 4, 2, 'mountain');
  blob(28, 3, 2, 'mountain');
  blob(8, 26, 2, 'mountain');
  blob(28, 27, 2, 'mountain');

  // Mountain frame around the whole battlefield
  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
        tiles[y][x] = 'mountain';
      }
    }
  }

  // River cutting the battlefield in two (it flows through the mountain frame)
  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    const cx = riverCenterX(y);
    for (let x = cx - 1; x <= cx + 1; x += 1) tiles[y][x] = 'water';
  }

  // Stone bridge across the river + the war road leading to the fortress gate
  for (const y of BRIDGE_ROWS) {
    const cx = riverCenterX(y);
    for (let x = cx - 2; x <= cx + 2; x += 1) tiles[y][x] = 'bridge';
    for (let x = 2; x < FORTRESS.x0; x += 1) {
      const kind = tiles[y][x];
      if (kind === 'grass' || kind === 'hill' || kind === 'mountain') tiles[y][x] = 'road';
    }
  }

  // Fortress: clear the interior, raise the walls, open the gate to the road
  for (let y = FORTRESS.y0; y <= FORTRESS.y1; y += 1) {
    for (let x = FORTRESS.x0; x <= FORTRESS.x1; x += 1) {
      const onEdge = y === FORTRESS.y0 || y === FORTRESS.y1 || x === FORTRESS.x0 || x === FORTRESS.x1;
      tiles[y][x] = onEdge ? 'wall' : 'grass';
    }
  }
  for (const y of GATE_ROWS) tiles[y][FORTRESS.x0] = 'gate';

  return tiles;
};

export const isWalkable = (kind: TerrainKind, domain: Domain): boolean => {
  if (kind === 'mountain' || kind === 'wall') return false;
  if (kind === 'water') return domain !== 'land';
  if (kind === 'bridge') return true; // troops march over it, boats sail under it
  return domain !== 'water';
};

/** A* step cost: hills are slow going, roads are fast, swimming is slower still. */
export const moveCost = (kind: TerrainKind, domain: Domain): number => {
  if (kind === 'hill') return 1.8;
  if (kind === 'road') return 0.9;
  if (kind === 'water' && domain === 'amphibious') return 2.2;
  return 1;
};

/** Movement speed multiplier while standing on a tile. */
export const speedFactor = (kind: TerrainKind, domain: Domain): number => {
  if (kind === 'hill') return 0.65;
  if (kind === 'road') return 1.15;
  if (kind === 'water' && domain === 'amphibious') return 0.55;
  return 1;
};

export const isBuildable = (kind: TerrainKind): boolean => kind === 'grass' || kind === 'hill';
