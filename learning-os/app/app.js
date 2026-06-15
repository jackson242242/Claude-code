import { STAGES, stageForXp, stageProgress, mascotSVG } from "./mascot.js";

const SAVE_KEY = "moneyzoo.v1";
const SRS_INTERVALS = [1, 3, 7, 16, 30]; // days, by Leitner box
const dayNum = () => Math.floor(Date.now() / 86400000);
const todayStr = () => new Date().toISOString().slice(0, 10);

/* ---------------- state ---------------- */
const defaultState = () => ({
  coins: 0, xp: 0, streak: 0, lastActiveDay: null, dose: 1, atoms: {},
});
let state = load();
let content = null;

function load() {
  try { return Object.assign(defaultState(), JSON.parse(localStorage.getItem(SAVE_KEY)) || {}); }
  catch { return defaultState(); }
}
function save() { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }

function touchStreak() {
  const t = todayStr();
  if (state.lastActiveDay === t) return;
  const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  state.streak = state.lastActiveDay === y ? state.streak + 1 : 1;
  state.lastActiveDay = t;
}

function atomState(id) { return state.atoms[id] || { done: false, box: 0, dueDay: 0 }; }
function isDue(id) { const a = state.atoms[id]; return a && a.done && a.dueDay <= dayNum(); }
function isUnlocked(idx) { return idx === 0 || (content.atoms[idx - 1] && atomState(content.atoms[idx - 1].id).done); }

/* ---------------- helpers ---------------- */
const $ = (sel, el = document) => el.querySelector(sel);
const app = () => document.getElementById("app");
function fmt(s = "") {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
}
function el(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }

/* ---------------- top bar ---------------- */
function topbar() {
  return `<div class="topbar">
    <span class="stat coins"><span class="ico">💰</span>${state.coins}</span>
    <span class="stat streak"><span class="ico">🔥</span>${state.streak}</span>
    <span class="stat xp"><span class="ico">⭐</span>${state.xp}</span>
    <span class="spacer"></span>
  </div>`;
}

/* ---------------- HOME / My Zoo ---------------- */
function renderHome() {
  const s = stageForXp(state.xp);
  const prog = stageProgress(state.xp);
  const dueCount = content.atoms.filter(a => isDue(a.id)).length;
  const nextIdx = content.atoms.findIndex((a, i) => isUnlocked(i) && !atomState(a.id).done);
  const firstDue = content.atoms.find(a => isDue(a.id));
  const allDone = content.atoms.every(a => atomState(a.id).done);

  const rows = content.atoms.map((a, i) => {
    const st = atomState(a.id);
    const unlocked = isUnlocked(i);
    const cls = st.done ? "done" : unlocked ? "" : "locked";
    const due = isDue(a.id);
    const tag = a.isProject ? `<span class="pill proj">作品</span>` : due ? `<span class="pill due">复习</span>` : `<span class="pill">${a.level}</span>`;
    const icon = st.done ? "✓" : unlocked ? (i + 1) : "🔒";
    return `<div class="card atom-row ${cls}" data-open="${unlocked ? a.id : ""}">
      <div class="num">${icon}</div>
      <div class="meta"><div class="t">${a.title}</div><div class="s">+${a.coins}💰 · +${a.xp}⭐</div></div>
      <div>${tag} <span class="go">${unlocked ? "›" : ""}</span></div>
    </div>`;
  }).join("");

  const cta = firstDue
    ? `<button class="btn accent" data-open="${firstDue.id}">🔁 今天先复习（保持记牢）</button>`
    : nextIdx >= 0
      ? `<button class="btn" data-open="${content.atoms[nextIdx].id}">▶ 今日学习（约 3 分钟）</button>`
      : `<button class="btn ghost" disabled>🎉 今天学完啦，明天见</button>`;

  app().innerHTML = `${topbar()}
    <div class="screen">
      <div class="mascot-wrap">
        <div id="mascotHost">${mascotSVG(s, prog)}</div>
        <div class="stage-label">${STAGES[s].label}${s < STAGES.length - 1 ? ` · 距下一阶段 ${Math.round(prog * 100)}%` : " · 已长大成年 🎉"}</div>
        <div class="progress"><i style="width:${Math.round(prog * 100)}%"></i></div>
      </div>

      <h1>记账预算 <span class="pill">三年级+</span></h1>
      <p class="muted">${content.module.subtitle}</p>

      <div class="dose">
        <span class="muted" style="align-self:center">每日目标：</span>
        ${[1, 3, 5].map(n => `<button data-dose="${n}" class="${state.dose === n ? "on" : ""}">${n === 1 ? "3 分钟" : n + " 个"}</button>`).join("")}
      </div>

      ${cta}
      ${dueCount ? `<p class="muted center">有 ${dueCount} 个知识点到复习时间</p>` : ""}

      <h2 style="margin-top:14px">课程</h2>
      ${rows}
      <div class="footer-note">Money Zoo · 学得越懂，Emu 长得越大 🦤<br/>${allDone ? "全部学完！这只 Emu 是你养大的。" : ""}</div>
    </div>`;

  app().querySelectorAll("[data-open]").forEach(n => {
    const id = n.getAttribute("data-open");
    if (id) n.addEventListener("click", () => startLesson(id));
  });
  app().querySelectorAll("[data-dose]").forEach(n =>
    n.addEventListener("click", () => { state.dose = +n.getAttribute("data-dose"); save(); renderHome(); }));
}

