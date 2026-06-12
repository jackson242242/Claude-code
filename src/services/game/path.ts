import type { Domain, Point, TerrainKind } from '@/types/game';
import { MAP_WIDTH, MAP_HEIGHT, inBounds, isWalkable, moveCost } from './map';

interface PathNode {
  x: number;
  y: number;
  g: number;
  f: number;
  parent: PathNode | null;
}

const NEIGHBORS: readonly Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

const MAX_EXPANSIONS = MAP_WIDTH * MAP_HEIGHT * 4;

/**
 * A* over the tile grid. `isFree` lets the engine mark tiles occupied by
 * buildings as blocked. Returns tile waypoints excluding the start tile,
 * or null when the goal is unreachable.
 */
export const findPath = (
  tiles: TerrainKind[][],
  domain: Domain,
  isFree: (x: number, y: number) => boolean,
  start: Point,
  goal: Point,
): Point[] | null => {
  const sx = Math.floor(start.x);
  const sy = Math.floor(start.y);
  const gx = Math.floor(goal.x);
  const gy = Math.floor(goal.y);
  if (!inBounds(gx, gy) || !isWalkable(tiles[gy][gx], domain) || !isFree(gx, gy)) return null;
  if (sx === gx && sy === gy) return [];

  const key = (x: number, y: number): number => y * MAP_WIDTH + x;
  const heuristic = (x: number, y: number): number => Math.abs(x - gx) + Math.abs(y - gy);

  const open: PathNode[] = [{ x: sx, y: sy, g: 0, f: heuristic(sx, sy), parent: null }];
  const bestG = new Map<number, number>([[key(sx, sy), 0]]);
  const closed = new Set<number>();

  for (let i = 0; i < MAX_EXPANSIONS && open.length > 0; i += 1) {
    let bestIdx = 0;
    for (let j = 1; j < open.length; j += 1) {
      if (open[j].f < open[bestIdx].f) bestIdx = j;
    }
    const node = open.splice(bestIdx, 1)[0];
    const nodeKey = key(node.x, node.y);
    if (closed.has(nodeKey)) continue;
    closed.add(nodeKey);

    if (node.x === gx && node.y === gy) {
      const waypoints: Point[] = [];
      let cur: PathNode | null = node;
      while (cur && cur.parent) {
        waypoints.push({ x: cur.x, y: cur.y });
        cur = cur.parent;
      }
      waypoints.reverse();
      return waypoints;
    }

    for (const step of NEIGHBORS) {
      const nx = node.x + step.x;
      const ny = node.y + step.y;
      if (!inBounds(nx, ny)) continue;
      const kind = tiles[ny][nx];
      if (!isWalkable(kind, domain)) continue;
      if (!isFree(nx, ny)) continue;
      const nKey = key(nx, ny);
      if (closed.has(nKey)) continue;
      const g = node.g + moveCost(kind, domain);
      const seen = bestG.get(nKey);
      if (seen !== undefined && seen <= g) continue;
      bestG.set(nKey, g);
      open.push({ x: nx, y: ny, g, f: g + heuristic(nx, ny), parent: node });
    }
  }
  return null;
};
