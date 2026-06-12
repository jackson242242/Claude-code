// Types for the browser version of 僵尸守城 (Zombie Base Defense), a
// Koei-RTS-style top-down battlefield rendered on a 2D canvas at /game.

export type Team = 'player' | 'zombie';

/** Which tiles a unit can walk on. */
export type Domain = 'land' | 'water' | 'amphibious';

export type TerrainKind =
  | 'grass'
  | 'hill'
  | 'mountain'
  | 'water'
  | 'bridge'
  | 'road'
  | 'wall'
  | 'gate';

export interface Point {
  x: number;
  y: number;
}

export interface UnitColors {
  skin: string;
  shirt: string;
  pants: string;
}

/** How a unit is drawn on the canvas. */
export type BodyKind = 'human' | 'rider' | 'wolf' | 'ram' | 'catapult' | 'raft' | 'ship';

export type WeaponKind = 'sword' | 'bow' | 'crossbow' | 'spear' | 'club' | 'rocket' | 'none';

export interface UnitTypeDef {
  id: string;
  campName: string;
  unitName: string;
  description: string;
  cost: number;
  health: number;
  /** tiles per second */
  speed: number;
  damage: number;
  /** attack range in tiles */
  range: number;
  /** seconds between attacks */
  cooldown: number;
  ranged: boolean;
  /** splash radius in tiles for explosive shots */
  aoe?: number;
  domain: Domain;
  /** units alive at once per camp */
  maxAlive: number;
  /** seconds between trained units */
  produceEvery: number;
  body: BodyKind;
  weapon: WeaponKind;
  colors: UnitColors;
  campColor: string;
}

export interface ZombieTypeDef {
  id: string;
  name: string;
  /** spawn weighting (relative) */
  weight: number;
  bounty: number;
  health: number;
  speed: number;
  damage: number;
  domain: Domain;
  colors: UnitColors;
  /** draw scale, 1 = normal human */
  scale?: number;
}

export type BuildingSubtype = 'camp' | 'tower' | 'core' | 'fortWall';

export interface UnitEntity {
  kind: 'unit';
  id: number;
  team: Team;
  typeId: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  range: number;
  cooldown: number;
  ranged: boolean;
  aoe?: number;
  domain: Domain;
  body: BodyKind;
  weapon: WeaponKind;
  colors: UnitColors;
  scale: number;
  /** gold awarded to the player when this dies (zombies only) */
  bounty: number;
  campId: number | null;
  rally: Point | null;
  cooldownLeft: number;
  path: Point[] | null;
  repathIn: number;
  targetId: number | null;
  facing: 1 | -1;
}

export interface BuildingEntity {
  kind: 'building';
  id: number;
  team: Team;
  subtype: BuildingSubtype;
  label: string;
  color: string;
  /** tile coordinates (integers) */
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  campTypeId?: string;
  produceIn?: number;
  range?: number;
  damage?: number;
  attackCooldown?: number;
  cooldownLeft?: number;
}

export type Entity = UnitEntity | BuildingEntity;

export interface Projectile {
  id: number;
  team: Team;
  x: number;
  y: number;
  targetId: number;
  lastX: number;
  lastY: number;
  speed: number;
  damage: number;
  aoe?: number;
  color: string;
  big: boolean;
}

export interface Explosion {
  x: number;
  y: number;
  radius: number;
  age: number;
  ttl: number;
}

export type WavePhase = 'building' | 'spawning' | 'fighting';

export interface PlacementResult {
  ok: boolean;
  reason?: string;
}
