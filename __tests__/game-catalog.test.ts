import {
  FORT_COST,
  FORT_ITEM,
  UNIT_TYPES,
  ZOMBIE_TYPES,
  getUnitType,
  getZombieType,
  pickZombieType,
} from '@/services/game/catalog';

describe('unit catalog', () => {
  it('covers all twelve requested unit types', () => {
    const ids = UNIT_TYPES.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining([
        'infantry', 'archer', 'crossbow', 'cavalry', 'barbarian', 'marine',
        'beast', 'rocket', 'ram', 'catapult', 'raft', 'ship',
      ]),
    );
    expect(UNIT_TYPES).toHaveLength(12);
  });

  it('gives every camp sane production stats', () => {
    for (const u of UNIT_TYPES) {
      expect(u.cost).toBeGreaterThan(0);
      expect(u.health).toBeGreaterThan(0);
      expect(u.speed).toBeGreaterThan(0);
      expect(u.maxAlive).toBeGreaterThan(0);
      expect(u.produceEvery).toBeGreaterThan(0);
      if (u.ranged) expect(u.range).toBeGreaterThan(2);
      else expect(u.range).toBeLessThanOrEqual(1.5);
    }
  });

  it('puts boats on water and marines in both domains', () => {
    expect(getUnitType('ship')?.domain).toBe('water');
    expect(getUnitType('raft')?.domain).toBe('water');
    expect(getUnitType('marine')?.domain).toBe('amphibious');
    expect(getUnitType('infantry')?.domain).toBe('land');
  });

  it('exposes the fort as a separate buildable', () => {
    expect(FORT_ITEM.id).toBe('fort');
    expect(FORT_ITEM.cost).toBe(FORT_COST);
    expect(getUnitType('fort')).toBeUndefined();
  });

  it('has three zombie variants with bounties', () => {
    expect(ZOMBIE_TYPES).toHaveLength(3);
    for (const z of ZOMBIE_TYPES) {
      expect(z.bounty).toBeGreaterThan(0);
      expect(z.health).toBeGreaterThan(0);
    }
    expect(getZombieType('brute')?.scale).toBeGreaterThan(1);
  });

  it('picks zombie types across the whole weight range', () => {
    expect(pickZombieType(0).id).toBe('walker');
    expect(pickZombieType(0.99).id).toBe('brute');
    const picked = new Set<string>();
    for (let roll = 0; roll < 1; roll += 0.05) picked.add(pickZombieType(roll).id);
    expect(picked.size).toBe(3);
  });
});
