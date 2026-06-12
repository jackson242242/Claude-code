import { GameEngine, STARTING_GOLD } from '@/services/game/engine';
import { FORT_COST, ZOMBIE_TYPES, getUnitType } from '@/services/game/catalog';

const stepEngine = (engine: GameEngine, seconds: number, dt = 0.2): void => {
  for (let t = 0; t < seconds; t += dt) engine.update(dt);
};

describe('GameEngine', () => {
  it('starts with the fortress garrison: core + four towers', () => {
    const engine = new GameEngine();
    expect(engine.gold).toBe(STARTING_GOLD);
    const buildings = [...engine.entities.values()].filter((e) => e.kind === 'building');
    expect(buildings.filter((b) => b.kind === 'building' && b.subtype === 'core')).toHaveLength(1);
    expect(buildings.filter((b) => b.kind === 'building' && b.subtype === 'tower')).toHaveLength(4);
  });

  it('builds a camp inside the fortress and deducts gold', () => {
    const engine = new GameEngine();
    const result = engine.placeItem('infantry', 36, 12);
    expect(result.ok).toBe(true);
    expect(engine.gold).toBe(STARTING_GOLD - getUnitType('infantry')!.cost);
    expect(engine.isOccupied(36, 12)).toBe(true);
  });

  it('rejects building on water, in enemy territory, or twice on the same tile', () => {
    const engine = new GameEngine();
    expect(engine.placeItem('infantry', 18, 20).ok).toBe(false); // river
    expect(engine.placeItem('infantry', 5, 5).ok).toBe(false); // west bank
    expect(engine.placeItem('infantry', 36, 12).ok).toBe(true);
    expect(engine.placeItem('archer', 36, 12).ok).toBe(false); // occupied
  });

  it('rejects camps the player cannot afford', () => {
    const engine = new GameEngine();
    expect(engine.placeItem('fort', 28, 20).ok).toBe(false); // 500 > 400
    expect(engine.gold).toBe(STARTING_GOLD);
  });

  it('requires shipyards to touch the river and lets them launch boats', () => {
    const engine = new GameEngine();
    expect(engine.placeItem('ship', 36, 12).ok).toBe(false); // dry land
    const result = engine.placeItem('ship', 21, 4); // east bank, next to water
    expect(result.ok).toBe(true);
    stepEngine(engine, 3);
    const boats = [...engine.entities.values()].filter(
      (e) => e.kind === 'unit' && e.typeId === 'ship',
    );
    expect(boats.length).toBeGreaterThanOrEqual(1);
  });

  it('trains troops from a camp over time, up to the cap', () => {
    const engine = new GameEngine();
    engine.placeItem('infantry', 36, 12);
    stepEngine(engine, 2.5);
    expect(engine.armyCount()).toBeGreaterThanOrEqual(1);
    const def = getUnitType('infantry')!;
    stepEngine(engine, def.produceEvery * (def.maxAlive + 2));
    const troops = [...engine.entities.values()].filter(
      (e) => e.kind === 'unit' && e.typeId === 'infantry',
    );
    expect(troops.length).toBeLessThanOrEqual(def.maxAlive);
  });

  it('builds a 3x3 fort with eight walls and a central tower', () => {
    const engine = new GameEngine();
    engine.gold = 1000;
    const result = engine.placeItem('fort', 28, 20);
    expect(result.ok).toBe(true);
    expect(engine.gold).toBe(1000 - FORT_COST);
    const walls = [...engine.entities.values()].filter(
      (e) => e.kind === 'building' && e.subtype === 'fortWall',
    );
    expect(walls).toHaveLength(8);
    expect(engine.isOccupied(28, 20)).toBe(true); // the central tower
  });

  it('pays a bounty when a zombie dies', () => {
    const engine = new GameEngine();
    const walker = ZOMBIE_TYPES[0];
    const zombie = engine.spawnZombieAt(walker, 5.5, 14.5);
    expect(engine.zombieCount()).toBe(1);
    engine.damageEntity(zombie, 9999);
    expect(engine.zombieCount()).toBe(0);
    expect(engine.gold).toBe(STARTING_GOLD + walker.bounty);
    expect(engine.kills).toBe(1);
  });

  it('starts wave one after the build phase and spawns zombies', () => {
    const engine = new GameEngine();
    engine.phaseTimer = 0.1;
    stepEngine(engine, 6);
    expect(engine.wave).toBe(1);
    expect(engine.zombieCount()).toBeGreaterThan(0);
  });

  it('zombies march toward the base and damage buildings they reach', () => {
    const engine = new GameEngine();
    const brute = ZOMBIE_TYPES[2];
    const zombie = engine.spawnZombieAt(brute, 35.5, 12.5); // already inside the walls
    const camp = engine.placeItem('infantry', 36, 12);
    expect(camp.ok).toBe(true);
    const building = [...engine.entities.values()].find(
      (e) => e.kind === 'building' && e.subtype === 'camp',
    );
    stepEngine(engine, 6);
    expect(zombie.hp).toBeLessThanOrEqual(brute.health); // towers shot at it
    expect(building && building.hp < building.maxHp).toBe(true);
  });

  it('ends the game when the core falls', () => {
    const engine = new GameEngine();
    const core = [...engine.entities.values()].find(
      (e) => e.kind === 'building' && e.subtype === 'core',
    );
    expect(core).toBeDefined();
    engine.damageEntity(core!, 999999);
    expect(engine.gameOver).toBe(true);
    engine.update(1); // updates are a no-op after defeat
    expect(engine.gameOver).toBe(true);
  });
});
