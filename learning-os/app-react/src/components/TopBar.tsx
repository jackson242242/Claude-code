import type { State } from "../lib/engine";

export function TopBar({ state }: { state: State }) {
  return (
    <div className="topbar">
      <span className="stat coins"><span className="ico">💰</span>{state.coins}</span>
      <span className="stat streak"><span className="ico">🔥</span>{state.streak}</span>
      <span className="stat xp"><span className="ico">⭐</span>{state.xp}</span>
      <span className="spacer" />
    </div>
  );
}
