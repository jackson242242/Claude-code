import type { BuildingEntity, TerrainKind, UnitEntity } from '@/types/game';
import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from './map';
import { GameEngine } from './engine';

export const CANVAS_WIDTH = MAP_WIDTH * TILE_SIZE;
export const CANVAS_HEIGHT = MAP_HEIGHT * TILE_SIZE;

export interface HoverState {
  item: string | null;
  x: number;
  y: number;
}

const TERRAIN_BASE: Record<TerrainKind, string> = {
  grass: '#79a85c',
  hill: '#92bb6e',
  mountain: '#6b6f76',
  water: '#3f6fb4',
  bridge: '#b08a5a',
  road: '#c9b083',
  wall: '#7d8187',
  gate: '#8a6a45',
};

const shade = (x: number, y: number): number => ((x * 7 + y * 13) % 3) - 1;

const drawTerrain = (ctx: CanvasRenderingContext2D, engine: GameEngine): void => {
  const t = engine.time;
  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      const kind = engine.tiles[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;
      ctx.fillStyle = TERRAIN_BASE[kind];
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = `rgba(0,0,0,${0.03 * (shade(x, y) + 1)})`;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      if (kind === 'water') {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        const wy = py + TILE_SIZE / 2 + Math.sin(t * 2 + x * 1.3 + y) * 3;
        ctx.moveTo(px + 3, wy);
        ctx.quadraticCurveTo(px + TILE_SIZE / 2, wy - 3, px + TILE_SIZE - 3, wy);
        ctx.stroke();
      } else if (kind === 'hill') {
        ctx.strokeStyle = 'rgba(70,110,50,0.5)';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 3, 6, Math.PI, 0);
        ctx.stroke();
      } else if (kind === 'mountain') {
        ctx.fillStyle = '#565a61';
        ctx.beginPath();
        ctx.moveTo(px + 2, py + TILE_SIZE - 2);
        ctx.lineTo(px + TILE_SIZE / 2, py + 2);
        ctx.lineTo(px + TILE_SIZE - 2, py + TILE_SIZE - 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#e8edf2'; // snow cap
        ctx.beginPath();
        ctx.moveTo(px + TILE_SIZE / 2 - 4, py + 8);
        ctx.lineTo(px + TILE_SIZE / 2, py + 2);
        ctx.lineTo(px + TILE_SIZE / 2 + 4, py + 8);
        ctx.closePath();
        ctx.fill();
      } else if (kind === 'bridge') {
        ctx.strokeStyle = 'rgba(90,60,30,0.6)';
        for (let i = 1; i < 4; i += 1) {
          ctx.beginPath();
          ctx.moveTo(px + i * 5, py + 1);
          ctx.lineTo(px + i * 5, py + TILE_SIZE - 1);
          ctx.stroke();
        }
      } else if (kind === 'wall') {
        ctx.fillStyle = '#8c9096';
        ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        ctx.fillStyle = '#6d7177';
        ctx.fillRect(px + 2, py + 2, 7, 7);
        ctx.fillRect(px + 11, py + 11, 7, 7);
      } else if (kind === 'gate') {
        ctx.fillStyle = '#6e5436';
        ctx.fillRect(px + 2, py, TILE_SIZE - 4, TILE_SIZE);
        ctx.strokeStyle = '#4d3a24';
        ctx.beginPath();
        ctx.moveTo(px + TILE_SIZE / 2, py);
        ctx.lineTo(px + TILE_SIZE / 2, py + TILE_SIZE);
        ctx.stroke();
      }
    }
  }
};

const drawHpBar = (
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  width: number,
  ratio: number,
): void => {
  ctx.fillStyle = 'rgba(20,20,20,0.7)';
  ctx.fillRect(px - width / 2, py, width, 3);
  ctx.fillStyle = ratio > 0.4 ? '#5ad55a' : '#d54646';
  ctx.fillRect(px - width / 2, py, width * Math.max(0, ratio), 3);
};