/* ---------------- LESSON PLAYER ---------------- */
let session = null;
function startLesson(id) {
  const atom = content.atoms.find(a => a.id === id);
  session = { atom, i: 0, correct: 0, total: 0 };
  renderStep();
}

function renderStep() {
  const { atom, i } = session;
  const step = atom.steps[i];
  const progress = `<div class="progress" style="margin-bottom:6px"><i style="width:${(i / atom.steps.length) * 100}%"></i></div>`;
  let body = "";
  switch (step.type) {
    case "info": body = stepInfo(step); break;
    case "choice":
    case "explainback": body = stepChoice(step); break;
    case "sort": body = stepSort(step); break;
    case "slider": body = stepSlider(step); break;
    case "budget": body = stepBudget(step); break;
    default: body = `<p>未知步骤</p>`;
  }
  app().innerHTML = `${topbar()}<div class="screen">
    ${progress}
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <div style="width:54px;height:54px">${mascotSVG(stageForXp(state.xp), 0)}</div>
      <strong style="color:var(--brand)">${atom.title}</strong>
    </div>
    <div id="stepBody">${body}</div>
  </div>`;
  wireStep(step);
}

function stepInfo(step) {
  return `<div class="bubble">${fmt(step.text)}</div>
    ${step.sub ? `<p class="muted" style="margin-top:10px">${fmt(step.sub)}</p>` : ""}
    <button class="btn" id="next">继续</button>`;
}

function stepChoice(step) {
  return `<div class="q">${fmt(step.q)}</div>
    <div id="opts">${step.options.map((o, idx) => `<button class="opt" data-i="${idx}">${fmt(o)}</button>`).join("")}</div>
    <div id="fb"></div>
    <button class="btn" id="next" disabled>继续</button>`;
}

function stepSort(step) {
  return `<div class="q">${fmt(step.q)}</div>
    <div class="items" id="items">${step.items.map((it, idx) => `<button class="chip" data-i="${idx}">${it.label}</button>`).join("")}</div>
    <div class="buckets">${step.buckets.map((b, bi) => `<div class="bucket" data-b="${bi}"><div class="bt">${b}</div><div class="drop"></div></div>`).join("")}</div>
    <div id="fb"></div>
    <button class="btn" id="next" disabled>继续</button>`;
}

function stepSlider(step) {
  return `<div class="q">${fmt(step.q)}</div>
    <div class="bignum"><span id="sv">0</span> / ${step.total} ${step.unit}</div>
    <input class="range" type="range" min="0" max="${step.total}" value="0" id="rng"/>
    ${step.showSaveRate ? `<div class="center muted">储蓄率：<strong id="rate" style="color:var(--brand)">0%</strong></div>` : ""}
    <button class="btn" id="next">继续</button>`;
}

function stepBudget(step) {
  const init = step.categories.map(() => 0);
  session._budget = init;
  return `<div class="q">${fmt(step.q)}</div>
    <div id="budget">${step.categories.map((c, ci) => `
      <div class="budget-row">
        <span class="cat">${c}</span>
        <button class="opt" style="width:48px;margin:0;text-align:center" data-d="-1" data-c="${ci}">−</button>
        <span class="amt"><span id="b${ci}">0</span></span>
        <button class="opt" style="width:48px;margin:0;text-align:center" data-d="1" data-c="${ci}">＋</button>
      </div>`).join("")}</div>
    <div class="budget-left" id="left">还剩 ${step.total} ${step.unit} 要分配</div>
    <div id="fb"></div>
    <button class="btn" id="next" disabled>继续</button>`;
}

