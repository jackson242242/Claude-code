import { GameEngine } from '@/services/game/engine';
import { drawGame } from '@/services/game/render';
import { ZOMBIE_TYPES, UNIT_TYPES } from '@/services/game/catalog';
import type { UnitEntity } from '@/types/game';

/** jsdom has no 2D context, so paint into a recording stub instead. */
const createStubContext = (): CanvasRenderingContext2D => {
  const target: Record<string | symbol, unknown> = {};
  return new Proxy(target, {
    get: (obj, prop) => {
      if (prop === 'measureText') return () => ({ width: 10 });
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => ({ addColorStop: (): void => undefined });
      }
      if (!(prop in obj)) obj[prop] = jest.fn();
      return obj[prop];
    },
    set: (obj, prop, value) => {
      obj[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
};

describe('game renderer', () => {
  it('draws a full battlefield without throwing', () => {
    const engine = new GameEngine();
    engine.gold = 5000;
    engine.placeItem('infantry', 36, 12);
    engine.placeItem('fort', 28, 20);
    engine.spawnZombieAt(ZOMBIE_TYPES[0], 5.5, 14.5);
    engine.spawnZombieAt(ZOMBIE_TYPES[2], 6.5, 16.5);
    engine.update(0.2);

    const ctx = createStubContext();
    expect(() => drawGame(ctx, engine, { item: 'fort', x: 25, y: 20 })).not.toThrow();
    expect(() => drawGame(ctx, engine, { item: 'infantry', x: 18, y: 20 })).not.toThrow();
    expect(() => drawGame(ctx, engine, null)).not.toThrow();
  });

  it('draws every unit body and weapon variant without throwing', () => {
    const engine = new GameEngine();
    const ctx = createStubContext();
    let offset = 0;
    for (const def of UNIT_TYPES) {
      const unit: UnitEntity = engine.spawnZombieAt(ZOMBIE_TYPES[0], 24.5 + offset, 22.5);
      unit.team = 'player';
      unit.body = def.body;
      unit.weapon = def.weapon;
      unit.colors = def.colors;
      unit.hp = unit.maxHp / 2; // exercises the hp bar
      offset += 0.5;
    }
    expect(() => drawGame(ctx, engine, null)).not.toThrow();
  });
});