const drawBuilding = (ctx: CanvasRenderingContext2D, b: BuildingEntity): void => {
  const px = b.x * TILE_SIZE;
  const py = b.y * TILE_SIZE;
  const cx = px + TILE_SIZE / 2;

  if (b.subtype === 'core') {
    ctx.fillStyle = '#9a7b3f';
    ctx.fillRect(px - 4, py + 2, TILE_SIZE + 8, TILE_SIZE - 2);
    ctx.fillStyle = '#c8a04b';
    ctx.fillRect(px - 2, py - 4, TILE_SIZE + 4, 8);
    ctx.fillStyle = '#7c6233';
    ctx.fillRect(px + 6, py + 10, 8, 10);
    ctx.strokeStyle = '#5a4726';
    ctx.beginPath();
    ctx.moveTo(cx, py - 14);
    ctx.lineTo(cx, py - 4);
    ctx.stroke();
    ctx.fillStyle = '#d04038';
    ctx.fillRect(cx, py - 14, 9, 6);
    ctx.fillStyle = '#fff';
    ctx.font = '6px sans-serif';
    ctx.fillText('帥', cx + 1.5, py - 9);
  } else if (b.subtype === 'tower') {
    ctx.fillStyle = b.color;
    ctx.fillRect(px + 3, py + 2, TILE_SIZE - 6, TILE_SIZE - 4);
    ctx.fillStyle = '#5f6368';
    for (let i = 0; i < 3; i += 1) {
      ctx.fillRect(px + 3 + i * 5, py, 3, 4);
    }
    ctx.fillStyle = '#26282b';
    ctx.fillRect(cx - 1, py + 8, 2, 6);
  } else if (b.subtype === 'fortWall') {
    ctx.fillStyle = b.color;
    ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    ctx.fillStyle = '#63676d';
    ctx.fillRect(px + 2, py + 2, 7, 7);
    ctx.fillRect(px + 11, py + 11, 7, 7);
  } else {
    // camp: little house with a colored roof and a banner
    ctx.fillStyle = '#8a7355';
    ctx.fillRect(px + 2, py + 8, TILE_SIZE - 4, TILE_SIZE - 9);
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.moveTo(px, py + 9);
    ctx.lineTo(cx, py + 1);
    ctx.lineTo(px + TILE_SIZE, py + 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4d3a24';
    ctx.fillRect(cx - 2, py + 13, 4, 6);
    ctx.strokeStyle = '#4d3a24';
    ctx.beginPath();
    ctx.moveTo(px + TILE_SIZE - 2, py - 8);
    ctx.lineTo(px + TILE_SIZE - 2, py + 8);
    ctx.stroke();
    ctx.fillStyle = b.color;
    ctx.fillRect(px + TILE_SIZE - 2, py - 8, 7, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.label, cx, py - 10);
    ctx.textAlign = 'left';
  }

  if (b.hp < b.maxHp) {
    drawHpBar(ctx, cx, py - 6, TILE_SIZE, b.hp / b.maxHp);
  }
};

const drawHuman = (ctx: CanvasRenderingContext2D, u: UnitEntity, walk: number): void => {
  const s = u.scale;
  const legSwing = walk * 2.4;
  ctx.lineWidth = 1.6 * s;

  // legs
  ctx.strokeStyle = u.colors.pants;
  ctx.beginPath();
  ctx.moveTo(0, -1 * s);
  ctx.lineTo(legSwing, 6 * s);
  ctx.moveTo(0, -1 * s);
  ctx.lineTo(-legSwing, 6 * s);
  ctx.stroke();
  // torso
  ctx.fillStyle = u.colors.shirt;
  ctx.fillRect(-2.6 * s, -8 * s, 5.2 * s, 7.4 * s);
  // arms — zombies shamble with both arms stretched forward
  ctx.strokeStyle = u.colors.skin;
  ctx.beginPath();
  if (u.team === 'zombie') {
    ctx.moveTo(0, -7 * s);
    ctx.lineTo(6 * s, -6 * s + walk);
    ctx.moveTo(0, -5.5 * s);
    ctx.lineTo(6 * s, -4.5 * s - walk);
  } else {
    ctx.moveTo(0, -7 * s);
    ctx.lineTo(3.4 * s, -3 * s + walk);
    ctx.moveTo(0, -7 * s);
    ctx.lineTo(-3.4 * s, -3 * s - walk);
  }
  ctx.stroke();
  // head
  ctx.fillStyle = u.colors.skin;
  ctx.beginPath();
  ctx.arc(0, -10.5 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.fillRect(0.8 * s, -11.2 * s, 1.2 * s, 1.2 * s); // eye

  // weapon
  ctx.lineWidth = 1.4;
  if (u.weapon === 'sword') {
    ctx.strokeStyle = '#d6d9de';
    ctx.beginPath();
    ctx.moveTo(3.4 * s, -3 * s);
    ctx.lineTo(8 * s, -9 * s);
    ctx.stroke();
  } else if (u.weapon === 'spear') {
    ctx.strokeStyle = '#82603e';
    ctx.beginPath();
    ctx.moveTo(-1 * s, 2 * s);
    ctx.lineTo(9 * s, -8 * s);
    ctx.stroke();
    ctx.fillStyle = '#c8ccd2';
    ctx.fillRect(8.4 * s, -9.4 * s, 2.4, 2.4);
  } else if (u.weapon === 'club') {
    ctx.strokeStyle = '#6e4b2d';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(3.4 * s, -3 * s);
    ctx.lineTo(7.5 * s, -8.5 * s);
    ctx.stroke();
  } else if (u.weapon === 'bow') {
    ctx.strokeStyle = '#82603e';
    ctx.beginPath();
    ctx.arc(4.5 * s, -6 * s, 4 * s, -Math.PI / 2.4, Math.PI / 2.4);
    ctx.stroke();
  } else if (u.weapon === 'crossbow') {
    ctx.strokeStyle = '#4a3a28';
    ctx.beginPath();
    ctx.moveTo(2 * s, -6 * s);
    ctx.lineTo(7 * s, -6 * s);
    ctx.moveTo(5.5 * s, -8 * s);
    ctx.lineTo(5.5 * s, -4 * s);
    ctx.stroke();
  } else if (u.weapon === 'rocket') {
    ctx.fillStyle = '#52555a';
    ctx.fillRect(-1 * s, -12 * s, 7 * s, 2.6 * s);
    ctx.fillStyle = '#e65028';
    ctx.fillRect(5 * s, -12 * s, 1.6 * s, 2.6 * s);
  }
};

const drawRider = (ctx: CanvasRenderingContext2D, u: UnitEntity, walk: number): void => {
  // horse
  ctx.fillStyle = '#6e4b2d';
  ctx.beginPath();
  ctx.ellipse(0, 1, 7.5, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5a3c23';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const leg of [-5, -2, 2, 5]) {
    ctx.moveTo(leg, 3);
    ctx.lineTo(leg + walk * (leg > 0 ? 1 : -1), 7);
  }
  ctx.stroke();
  ctx.fillStyle = '#6e4b2d';
  ctx.fillRect(6, -4.5, 3.4, 4); // head
  // rider
  ctx.fillStyle = u.colors.shirt;
  ctx.fillRect(-2.4, -9, 4.8, 7);
  ctx.fillStyle = u.colors.skin;
  ctx.beginPath();
  ctx.arc(0, -11, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#82603e';
  ctx.beginPath();
  ctx.moveTo(-2, -2);
  ctx.lineTo(9, -10);
  ctx.stroke();
};

const drawWolf = (ctx: CanvasRenderingContext2D, walk: number): void => {
  ctx.fillStyle = '#6e6e73';
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(5.5, -4, 4, 3.4); // head
  ctx.beginPath(); // ears
  ctx.moveTo(6, -4);
  ctx.lineTo(7, -6.5);
  ctx.lineTo(8, -4);
  ctx.fill();
  ctx.strokeStyle = '#56565b';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const leg of [-4.5, -1.5, 1.5, 4.5]) {
    ctx.moveTo(leg, 2.5);
    ctx.lineTo(leg + walk * (leg > 0 ? 1 : -1), 6);
  }
  ctx.moveTo(-7, -1);
  ctx.lineTo(-10, -3.5); // tail
  ctx.stroke();
};

const drawRam = (ctx: CanvasRenderingContext2D): void => {
  ctx.fillStyle = '#694b32';
  ctx.fillRect(-9, -8, 18, 9);
  ctx.fillStyle = '#523a26';
  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.lineTo(0, -12);
  ctx.lineTo(10, -8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3f2d1d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(4, -3);
  ctx.lineTo(14, -3); // ram log
  ctx.stroke();
  ctx.fillStyle = '#2e2218';
  for (const wx of [-5, 5]) {
    ctx.beginPath();
    ctx.arc(wx, 2.5, 3, 0, Math.PI * 2);
    ctx.fill();
  }
};

const drawCatapult = (ctx: CanvasRenderingContext2D): void => {
  ctx.fillStyle = '#82643c';
  ctx.fillRect(-8, -3, 16, 5);
  ctx.fillStyle = '#2e2218';
  for (const wx of [-5, 5]) {
    ctx.beginPath();
    ctx.arc(wx, 3, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#6b5232';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-4, -3);
  ctx.lineTo(7, -12);
  ctx.stroke();
  ctx.fillStyle = '#55565a';
  ctx.beginPath();
  ctx.arc(7.5, -12.5, 2.4, 0, Math.PI * 2);
  ctx.fill();
};

const drawRaft = (ctx: CanvasRenderingContext2D, bob: number): void => {
  ctx.fillStyle = '#a0825a';
  ctx.fillRect(-8, -4 + bob, 16, 9);
  ctx.strokeStyle = '#7c6342';
  ctx.lineWidth = 1;
  for (let i = -6; i <= 6; i += 3) {
    ctx.beginPath();
    ctx.moveTo(i, -4 + bob);
    ctx.lineTo(i, 5 + bob);
    ctx.stroke();
  }
  ctx.strokeStyle = '#6b5232';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -4 + bob);
  ctx.lineTo(0, -11 + bob);
  ctx.stroke();
};

const drawShip = (ctx: CanvasRenderingContext2D, bob: number): void => {
  ctx.fillStyle = '#503c2d';
  ctx.beginPath();
  ctx.moveTo(-10, -2 + bob);
  ctx.lineTo(10, -2 + bob);
  ctx.lineTo(13, 1 + bob);
  ctx.lineTo(6, 5 + bob);
  ctx.lineTo(-8, 5 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3c2d22';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -2 + bob);
  ctx.lineTo(0, -14 + bob);
  ctx.stroke();
  ctx.fillStyle = '#ece8dc';
  ctx.beginPath();
  ctx.moveTo(0, -14 + bob);
  ctx.lineTo(9, -5 + bob);
  ctx.lineTo(0, -5 + bob);
  ctx.closePath();
  ctx.fill();
};

const drawUnit = (ctx: CanvasRenderingContext2D, u: UnitEntity, time: number): void => {
  const px = u.x * TILE_SIZE;
  const py = u.y * TILE_SIZE;
  const walk = Math.sin(time * 8 + u.id * 1.7);
  const bob = Math.sin(time * 3 + u.id) * 1.2;

  ctx.save();
  ctx.translate(px, py);
  ctx.scale(u.facing, 1);

  if (u.body === 'human') drawHuman(ctx, u, walk);
  else if (u.body === 'rider') drawRider(ctx, u, walk);
  else if (u.body === 'wolf') drawWolf(ctx, walk);
  else if (u.body === 'ram') drawRam(ctx);
  else if (u.body === 'catapult') drawCatapult(ctx);
  else if (u.body === 'raft') drawRaft(ctx, bob);
  else drawShip(ctx, bob);

  ctx.restore();

  if (u.hp < u.maxHp) {
    drawHpBar(ctx, px, py - 16 * u.scale, 14 * u.scale, u.hp / u.maxHp);
  }
};

const drawProjectiles = (ctx: CanvasRenderingContext2D, engine: GameEngine): void => {
  for (const p of engine.projectiles) {
    const px = p.x * TILE_SIZE;
    const py = p.y * TILE_SIZE;
    if (p.big) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const angle = Math.atan2(p.lastY - p.y, p.lastX - p.x);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(angle) * 8, py + Math.sin(angle) * 8);
      ctx.stroke();
    }
  }
  for (const ex of engine.explosions) {
    const progress = ex.age / ex.ttl;
    const radius = ex.radius * TILE_SIZE * (0.4 + progress * 0.6);
    ctx.strokeStyle = `rgba(230, 120, 40, ${1 - progress})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ex.x * TILE_SIZE, ex.y * TILE_SIZE, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
};

const drawPlacement = (
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  hover: HoverState,
): void => {
  if (!hover.item) return;
  const ok = engine.canPlace(hover.item, hover.x, hover.y);
  const size = hover.item === 'fort' ? 3 : 1;
  const offset = hover.item === 'fort' ? 1 : 0;
  ctx.fillStyle = ok ? 'rgba(80, 220, 100, 0.4)' : 'rgba(220, 70, 60, 0.4)';
  ctx.fillRect(
    (hover.x - offset) * TILE_SIZE,
    (hover.y - offset) * TILE_SIZE,
    size * TILE_SIZE,
    size * TILE_SIZE,
  );
  ctx.strokeStyle = ok ? '#3cb45a' : '#c83c32';
  ctx.lineWidth = 2;
  ctx.strokeRect(
    (hover.x - offset) * TILE_SIZE,
    (hover.y - offset) * TILE_SIZE,
    size * TILE_SIZE,
    size * TILE_SIZE,
  );
};

export const drawGame = (
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  hover: HoverState | null,
): void => {
  drawTerrain(ctx, engine);

  const buildings: BuildingEntity[] = [];
  const units: UnitEntity[] = [];
  for (const e of engine.entities.values()) {
    if (e.kind === 'building') buildings.push(e);
    else units.push(e);
  }
  for (const b of buildings) drawBuilding(ctx, b);
  units.sort((a, b) => a.y - b.y);
  for (const u of units) drawUnit(ctx, u, engine.time);

  drawProjectiles(ctx, engine);
  if (hover) drawPlacement(ctx, engine, hover);
};
