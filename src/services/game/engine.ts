import type {
  BuildingEntity,
  Domain,
  Entity,
  Explosion,
  PlacementResult,
  Point,
  Projectile,
  TerrainKind,
  UnitEntity,
  UnitTypeDef,
  WavePhase,
  ZombieTypeDef,
} from '@/types/game';
import {
  CORE_TILE,
  MAP_HEIGHT,
  TERRITORY_MIN_X,
  TOWER_TILES,
  ZOMBIE_SPAWN_X,
  buildMap,
  inBounds,
  isBuildable,
  isWalkable,
  speedFactor,
} from './map';
import { findPath } from './path';
import { FORT_COST, getUnitType, pickZombieType } from './catalog';
import { mulberry32 } from './rng';

export const STARTING_GOLD = 400;
export const FIRST_BUILD_TIME = 25;
export const WAVE_BREAK = 12;

const CORE_HP = 2500;
const CAMP_HP = 350;
const FORT_WALL_HP = 600;
const MAIN_TOWER = { hp: 800, range: 7.5, damage: 16, cooldown: 1.1 };
const FORT_TOWER = { hp: 500, range: 6, damage: 12, cooldown: 1.2 };
const SPAWN_EVERY = 0.7;
const ZOMBIE_AGGRO_UNITS = 7;
const PROJECTILE_SPEED = 11;

