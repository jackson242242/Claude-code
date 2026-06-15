import { useState } from "react";
import { MODULES } from "./data/modules";
import { usePersistentState } from "./lib/store";
import { applyCompletion } from "./lib/engine";
import { STAGES } from "./lib/mascot";
import { Mascot } from "./components/Mascot";
import { Zoo } from "./screens/Zoo";
import { ModuleScreen } from "./screens/ModuleScreen";
import { Lesson } from "./screens/Lesson";
import type { Atom } from "./lib/types";

type View =
  | { name: "zoo" }
  | { name: "module"; moduleId: string }
  | { name: "lesson"; atomId: string; moduleId: string };

interface Reward { coins: number; xp: number; grew: boolean; stage: number; atom: Atom; moduleId: string; }

export default function App() {
  const [state, setState] = usePersistentState();
  const [view, setView] = useState<View>({ name: "zoo" });
  const [reward, setReward] = useState<Reward | null>(null);

  const moduleOf = (id: string) => MODULES.find((m) => m.module.id === id)!;
  const locate = (atomId: string) => {
    for (const m of MODULES) {
      const a = m.atoms.find((x) => x.id === atomId);
      if (a) return { atom: a, moduleId: m.module.id };
    }
    return null;
  };

  const startLesson = (atomId: string) => {
    const loc = locate(atomId);
    if (loc) setView({ name: "lesson", atomId, moduleId: loc.moduleId });
  };

  const finish = (atom: Atom) => {
    const moduleId = view.name === "lesson" ? view.moduleId : (locate(atom.id)?.moduleId ?? "");
    const res = applyCompletion(state, atom);
    setState(res.state);
    setReward({ coins: res.gainCoins, xp: res.gainXp, grew: res.grew, stage: res.stage, atom, moduleId });
  };

  const dismissReward = () => {
    if (reward) setView({ name: "module", moduleId: reward.moduleId });
    setReward(null);
  };

  let screen;
  if (view.name === "zoo") {
    screen = (
      <Zoo
        state={state}
        modules={MODULES}
        onOpenModule={(id) => setView({ name: "module", moduleId: id })}
        onStartToday={startLesson}
        onSetDose={(n) => setState({ ...state, dose: n })}
      />
    );
  } else if (view.name === "module") {
    screen = (
      <ModuleScreen
        state={state}
        module={moduleOf(view.moduleId)}
        onBack={() => setView({ name: "zoo" })}
        onOpenLesson={startLesson}
      />
    );
  } else {
    const loc = locate(view.atomId)!;
    screen = (
      <Lesson
        atom={loc.atom}
        state={state}
        onExit={() => setView({ name: "module", moduleId: view.moduleId })}
        onFinish={finish}
      />
    );
  }

  return (
    <div id="app">
      {screen}
      {reward && (
        <div className="reward">
          <div>
            {reward.grew ? (
              <>
                <Mascot stage={reward.stage} size={150} />
                <div className="big">🎉 Emu 长大了！</div>
                <div>升到 {STAGES[reward.stage].label}</div>
              </>
            ) : (
              <div className="big">{reward.atom.isProject ? "🏆 作品完成！" : "✅ 完成！"}</div>
            )}
            <div className="gain">+{reward.coins} 💰　+{reward.xp} ⭐</div>
            <div style={{ marginTop: 6 }}>🔥 连续 {state.streak} 天</div>
            <button className="btn accent" style={{ maxWidth: 260, margin: "18px auto 0" }} onClick={dismissReward}>继续</button>
          </div>
        </div>
      )}
    </div>
  );
}
