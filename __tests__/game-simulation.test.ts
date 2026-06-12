import { GameEngine, STARTING_GOLD } from '@/services/game/engine';

/**
 * Integration: fast-forward a real opening — build two camps, let wave 1
 * spawn, march across the bridge, fight, and get wiped out.
 */
describe('game simulation', () => {
  jest.setTimeout(30000);

  it('fights through and clears the first wave', () => {
    const engine = new GameEngine();
    expect(engine.placeItem('archer', 35, 12).ok).toBe(true);
    expect(engine.placeItem('infantry', 35, 18).ok).toBe(true);
    engine.phaseTimer = 0.1;

    for (let t = 0; t < 120; t += 0.2) {
      engine.update(0.2);
      if (engine.phase === 'building' && engine.wave === 1) break;
    }

    expect(engine.wave).toBe(1);
    expect(engine.kills).toBeGreaterThan(0);
    expect(engine.phase).toBe('building'); // the wave was cleared
    expect(engine.gameOver).toBe(false);
    // bounties + wave bonus came in on top of what was spent
    expect(engine.gold).toBeGreaterThan(STARTING_GOLD - 250);
  });
});
