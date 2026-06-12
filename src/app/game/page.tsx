'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { GameEngine, STARTING_GOLD } from '@/services/game/engine';
import { CANVAS_WIDTH, CANVAS_HEIGHT, drawGame } from '@/services/game/render';
import type { HoverState } from '@/services/game/render';
import { FORT_ITEM, UNIT_TYPES } from '@/services/game/catalog';
import { TILE_SIZE } from '@/services/game/map';

interface HudState {
  gold: number;
  wave: number;
  kills: number;
  army: number;
  zombies: number;
  phase: string;
  countdown: number;
  message: string | null;
  gameOver: boolean;
}

const INITIAL_HUD: HudState = {
  gold: STARTING_GOLD,
  wave: 0,
  kills: 0,
  army: 0,
  zombies: 0,
  phase: 'building',
  countdown: 0,
  message: null,
  gameOver: false,
};

interface BuildOption {
  id: string;
  campName: string;
  unitName: string;
  cost: number;
  campColor: string;
  description: string;
}

const BUILD_OPTIONS: BuildOption[] = [
  ...UNIT_TYPES.map((u) => ({
    id: u.id,
    campName: u.campName,
    unitName: u.unitName,
    cost: u.cost,
    campColor: u.campColor,
    description: u.description,
  })),
  { ...FORT_ITEM },
];

const GamePage = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine>(new GameEngine());
  const hoverRef = useRef<HoverState>({ item: null, x: -1, y: -1 });
  const [selected, setSelected] = useState<string | null>(null);
  const [hud, setHud] = useState<HudState>(INITIAL_HUD);
  const [resetCount, setResetCount] = useState(0);

  useEffect(() => {
    hoverRef.current.item = selected;
  }, [selected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext('2d') : null;
    const engine = engineRef.current;
    let frame = 0;
    let last = performance.now();
    let hudTimer = 0;

    const loop = (now: number): void => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      engine.update(dt);

      hudTimer -= dt;
      if (hudTimer <= 0) {
        hudTimer = 0.15;
        setHud({
          gold: engine.gold,
          wave: engine.wave,
          kills: engine.kills,
          army: engine.armyCount(),
          zombies: engine.zombieCount(),
          phase: engine.phase,
          countdown: Math.max(0, Math.ceil(engine.phaseTimer)),
          message: engine.message,
          gameOver: engine.gameOver,
        });
      }

      if (ctx) drawGame(ctx, engine, hoverRef.current);
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [resetCount]);

  const tileFromEvent = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: -1, y: -1 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: Math.floor(((event.clientX - rect.left) * scaleX) / TILE_SIZE),
      y: Math.floor(((event.clientY - rect.top) * scaleY) / TILE_SIZE),
    };
  }, []);

  const handleMove = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      const tile = tileFromEvent(event);
      hoverRef.current.x = tile.x;
      hoverRef.current.y = tile.y;
    },
    [tileFromEvent],
  );

  const handleClick = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      if (!selected) return;
      const tile = tileFromEvent(event);
      const result = engineRef.current.placeItem(selected, tile.x, tile.y);
      if (result.ok) setSelected(null);
    },
    [selected, tileFromEvent],
  );

  const restart = useCallback(() => {
    engineRef.current = new GameEngine();
    setSelected(null);
    setHud(INITIAL_HUD);
    setResetCount((n) => n + 1);
  }, []);

  const phaseText =
    hud.phase === 'building'
      ? `休整中,第 ${hud.wave + 1} 波 ${hud.countdown}s 后来袭`
      : `第 ${hud.wave} 波激战中`;

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '16px 8px', color: '#e8e4d8' }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>僵尸守城 · 三国风战场</h1>
      <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
        群山环抱,大河分界:僵尸从西岸渡桥(奔跑者还会泅水)进攻东岸你的主城。
        杀敌得金币 → 点选下方建筑 → 在河东岸落地。山地射程加成、行军减速;水军船坞要贴河岸。守住「本阵」!
      </p>

      <div
        style={{
          display: 'flex',
          gap: 16,
          fontSize: 14,
          fontWeight: 600,
          padding: '6px 10px',
          background: '#26241e',
          borderRadius: 8,
          marginBottom: 6,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ color: '#f0c860' }}>💰 {hud.gold}</span>
        <span>{phaseText}</span>
        <span>⚔️ 我军 {hud.army}</span>
        <span>🧟 敌军 {hud.zombies}</span>
        <span>击杀 {hud.kills}</span>
        {hud.message && <span style={{ color: '#f0a050' }}>{hud.message}</span>}
      </div>

      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseMove={handleMove}
          onClick={handleClick}
          onContextMenu={(event) => {
            event.preventDefault();
            setSelected(null);
          }}
          style={{
            width: '100%',
            borderRadius: 8,
            cursor: selected ? 'crosshair' : 'default',
            background: '#1c2a1a',
          }}
        />
        {hud.gameOver && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(10,8,6,0.78)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 700, color: '#e05448' }}>本阵陷落</div>
            <div style={{ fontSize: 15 }}>
              坚守到第 {hud.wave} 波,累计击杀 {hud.kills}
            </div>
            <button
              type="button"
              onClick={restart}
              style={{
                padding: '8px 22px',
                fontSize: 15,
                borderRadius: 8,
                border: 'none',
                background: '#c8a04b',
                color: '#241c10',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              重整旗鼓
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 6,
          marginTop: 8,
        }}
      >
        {BUILD_OPTIONS.map((option) => {
          const active = selected === option.id;
          const affordable = hud.gold >= option.cost;
          return (
            <button
              key={option.id}
              type="button"
              title={option.description}
              onClick={() => setSelected(active ? null : option.id)}
              style={{
                textAlign: 'left',
                padding: '6px 8px',
                borderRadius: 8,
                border: active ? '2px solid #f0c860' : '1px solid #45413a',
                background: active ? '#3a352b' : '#2b2823',
                color: affordable ? '#e8e4d8' : '#8a857a',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: option.campColor,
                  marginRight: 6,
                }}
              />
              <strong>{option.campName}</strong>
              <span style={{ float: 'right', color: '#f0c860' }}>💰{option.cost}</span>
              <div style={{ fontSize: 12, opacity: 0.8 }}>出{option.unitName}</div>
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
        选中建筑后在地图上点击落地,右键取消。堡垒为 3×3 城寨,可堵在要道上;营房被拆后部队不再补员。
      </p>
    </div>
  );
};

export default GamePage;