const NEIGHBOR_OFFSETS: readonly Point[] = [
  { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
  { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 },
];

const entityCenter = (e: Entity): Point =>
  e.kind === 'building' ? { x: e.x + 0.5, y: e.y + 0.5 } : { x: e.x, y: e.y };

/** Buildings are a bit "wide", so attackers reach them a little earlier. */
const attackPadding = (e: Entity): number => (e.kind === 'building' ? 0.55 : 0);

export class GameEngine {
  readonly tiles: TerrainKind[][];
  readonly entities = new Map<number, Entity>();
  projectiles: Projectile[] = [];
  explosions: Explosion[] = [];

  gold = STARTING_GOLD;
  wave = 0;
  kills = 0;
  phase: WavePhase = 'building';
  phaseTimer = FIRST_BUILD_TIME;
  gameOver = false;
  time = 0;
  message: string | null = null;
  private messageTimer = 0;

  private pendingSpawns = 0;
  private spawnTimer = 0;
  private nextId = 1;
  private readonly rand: () => number;
  /** tileKey -> building id, for camps/towers/fort walls that block movement */
  private readonly occupied = new Map<number, number>();

  constructor(seed = 7) {
    this.rand = mulberry32(seed ^ 0x5f3759df);
    this.tiles = buildMap(seed);

    this.addBuilding({
      subtype: 'core', label: '本阵', color: '#c8a04b',
      x: CORE_TILE.x, y: CORE_TILE.y, hp: CORE_HP,
    });
    for (const t of TOWER_TILES) {
      this.addBuilding({
        subtype: 'tower', label: '箭塔', color: '#8f9398',
        x: t.x, y: t.y, hp: MAIN_TOWER.hp,
        range: MAIN_TOWER.range, damage: MAIN_TOWER.damage, attackCooldown: MAIN_TOWER.cooldown,
      });
    }
  }

  // ── Queries used by the page / renderer ────────────────────────────────────

  zombieCount(): number {
    let n = 0;
    for (const e of this.entities.values()) {
      if (e.kind === 'unit' && e.team === 'zombie') n += 1;
    }
    return n;
  }

  armyCount(): number {
    let n = 0;
    for (const e of this.entities.values()) {
      if (e.kind === 'unit' && e.team === 'player') n += 1;
    }
    return n;
  }

  canPlace(itemId: string, x: number, y: number): boolean {
    return this.validatePlacement(itemId, x, y) === null;
  }

  // ── Building placement ───────────────────────────────────────────────────

  placeItem(itemId: string, x: number, y: number): PlacementResult {
    const reason = this.validatePlacement(itemId, x, y);
    if (reason) {
      this.setMessage(reason);
      return { ok: false, reason };
    }
    if (itemId === 'fort') {
      this.gold -= FORT_COST;
      this.buildFort(x, y);
      this.setMessage('堡垒筑成!');
    } else {
      const def = getUnitType(itemId);
      if (!def) return { ok: false, reason: '未知建筑' };
      this.gold -= def.cost;
      this.addBuilding({
        subtype: 'camp', label: def.campName, color: def.campColor,
        x, y, hp: CAMP_HP, campTypeId: def.id, produceIn: 1.5,
      });
      this.setMessage(`${def.campName}已建成,开始训练${def.unitName}`);
    }
    return { ok: true };
  }

  private validatePlacement(itemId: string, x: number, y: number): string | null {
    const cost = itemId === 'fort' ? FORT_COST : getUnitType(itemId)?.cost;
    if (cost === undefined) return '未知建筑';
    if (this.gold < cost) return `金币不足(需要 ${cost})`;

    const footprint: Point[] = [];
    if (itemId === 'fort') {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) footprint.push({ x: x + dx, y: y + dy });
      }
    } else {
      footprint.push({ x, y });
    }
    for (const t of footprint) {
      if (!inBounds(t.x, t.y)) return '超出地图';
      if (t.x < TERRITORY_MIN_X) return '只能建在河东岸的我方领地';
      if (!isBuildable(this.tiles[t.y][t.x])) return '此处地形无法施工(需草地或山地)';
      if (this.occupied.has(this.tileKey(t.x, t.y))) return '此处已有建筑';
    }

    const def = itemId === 'fort' ? undefined : getUnitType(itemId);
    if (def && def.domain === 'water' && !this.hasAdjacentWater(x, y)) {
      return `${def.campName}必须紧贴河岸建造`;
    }
    return null;
  }

  private hasAdjacentWater(x: number, y: number): boolean {
    return NEIGHBOR_OFFSETS.some(
      (o) => inBounds(x + o.x, y + o.y) && this.tiles[y + o.y][x + o.x] === 'water',
    );
  }

  private buildFort(cx: number, cy: number): void {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        this.addBuilding({
          subtype: 'fortWall', label: '寨墙', color: '#80848a',
          x: cx + dx, y: cy + dy, hp: FORT_WALL_HP,
        });
      }
    }
    this.addBuilding({
      subtype: 'tower', label: '寨楼', color: '#969aa0',
      x: cx, y: cy, hp: FORT_TOWER.hp,
      range: FORT_TOWER.range, damage: FORT_TOWER.damage, attackCooldown: FORT_TOWER.cooldown,
    });
  }

  private addBuilding(
    props: Pick<BuildingEntity, 'subtype' | 'label' | 'color' | 'x' | 'y' | 'hp'> &
      Partial<Pick<BuildingEntity, 'campTypeId' | 'produceIn' | 'range' | 'damage' | 'attackCooldown'>>,
  ): BuildingEntity {
    const building: BuildingEntity = {
      kind: 'building',
      id: this.nextId,
      team: 'player',
      cooldownLeft: 0,
      maxHp: props.hp,
      ...props,
    };
    this.nextId += 1;
    this.entities.set(building.id, building);
    this.occupied.set(this.tileKey(building.x, building.y), building.id);
    return building;
  }

  // ── Unit spawning ────────────────────────────────────────────────────────

  /** Test hook + wave spawner. */
  spawnZombieAt(type: ZombieTypeDef, x: number, y: number): UnitEntity {
    const unit: UnitEntity = {
      kind: 'unit', id: this.nextId, team: 'zombie',
      typeId: type.id, name: type.name,
      x, y, hp: type.health, maxHp: type.health,
      speed: type.speed, damage: type.damage, range: 0.9, cooldown: 1.2,
      ranged: false, domain: type.domain,
      body: 'human', weapon: 'none', colors: type.colors, scale: type.scale ?? 1,
      bounty: type.bounty, campId: null, rally: null,
      cooldownLeft: 0, path: null, repathIn: 0, targetId: null, facing: 1,
    };
    this.nextId += 1;
    this.entities.set(unit.id, unit);
    return unit;
  }

  private spawnWaveZombie(): void {
    const type = pickZombieType(this.rand());
    const rows: number[] = [];
    for (let y = 2; y < MAP_HEIGHT - 2; y += 1) {
      if (isWalkable(this.tiles[y][ZOMBIE_SPAWN_X], type.domain)) rows.push(y);
    }
    const y = rows[Math.floor(this.rand() * rows.length)] ?? 14;
    this.spawnZombieAt(type, ZOMBIE_SPAWN_X + 0.5, y + 0.5);
  }

  private spawnUnitFromCamp(camp: BuildingEntity, def: UnitTypeDef): boolean {
    const spot = NEIGHBOR_OFFSETS.map((o) => ({ x: camp.x + o.x, y: camp.y + o.y })).find(
      (t) =>
        inBounds(t.x, t.y) &&
        isWalkable(this.tiles[t.y][t.x], def.domain) &&
        !this.occupied.has(this.tileKey(t.x, t.y)),
    );
    if (!spot) return false;

    const unit: UnitEntity = {
      kind: 'unit', id: this.nextId, team: 'player',
      typeId: def.id, name: def.unitName,
      x: spot.x + 0.5, y: spot.y + 0.5, hp: def.health, maxHp: def.health,
      speed: def.speed, damage: def.damage, range: def.range, cooldown: def.cooldown,
      ranged: def.ranged, aoe: def.aoe, domain: def.domain,
      body: def.body, weapon: def.weapon, colors: def.colors, scale: 1,
      bounty: 0, campId: camp.id,
      rally: { x: camp.x - 1.5, y: camp.y + 0.5 },
      cooldownLeft: 0, path: null, repathIn: 0, targetId: null, facing: -1,
    };
    this.nextId += 1;
    this.entities.set(unit.id, unit);
    return true;
  }

  // ── Main update loop ─────────────────────────────────────────────────────

  update(dt: number): void {
    if (this.gameOver) return;
    this.time += dt;
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) this.message = null;
    }

    this.updateWave(dt);
    for (const e of [...this.entities.values()]) {
      if (!this.entities.has(e.id)) continue; // killed earlier this tick
      if (e.kind === 'building') this.updateBuilding(e, dt);
      else this.updateUnit(e, dt);
    }
    this.updateProjectiles(dt);

    for (const ex of this.explosions) ex.age += dt;
    this.explosions = this.explosions.filter((ex) => ex.age < ex.ttl);
  }

  private updateWave(dt: number): void {
    if (this.phase === 'building') {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) {
        this.wave += 1;
        this.pendingSpawns = Math.min(4 + this.wave * 2, 40);
        this.spawnTimer = 0;
        this.phase = 'spawning';
        this.setMessage(`第 ${this.wave} 波僵尸来袭!`);
      }
      return;
    }
    if (this.phase === 'spawning') {
      this.spawnTimer -= dt;
      while (this.spawnTimer <= 0 && this.pendingSpawns > 0) {
        this.spawnWaveZombie();
        this.pendingSpawns -= 1;
        this.spawnTimer += SPAWN_EVERY;
      }
      if (this.pendingSpawns <= 0) this.phase = 'fighting';
      return;
    }
    if (this.zombieCount() === 0) {
      const bonus = 60 + 15 * this.wave;
      this.gold += bonus;
      this.phase = 'building';
      this.phaseTimer = WAVE_BREAK;
      this.setMessage(`第 ${this.wave} 波告捷!犒赏 +${bonus} 金币`);
    }
  }

  private updateBuilding(b: BuildingEntity, dt: number): void {
    if (b.campTypeId !== undefined && b.produceIn !== undefined) {
      const def = getUnitType(b.campTypeId);
      if (def) {
        b.produceIn -= dt;
        if (b.produceIn <= 0) {
          if (this.unitsFromCamp(b.id) < def.maxAlive && this.spawnUnitFromCamp(b, def)) {
            b.produceIn = def.produceEvery;
          } else {
            b.produceIn = 1; // crowded or full — retry shortly
          }
        }
      }
    }

    if (b.range !== undefined && b.damage !== undefined && b.attackCooldown !== undefined) {
      b.cooldownLeft = Math.max(0, (b.cooldownLeft ?? 0) - dt);
      if (b.cooldownLeft <= 0) {
        const target = this.nearestEnemy(entityCenter(b), 'player', b.range, true);
        if (target) {
          b.cooldownLeft = b.attackCooldown;
          this.fireProjectile(b, target, b.damage, undefined, '#caa46e');
        }
      }
    }
  }

  private updateUnit(u: UnitEntity, dt: number): void {
    u.cooldownLeft = Math.max(0, u.cooldownLeft - dt);
    u.repathIn -= dt;

    let target = u.targetId !== null ? this.entities.get(u.targetId) ?? null : null;
    if (!target || u.repathIn <= 0) {
      target = this.acquireTarget(u);
      u.targetId = target ? target.id : null;
    }

    const effRange = this.effectiveRange(u);

    // Swing at whatever is already in reach (lets blocked zombies chew walls)
    const inReach = this.nearestEnemy({ x: u.x, y: u.y }, this.enemyTeamOf(u), effRange, false);
    if (inReach && u.cooldownLeft <= 0) {
      u.cooldownLeft = u.cooldown;
      u.facing = entityCenter(inReach).x < u.x ? -1 : 1;
      if (u.ranged) this.fireProjectile(u, inReach, u.damage, u.aoe, this.projectileColor(u));
      else this.damageEntity(inReach, u.damage);
      return;
    }

    let goal: Point | null = null;
    if (target) {
      const c = entityCenter(target);
      if (Math.hypot(c.x - u.x, c.y - u.y) - attackPadding(target) <= effRange) return; // hold
      goal = c;
    } else if (u.rally && Math.hypot(u.rally.x - u.x, u.rally.y - u.y) > 1.5) {
      goal = u.rally;
    }
    if (!goal) return;

    if (!u.path || u.path.length === 0 || u.repathIn <= 0) {
      u.path = this.pathToward(u, goal);
      u.repathIn = 0.9 + this.rand() * 0.5;
    }
    this.followPath(u, goal, dt);
  }

  private enemyTeamOf(u: UnitEntity): 'player' | 'zombie' {
    return u.team === 'zombie' ? 'player' : 'zombie';
  }

  /** Ranged units shooting from a hilltop gain extra range (elevation bonus). */
  private effectiveRange(u: UnitEntity): number {
    const tx = Math.floor(u.x);
    const ty = Math.floor(u.y);
    const onHill = inBounds(tx, ty) && this.tiles[ty][tx] === 'hill';
    return u.range + (u.ranged && onHill ? 1.5 : 0);
  }

  private acquireTarget(u: UnitEntity): Entity | null {
    if (u.team === 'player') {
      return this.nearestEnemy({ x: u.x, y: u.y }, 'zombie', Infinity, false);
    }
    // Zombies prefer nearby troops, otherwise march on the closest building
    let bestUnit: Entity | null = null;
    let bestUnitD = Infinity;
    let bestBuilding: Entity | null = null;
    let bestBuildingD = Infinity;
    for (const e of this.entities.values()) {
      if (e.team !== 'player') continue;
      const c = entityCenter(e);
      const d = Math.hypot(c.x - u.x, c.y - u.y);
      if (e.kind === 'unit') {
        if (d < bestUnitD) { bestUnit = e; bestUnitD = d; }
      } else if (d < bestBuildingD) { bestBuilding = e; bestBuildingD = d; }
    }
    if (bestUnit && bestUnitD <= ZOMBIE_AGGRO_UNITS) return bestUnit;
    if (bestBuilding && bestBuildingD <= bestUnitD) return bestBuilding;
    return bestUnit ?? bestBuilding;
  }

  private nearestEnemy(
    from: Point,
    enemyTeam: 'player' | 'zombie',
    maxDist: number,
    unitsOnly: boolean,
  ): Entity | null {
    let best: Entity | null = null;
    let bestD = maxDist;
    for (const e of this.entities.values()) {
      if (e.team !== enemyTeam) continue;
      if (unitsOnly && e.kind !== 'unit') continue;
      const c = entityCenter(e);
      const d = Math.hypot(c.x - from.x, c.y - from.y) - attackPadding(e);
      if (d <= bestD) { best = e; bestD = d; }
    }
    return best;
  }

  private pathToward(u: UnitEntity, goal: Point): Point[] | null {
    const isFree = (x: number, y: number): boolean => !this.occupied.has(this.tileKey(x, y));
    const gx = Math.floor(goal.x);
    const gy = Math.floor(goal.y);

    const candidates: Point[] = [{ x: gx, y: gy }];
    for (const o of NEIGHBOR_OFFSETS) candidates.push({ x: gx + o.x, y: gy + o.y });
    for (const c of candidates) {
      if (!inBounds(c.x, c.y)) continue;
      if (!isWalkable(this.tiles[c.y][c.x], u.domain) || !isFree(c.x, c.y)) continue;
      const path = findPath(this.tiles, u.domain, isFree, { x: u.x, y: u.y }, c);
      if (path) return path;
    }
    return null;
  }

  private followPath(u: UnitEntity, goal: Point, dt: number): void {
    let next: Point;
    if (u.path && u.path.length > 0) {
      next = { x: u.path[0].x + 0.5, y: u.path[0].y + 0.5 };
    } else {
      // No route (walled off) — press straight ahead if the ground allows
      next = goal;
      const dirX = goal.x - u.x;
      const dirY = goal.y - u.y;
      const len = Math.hypot(dirX, dirY) || 1;
      const probeX = Math.floor(u.x + (dirX / len) * 0.6);
      const probeY = Math.floor(u.y + (dirY / len) * 0.6);
      if (
        !inBounds(probeX, probeY) ||
        !isWalkable(this.tiles[probeY][probeX], u.domain) ||
        this.occupied.has(this.tileKey(probeX, probeY))
      ) {
        return; // stand and fight whatever is in reach
      }
    }

    const tx = Math.floor(u.x);
    const ty = Math.floor(u.y);
    const factor = inBounds(tx, ty) ? speedFactor(this.tiles[ty][tx], u.domain) : 1;
    const step = u.speed * factor * dt;
    const dx = next.x - u.x;
    const dy = next.y - u.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= Math.max(step, 0.12)) {
      u.x = next.x;
      u.y = next.y;
      if (u.path && u.path.length > 0) u.path.shift();
    } else {
      u.x += (dx / dist) * step;
      u.y += (dy / dist) * step;
    }
    if (Math.abs(dx) > 0.05) u.facing = dx < 0 ? -1 : 1;
  }

  // ── Combat ───────────────────────────────────────────────────────────────

  private projectileColor(u: UnitEntity): string {
    if (u.weapon === 'rocket') return '#e65028';
    if (u.body === 'catapult' || u.body === 'ship') return '#787878';
    if (u.weapon === 'crossbow') return '#3c3c3c';
    return '#785532';
  }

  private fireProjectile(
    from: Entity,
    target: Entity,
    damage: number,
    aoe: number | undefined,
    color: string,
  ): void {
    const start = entityCenter(from);
    const at = entityCenter(target);
    this.projectiles.push({
      id: this.nextId,
      team: from.team,
      x: start.x,
      y: start.y,
      targetId: target.id,
      lastX: at.x,
      lastY: at.y,
      speed: PROJECTILE_SPEED,
      damage,
      aoe,
      color,
      big: aoe !== undefined,
    });
    this.nextId += 1;
  }

  private updateProjectiles(dt: number): void {
    const surviving: Projectile[] = [];
    for (const p of this.projectiles) {
      const target = this.entities.get(p.targetId);
      if (target) {
        const c = entityCenter(target);
        p.lastX = c.x;
        p.lastY = c.y;
      }
      const dx = p.lastX - p.x;
      const dy = p.lastY - p.y;
      const dist = Math.hypot(dx, dy);
      const step = p.speed * dt;
      if (dist <= Math.max(step, 0.25)) {
        this.impact(p, target ?? null);
      } else {
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;
        surviving.push(p);
      }
    }
    this.projectiles = surviving;
  }

  private impact(p: Projectile, target: Entity | null): void {
    if (p.aoe !== undefined) {
      const enemyTeam = p.team === 'player' ? 'zombie' : 'player';
      for (const e of [...this.entities.values()]) {
        if (e.team !== enemyTeam) continue;
        const c = entityCenter(e);
        if (Math.hypot(c.x - p.lastX, c.y - p.lastY) <= p.aoe + attackPadding(e)) {
          this.damageEntity(e, p.damage);
        }
      }
      this.explosions.push({ x: p.lastX, y: p.lastY, radius: p.aoe, age: 0, ttl: 0.45 });
    } else if (target) {
      this.damageEntity(target, p.damage);
    }
  }

  damageEntity(target: Entity, amount: number): void {
    target.hp -= amount;
    if (target.hp > 0) return;

    this.entities.delete(target.id);
    if (target.kind === 'building') {
      this.occupied.delete(this.tileKey(target.x, target.y));
      this.explosions.push({ x: target.x + 0.5, y: target.y + 0.5, radius: 1.2, age: 0, ttl: 0.6 });
      if (target.subtype === 'core') {
        this.gameOver = true;
        this.setMessage('本阵陷落……守城失败!');
      } else {
        this.setMessage(`${target.label}被摧毁了!`);
      }
      return;
    }
    if (target.team === 'zombie') {
      this.gold += target.bounty;
      this.kills += 1;
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private unitsFromCamp(campId: number): number {
    let n = 0;
    for (const e of this.entities.values()) {
      if (e.kind === 'unit' && e.campId === campId) n += 1;
    }
    return n;
  }

  isOccupied(x: number, y: number): boolean {
    return this.occupied.has(this.tileKey(x, y));
  }

  walkableFor(domain: Domain, x: number, y: number): boolean {
    return inBounds(x, y) && isWalkable(this.tiles[y][x], domain) && !this.isOccupied(x, y);
  }

  private tileKey(x: number, y: number): number {
    return y * 1000 + x;
  }

  private setMessage(text: string): void {
    this.message = text;
    this.messageTimer = 3;
  }
}