/* ---------------- step wiring ---------------- */
function wireStep(step) {
  const next = $("#next");
  const advance = () => {
    session.i++;
    if (session.i >= session.atom.steps.length) finishLesson();
    else renderStep();
  };
  if (next) next.addEventListener("click", () => { if (!next.disabled) advance(); });

  if (step.type === "choice" || step.type === "explainback") {
    let answered = false;
    $("#opts").querySelectorAll(".opt").forEach(btn => btn.addEventListener("click", () => {
      if (answered) return; answered = true;
      const i = +btn.getAttribute("data-i");
      const ok = i === step.answer;
      session.total++; if (ok) session.correct++;
      btn.classList.add(ok ? "correct" : "wrong");
      if (!ok) $(`#opts .opt[data-i="${step.answer}"]`).classList.add("correct");
      $("#fb").innerHTML = `<div class="feedback ${ok ? "ok" : "no"}">${ok ? "✅ 答对了！" : "💡 看这里："}${step.explain ? " " + fmt(step.explain) : ""}</div>`;
      next.disabled = false;
    }));
  }

  if (step.type === "sort") {
    let selected = null, placed = 0;
    const items = $("#items");
    items.querySelectorAll(".chip").forEach(chip => chip.addEventListener("click", () => {
      if (chip.classList.contains("placed")) return;
      items.querySelectorAll(".chip").forEach(c => c.style.outline = "");
      selected = chip; chip.style.outline = "3px solid var(--brand)";
    }));
    app().querySelectorAll(".bucket").forEach(b => b.addEventListener("click", () => {
      if (!selected) return;
      const idx = +selected.getAttribute("data-i");
      const want = step.items[idx].bucket;
      const bi = +b.getAttribute("data-b");
      if (bi === want) {
        b.querySelector(".drop").appendChild(el(`<div class="placed-chip">${step.items[idx].label}</div>`));
        selected.classList.add("placed"); selected.style.outline = ""; selected = null; placed++;
        if (placed === step.items.length) {
          $("#fb").innerHTML = `<div class="feedback ok">✅ 全部分对了！『需要』先照顾，『想要』量力而行。</div>`;
          $("#next").disabled = false;
          session.total++; session.correct++;
        }
      } else {
        b.classList.add("active"); setTimeout(() => b.classList.remove("active"), 250);
        $("#fb").innerHTML = `<div class="feedback no">再想想：这个是放这里吗？🤔</div>`;
      }
    }));
  }

  if (step.type === "slider") {
    const rng = $("#rng");
    const upd = () => {
      $("#sv").textContent = rng.value;
      if (step.showSaveRate) $("#rate").textContent = Math.round((rng.value / step.total) * 100) + "%";
    };
    rng.addEventListener("input", upd); upd();
  }

  if (step.type === "budget") {
    const total = step.total;
    const refresh = () => {
      const sum = session._budget.reduce((a, b) => a + b, 0);
      const leftEl = $("#left"), left = total - sum;
      session._budget.forEach((v, ci) => { $("#b" + ci).textContent = v; });
      if (left === 0) { leftEl.textContent = "✅ 刚好分完！"; leftEl.className = "budget-left ok"; $("#next").disabled = false; }
      else if (left < 0) { leftEl.textContent = `超了 ${-left} ${step.unit}`; leftEl.className = "budget-left over"; $("#next").disabled = true; }
      else { leftEl.textContent = `还剩 ${left} ${step.unit} 要分配`; leftEl.className = "budget-left"; $("#next").disabled = true; }
    };
    $("#budget").querySelectorAll("[data-d]").forEach(btn => btn.addEventListener("click", () => {
      const c = +btn.getAttribute("data-c"), d = +btn.getAttribute("data-d");
      const sum = session._budget.reduce((a, b) => a + b, 0);
      const nv = session._budget[c] + d;
      if (nv < 0) return;
      if (d > 0 && sum >= total) return;
      session._budget[c] = nv; refresh();
    }));
    refresh();
  }
}

/* ---------------- finish + reward ---------------- */
function finishLesson() {
  const { atom } = session;
  const first = !atomState(atom.id).done;
  const beforeStage = stageForXp(state.xp);

  // coins/xp: full on first clear; review gives a smaller refresh
  const gainCoins = first ? atom.coins : Math.ceil(atom.coins / 2);
  const gainXp = first ? atom.xp : Math.ceil(atom.xp / 3);
  state.coins += gainCoins;
  state.xp += gainXp;

  // SRS schedule
  const a = atomState(atom.id);
  const box = Math.min((a.box || 0) + 1, SRS_INTERVALS.length);
  state.atoms[atom.id] = { done: true, box, dueDay: dayNum() + SRS_INTERVALS[box - 1] };

  touchStreak();
  save();

  const afterStage = stageForXp(state.xp);
  const grew = afterStage > beforeStage;
  showReward(gainCoins, gainXp, grew, afterStage, atom);
}

function showReward(coins, xp, grew, stage, atom) {
  const overlay = el(`<div class="reward">
    <div>
      ${grew ? `<div class="mascot" style="margin:auto">${mascotSVG(stage, 0)}</div><div class="big">🎉 Emu 长大了！</div><div>升到 ${STAGES[stage].label}</div>`
        : `<div class="big">${atom.isProject ? "🏆 作品完成！" : "✅ 完成！"}</div>`}
      <div class="gain">+${coins} 💰　+${xp} ⭐</div>
      <div style="margin-top:6px">🔥 连续 ${state.streak} 天</div>
      <button class="btn accent" id="done" style="max-width:260px;margin:18px auto 0">回到动物园</button>
    </div>
  </div>`);
  document.body.appendChild(overlay);
  $("#done", overlay).addEventListener("click", () => {
    overlay.remove(); renderHome();
    const host = $("#mascotHost"); if (host) { host.firstElementChild.classList.add("bounce"); }
  });
}

/* ---------------- boot ---------------- */
async function boot() {
  try {
    const res = await fetch("content/budgeting.json");
    content = await res.json();
  } catch (e) {
    app().innerHTML = `<div class="screen"><h2>请用本地服务器打开</h2><p class="muted">这个 app 需要通过 http 提供（直接双击 file:// 打不开内容）。<br/>在 app 目录运行：<br/><code>npx serve</code> 或 <code>python3 -m http.server</code></p></div>`;
    return;
  }
  renderHome();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}
boot();
