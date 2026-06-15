import { useEffect, useState } from "react";
import type { Step, StepInfo, StepChoice, StepSort, StepSlider, StepGrow, StepBudget } from "../lib/types";
import { Rich } from "../components/Rich";

type SetCan = (b: boolean) => void;

function Info({ step, setCanNext }: { step: StepInfo; setCanNext: SetCan }) {
  useEffect(() => setCanNext(true), [setCanNext]);
  return (
    <>
      <Rich className="bubble" text={step.text} />
      {step.sub && <p className="muted" style={{ marginTop: 10 }}><Rich tag="span" text={step.sub} /></p>}
    </>
  );
}

function Choice({ step, setCanNext }: { step: StepChoice; setCanNext: SetCan }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  return (
    <>
      <Rich className="q" text={step.q} />
      <div>
        {step.options.map((o, idx) => {
          const cls = answered ? (idx === step.answer ? "opt correct" : idx === picked ? "opt wrong" : "opt") : "opt";
          return (
            <button key={idx} className={cls} disabled={answered}
              onClick={() => { if (!answered) { setPicked(idx); setCanNext(true); } }}>
              <Rich tag="span" text={o} />
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={"feedback " + (picked === step.answer ? "ok" : "no")}>
          {picked === step.answer ? "✅ 答对了！" : "💡 看这里："} {step.explain ? <Rich tag="span" text={step.explain} /> : null}
        </div>
      )}
    </>
  );
}

function Sort({ step, setCanNext }: { step: StepSort; setCanNext: SetCan }) {
  const [placed, setPlaced] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function placeInto(bi: number) {
    if (selected == null) return;
    const want = step.items[selected].bucket;
    if (bi === want) {
      const np = { ...placed, [selected]: bi };
      setPlaced(np); setSelected(null);
      if (Object.keys(np).length === step.items.length) { setMsg({ ok: true, text: "✅ 全部分对了！" }); setCanNext(true); }
      else setMsg(null);
    } else setMsg({ ok: false, text: "再想想：放这里对吗？🤔" });
  }

  return (
    <>
      <Rich className="q" text={step.q} />
      <div className="items">
        {step.items.map((it, idx) => idx in placed ? null : (
          <button key={idx} className="chip" style={{ outline: selected === idx ? "3px solid var(--brand)" : undefined }}
            onClick={() => setSelected(idx)}>{it.label}</button>
        ))}
      </div>
      <div className="buckets">
        {step.buckets.map((b, bi) => (
          <div key={bi} className="bucket" onClick={() => placeInto(bi)}>
            <div className="bt">{b}</div>
            <div className="drop">
              {step.items.map((it, idx) => placed[idx] === bi ? <div key={idx} className="placed-chip">{it.label}</div> : null)}
            </div>
          </div>
        ))}
      </div>
      {msg && <div className={"feedback " + (msg.ok ? "ok" : "no")}>{msg.text}</div>}
    </>
  );
}

function Slider({ step, setCanNext }: { step: StepSlider; setCanNext: SetCan }) {
  useEffect(() => setCanNext(true), [setCanNext]);
  const [v, setV] = useState(0);
  return (
    <>
      <Rich className="q" text={step.q} />
      <div className="bignum">{v} / {step.total} {step.unit}</div>
      <input className="range" type="range" min={0} max={step.total} value={v} onChange={(e) => setV(+e.target.value)} />
      {step.showSaveRate && <div className="center muted">储蓄率：<strong style={{ color: "var(--brand)" }}>{Math.round((v / step.total) * 100)}%</strong></div>}
    </>
  );
}

function Grow({ step, setCanNext }: { step: StepGrow; setCanNext: SetCan }) {
  useEffect(() => setCanNext(true), [setCanNext]);
  const [y, setY] = useState(0);
  const max = step.principal * Math.pow(1 + step.rate, step.years);
  const val = Math.round(step.principal * Math.pow(1 + step.rate, y));
  const h = Math.max(8, Math.round((val / max) * 112));
  return (
    <>
      <Rich className="q" text={step.q} />
      <div className="bignum">{val}</div>
      <div className="center muted" style={{ marginBottom: 6 }}>第 <strong>{y}</strong> 年 · {step.label || "总额"}</div>
      <div style={{ height: 120, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ width: 80, background: "linear-gradient(180deg,var(--brand-2),var(--brand))", borderRadius: "12px 12px 0 0", height: h, transition: "height .25s" }} />
      </div>
      <input className="range" type="range" min={0} max={step.years} value={y} onChange={(e) => setY(+e.target.value)} />
    </>
  );
}

function Budget({ step, setCanNext }: { step: StepBudget; setCanNext: SetCan }) {
  const [vals, setVals] = useState<number[]>(step.categories.map(() => 0));
  const sum = vals.reduce((a, b) => a + b, 0);
  const left = step.total - sum;
  useEffect(() => { setCanNext(left === 0); }, [left, setCanNext]);
  function bump(ci: number, d: number) {
    const nv = vals[ci] + d;
    if (nv < 0) return;
    if (d > 0 && sum >= step.total) return;
    const arr = [...vals]; arr[ci] = nv; setVals(arr);
  }
  const leftCls = left === 0 ? "budget-left ok" : left < 0 ? "budget-left over" : "budget-left";
  const leftTxt = left === 0 ? "✅ 刚好分完！" : left < 0 ? `超了 ${-left} ${step.unit}` : `还剩 ${left} ${step.unit} 要分配`;
  return (
    <>
      <Rich className="q" text={step.q} />
      <div>
        {step.categories.map((c, ci) => (
          <div key={ci} className="budget-row">
            <span className="cat">{c}</span>
            <button className="opt" style={{ width: 48, margin: 0, textAlign: "center" }} onClick={() => bump(ci, -1)}>−</button>
            <span className="amt">{vals[ci]}</span>
            <button className="opt" style={{ width: 48, margin: 0, textAlign: "center" }} onClick={() => bump(ci, 1)}>＋</button>
          </div>
        ))}
      </div>
      <div className={leftCls}>{leftTxt}</div>
    </>
  );
}

export function StepView({ step, setCanNext }: { step: Step; setCanNext: SetCan }) {
  switch (step.type) {
    case "info": return <Info step={step} setCanNext={setCanNext} />;
    case "choice":
    case "explainback": return <Choice step={step} setCanNext={setCanNext} />;
    case "sort": return <Sort step={step} setCanNext={setCanNext} />;
    case "slider": return <Slider step={step} setCanNext={setCanNext} />;
    case "grow": return <Grow step={step} setCanNext={setCanNext} />;
    case "budget": return <Budget step={step} setCanNext={setCanNext} />;
  }
}
