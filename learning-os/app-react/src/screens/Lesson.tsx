import { useState } from "react";
import { stageForXp } from "../lib/mascot";
import type { State } from "../lib/engine";
import type { Atom } from "../lib/types";
import { Mascot } from "../components/Mascot";
import { TopBar } from "../components/TopBar";
import { StepView } from "../steps/StepView";

export function Lesson({ atom, state, onExit, onFinish }: {
  atom: Atom;
  state: State;
  onExit: () => void;
  onFinish: (atom: Atom) => void;
}) {
  const [i, setI] = useState(0);
  const [canNext, setCanNext] = useState(false);
  const step = atom.steps[i];

  function next() {
    if (i + 1 >= atom.steps.length) onFinish(atom);
    else { setI(i + 1); setCanNext(false); }
  }

  return (
    <>
      <TopBar state={state} />
      <div className="screen">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <button className="opt" style={{ width: "auto", padding: "6px 12px", margin: 0 }} onClick={onExit}>✕</button>
          <div className="progress" style={{ flex: 1 }}><i style={{ width: `${(i / atom.steps.length) * 100}%` }} /></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Mascot stage={stageForXp(state.xp)} size={50} />
          <strong style={{ color: "var(--brand)" }}>{atom.title}</strong>
        </div>
        <StepView key={i} step={step} setCanNext={setCanNext} />
        <button className="btn" disabled={!canNext} onClick={next}>继续</button>
      </div>
    </>
  );
}
