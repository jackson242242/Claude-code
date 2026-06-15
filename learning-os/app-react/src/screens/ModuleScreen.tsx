import { atomProgress, isDue, isUnlocked, type State } from "../lib/engine";
import type { Module } from "../lib/types";
import { TopBar } from "../components/TopBar";

export function ModuleScreen({ state, module, onBack, onOpenLesson }: {
  state: State;
  module: Module;
  onBack: () => void;
  onOpenLesson: (atomId: string) => void;
}) {
  const nextIdx = module.atoms.findIndex((a, i) => isUnlocked(state, module, i) && !atomProgress(state, a.id).done);
  const due = module.atoms.find((a) => isDue(state, a.id));

  return (
    <>
      <TopBar state={state} />
      <div className="screen">
        <button className="opt" style={{ width: "auto", alignSelf: "flex-start", padding: "8px 14px", margin: "0 0 8px" }} onClick={onBack}>‹ 我的动物园</button>
        <h1>{module.module.title}</h1>
        <p className="muted">{module.module.subtitle}</p>
        <p className="muted" style={{ fontSize: 12 }}>来源参照：{module.module.authority}</p>

        {due ? (
          <button className="btn accent" onClick={() => onOpenLesson(due.id)}>🔁 复习一个</button>
        ) : nextIdx >= 0 ? (
          <button className="btn" onClick={() => onOpenLesson(module.atoms[nextIdx].id)}>▶ 继续这门课</button>
        ) : (
          <button className="btn ghost" disabled>✓ 这门课学完了</button>
        )}

        {module.atoms.map((a, i) => {
          const st = atomProgress(state, a.id);
          const unlocked = isUnlocked(state, module, i);
          const dueA = isDue(state, a.id);
          const cls = "card atom-row " + (st.done ? "done" : unlocked ? "" : "locked");
          const icon = st.done ? "✓" : unlocked ? i + 1 : "🔒";
          return (
            <div key={a.id} className={cls} onClick={() => unlocked && onOpenLesson(a.id)}>
              <div className="num">{icon}</div>
              <div className="meta"><div className="t">{a.title}</div><div className="s">+{a.coins}💰 · +{a.xp}⭐</div></div>
              <div>
                {a.isProject ? <span className="pill proj">作品</span> : dueA ? <span className="pill due">复习</span> : <span className="pill">{a.level}</span>}
                {" "}<span className="go">{unlocked ? "›" : ""}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
