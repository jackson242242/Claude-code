import { STAGES, stageForXp, stageProgress } from "../lib/mascot";
import { atomProgress, isDue, pickToday, type State } from "../lib/engine";
import type { Module } from "../lib/types";
import { Mascot } from "../components/Mascot";
import { TopBar } from "../components/TopBar";

export function Zoo({ state, modules, onOpenModule, onStartToday, onSetDose }: {
  state: State;
  modules: Module[];
  onOpenModule: (id: string) => void;
  onStartToday: (atomId: string) => void;
  onSetDose: (n: number) => void;
}) {
  const s = stageForXp(state.xp);
  const prog = stageProgress(state.xp);
  const todayId = pickToday(state, modules);
  const todayDue = todayId ? isDue(state, todayId) : false;

  return (
    <>
      <TopBar state={state} />
      <div className="screen">
        <div className="mascot-wrap">
          <Mascot stage={s} prog={prog} size={190} />
          <div className="stage-label">
            {STAGES[s].label}{s < STAGES.length - 1 ? ` · 距下一阶段 ${Math.round(prog * 100)}%` : " · 已长大成年 🎉"}
          </div>
          <div className="progress"><i style={{ width: `${Math.round(prog * 100)}%` }} /></div>
        </div>

        <h1>钱钱学院 <span className="pill">三年级+</span></h1>
        <p className="muted">学得越懂，你的 Emu 长得越大 🦤</p>

        <div className="dose">
          <span className="muted" style={{ alignSelf: "center" }}>每日目标：</span>
          {[1, 3, 5].map((n) => (
            <button key={n} className={state.dose === n ? "on" : ""} onClick={() => onSetDose(n)}>
              {n === 1 ? "3 分钟" : `${n} 个`}
            </button>
          ))}
        </div>

        {!todayId ? (
          <button className="btn ghost" disabled>🎉 今天全部学完，明天见</button>
        ) : (
          <button className={"btn " + (todayDue ? "accent" : "")} onClick={() => onStartToday(todayId)}>
            {todayDue ? "🔁 今日复习（保持记牢）" : "▶ 今日学习（约 3 分钟）"}
          </button>
        )}

        <h2 style={{ marginTop: 14 }}>课程（{modules.length} 门 · 都喂这只 Emu）</h2>
        {modules.map((m) => {
          const total = m.atoms.length;
          const done = m.atoms.filter((a) => atomProgress(state, a.id).done).length;
          const due = m.atoms.filter((a) => isDue(state, a.id)).length;
          const pct = Math.round((done / total) * 100);
          return (
            <div key={m.module.id} className="card atom-row" onClick={() => onOpenModule(m.module.id)}>
              <div className="num" style={done === total ? { background: "var(--good)" } : undefined}>{done === total ? "✓" : "🦤"}</div>
              <div className="meta">
                <div className="t">{m.module.title} {due > 0 && <span className="pill due">复习 {due}</span>}</div>
                <div className="s">{m.module.subtitle}</div>
                <div className="progress" style={{ marginTop: 6, maxWidth: "none" }}><i style={{ width: `${pct}%` }} /></div>
              </div>
              <div>
                <div className="s" style={{ textAlign: "right" }}>{done}/{total}</div>
                <span className="go">›</span>
              </div>
            </div>
          );
        })}
        <div className="footer-note">Money Zoo · 钱钱动物园<br />把课程学完，Emu 会一路从 🥚 长成 🦤</div>
      </div>
    </>
  );
}
