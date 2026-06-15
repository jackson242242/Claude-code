import { STAGES, stageForXp, stageProgress, mascotSVG } from "./mascot.js";

const SAVE_KEY = "moneyzoo.v1";
const SRS_INTERVALS = [1, 3, 7, 16, 30]; // days, by Leitner box
const dayNum = () => Math.floor(Date.now() / 86400000);
const todayStr = () => new Date().toISOString().slice(0, 10);

/* ---------------- state ---------------- */
const defaultState = () => ({ coins: 0, xp: 0, streak: 0, lastActiveDay: null, dose: 1, atoms: {} });
let state = load();
let modules = [];          // [{id, module, atoms}]
let atomIndex = new Map(); // atomId -> { atom, moduleId, idx }

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

const atomState = (id) => state.atoms[id] || { done: false, box: 0, dueDay: 0 };
const isDue = (id) => { const a = state.atoms[id]; return !!(a && a.done && a.dueDay <= dayNum()); };
function isUnlocked(mod, idx) { return idx === 0 || atomState(mod.atoms[idx - 1].id).done; }
const getModule = (id) => modules.find((m) => m.id === id);

/* ---------------- helpers ---------------- */
const $ = (sel, el = document) => el.querySelector(sel);
const app = () => document.getElementById("app");
function fmt(s = "") {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
}
function el(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }

function topbar() {
  return `<div class="topbar">
    <span class="stat coins"><span class="ico">💰</span>${state.coins}</span>
    <span class="stat streak"><span class="ico">🔥</span>${state.streak}</span>
    <span class="stat xp"><span class="ico">⭐</span>${state.xp}</span>
    <span class="spacer"></span>
  </div>`;
}

/* pick today's task across all modules: due reviews first, else next unlocked unseen */
function pickToday() {
  for (const m of modules) for (const a of m.atoms) if (isDue(a.id)) return a.id;
  for (const m of modules) for (let i = 0; i < m.atoms.length; i++)
    if (isUnlocked(m, i) && !atomState(m.atoms[i].id).done) return m.atoms[i].id;
  return null;
}

/* ---------------- HOME / My Zoo ---------------- */
function renderZoo() {
  const s = stageForXp(state.xp), prog = stageProgress(state.xp);
  const todayId = pickToday();
  const todayDue = todayId && isDue(todayId);

  const cards = modules.map((m) => {
    const total = m.atoms.length;
    const done = m.atoms.filter((a) => atomState(a.id).done).length;
    const due = m.atoms.filter((a) => isDue(a.id)).length;
    const pct = Math.round((done / total) * 100);
    return `<div class="card atom-row" data-mod="${m.id}">
      <div class="num" style="${done === total ? "background:var(--good)" : ""}">${done === total ? "✓" : "🦤"}</div>
      <div class="meta">
        <div class="t">${m.module.title} ${due ? `<span class="pill due">复习 ${due}</span>` : ""}</div>
        <div class="s">${m.module.subtitle}</div>
        <div class="progress" style="margin-top:6px;max-width:none"><i style="width:${pct}%"></i></div>
      </div>
      <div><div class="s" style="text-align:right">${done}/${total}</div><span class="go">›</span></div>
    </div>`;
  }).join("");

  const cta = !todayId
    ? `<button class="btn ghost" disabled>🎉 今天全部学完，明天见</button>`
    : `<button class="btn ${todayDue ? "accent" : ""}" data-open="${todayId}">${todayDue ? "🔁 今日复习（保持记牢）" : "▶ 今日学习（约 3 分钟）"}</button>`;

  app().innerHTML = `${topbar()}
    <div class="screen">
      <div class="mascot-wrap">
        <div id="mascotHost">${mascotSVG(s, prog)}</div>
        <div class="stage-label">${STAGES[s].label}${s < STAGES.length - 1 ? ` · 距下一阶段 ${Math.round(prog * 100)}%` : " · 已长大成年 🎉"}</div>
        <div class="progress"><i style="width:${Math.round(prog * 100)}%"></i></div>
      </div>
      <h1>钱钱学院 <span class="pill">三年级+</span></h1>
      <p class="muted">学得越懂，你的 Emu 长得越大 🦤</p>
      <div class="dose">
        <span class="muted" style="align-self:center">每日目标：</span>
        ${[1, 3, 5].map((n) => `<button data-dose="${n}" class="${state.dose === n ? "on" : ""}">${n === 1 ? "3 分钟" : n + " 个"}</button>`).join("")}
      </div>
      ${cta}
      <h2 style="margin-top:14px">课程（4 门 · 都喂这只 Emu）</h2>
      ${cards}
      <div class="footer-note">Money Zoo · 钱钱动物园<br/>把四门学完，Emu 会一路从 🥚 长成 🦤</div>
    </div>`;

  app().querySelectorAll("[data-mod]").forEach((n) => n.addEventListener("click", () => renderModule(n.getAttribute("data-mod"))));
  app().querySelectorAll("[data-open]").forEach((n) => n.addEventListener("click", () => startLesson(n.getAttribute("data-open"))));
  app().querySelectorAll("[data-dose]").forEach((n) => n.addEventListener("click", () => { state.dose = +n.getAttribute("data-dose"); save(); renderZoo(); }));
}

/* ---------------- MODULE screen ---------------- */
function renderModule(id) {
  const m = getModule(id);
  const rows = m.atoms.map((a, i) => {
    const st = atomState(a.id), unlocked = isUnlocked(m, i), due = isDue(a.id);
    const cls = st.done ? "done" : unlocked ? "" : "locked";
    const tag = a.isProject ? `<span class="pill proj">作品</span>` : due ? `<span class="pill due">复习</span>` : `<span class="pill">${a.level}</span>`;
    const icon = st.done ? "✓" : unlocked ? i + 1 : "🔒";
    return `<div class="card atom-row ${cls}" data-open="${unlocked ? a.id : ""}">
      <div class="num">${icon}</div>
      <div class="meta"><div class="t">${a.title}</div><div class="s">+${a.coins}💰 · +${a.xp}⭐</div></div>
      <div>${tag} <span class="go">${unlocked ? "›" : ""}</span></div>
    </div>`;
  }).join("");

  const nextIdx = m.atoms.findIndex((a, i) => isUnlocked(m, i) && !atomState(a.id).done);
  const due = m.atoms.find((a) => isDue(a.id));
  const cta = due ? `<button class="btn accent" data-open="${due.id}">🔁 复习一个</button>`
    : nextIdx >= 0 ? `<button class="btn" data-open="${m.atoms[nextIdx].id}">▶ 继续这门课</button>`
      : `<button class="btn ghost" disabled>✓ 这门课学完了</button>`;

  app().innerHTML = `${topbar()}
    <div class="screen">
      <button class="opt" id="back" style="width:auto;align-self:flex-start;padding:8px 14px;margin:0 0 8px">‹ 我的动物园</button>
      <h1>${m.module.title}</h1>
      <p class="muted">${m.module.subtitle}</p>
      <p class="muted" style="font-size:12px">来源参照：${m.module.authority}</p>
      ${cta}
      ${rows}
    </div>`;
  $("#back").addEventListener("click", renderZoo);
  app().querySelectorAll("[data-open]").forEach((n) => { const id2 = n.getAttribute("data-open"); if (id2) n.addEventListener("click", () => startLesson(id2)); });
}

/* ---------------- LESSON PLAYER ---------------- */
let session = null;
function startLesson(atomId) {
  const found = atomIndex.get(atomId);
  session = { atom: found.atom, moduleId: found.moduleId, i: 0, correct: 0, total: 0 };
  renderStep();
}

function renderStep() {
  const { atom, i } = session;
  const step = atom.steps[i];
  let body = "";
  switch (step.type) {
    case "info": body = stepInfo(step); break;
    case "choice": case "explainback": body = stepChoice(step); break;
    case "sort": body = stepSort(step); break;
    case "slider": body = stepSlider(step); break;
    case "grow": body = stepGrow(step); break;
    case "budget": body = stepBudget(step); break;
    default: body = `<p>未知步骤</p>`;
  }
  app().innerHTML = `${topbar()}<div class="screen">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <button class="opt" id="exit" style="width:auto;padding:6px 12px;margin:0">✕</button>
      <div class="progress" style="flex:1"><i style="width:${(i / atom.steps.length) * 100}%"></i></div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <div style="width:50px;height:50px">${mascotSVG(stageForXp(state.xp), 0)}</div>
      <strong style="color:var(--brand)">${atom.title}</strong>
    </div>
    <div id="stepBody">${body}</div>
  </div>`;
  $("#exit").addEventListener("click", () => renderModule(session.moduleId));
  wireStep(step);
}

const stepInfo = (s) => `<div class="bubble">${fmt(s.text)}</div>${s.sub ? `<p class="muted" style="margin-top:10px">${fmt(s.sub)}</p>` : ""}<button class="btn" id="next">继续</button>`;
const stepChoice = (s) => `<div class="q">${fmt(s.q)}</div><div id="opts">${s.options.map((o, idx) => `<button class="opt" data-i="${idx}">${fmt(o)}</button>`).join("")}</div><div id="fb"></div><button class="btn" id="next" disabled>继续</button>`;
const stepSort = (s) => `<div class="q">${fmt(s.q)}</div><div class="items" id="items">${s.items.map((it, idx) => `<button class="chip" data-i="${idx}">${it.label}</button>`).join("")}</div><div class="buckets">${s.buckets.map((b, bi) => `<div class="bucket" data-b="${bi}"><div class="bt">${b}</div><div class="drop"></div></div>`).join("")}</div><div id="fb"></div><button class="btn" id="next" disabled>继续</button>`;
const stepSlider = (s) => `<div class="q">${fmt(s.q)}</div><div class="bignum"><span id="sv">0</span> / ${s.total} ${s.unit}</div><input class="range" type="range" min="0" max="${s.total}" value="0" id="rng"/>${s.showSaveRate ? `<div class="center muted">储蓄率：<strong id="rate" style="color:var(--brand)">0%</strong></div>` : ""}<button class="btn" id="next">继续</button>`;
const stepGrow = (s) => `<div class="q">${fmt(s.q)}</div>
  <div class="bignum"><span id="gv">${s.principal}</span></div>
  <div class="center muted" style="margin-bottom:6px">第 <strong id="gy">0</strong> 年 · ${s.label || "总额"}</div>
  <div style="height:120px;display:flex;align-items:flex-end;justify-content:center"><div id="gbar" style="width:80px;background:linear-gradient(180deg,var(--brand-2),var(--brand));border-radius:12px 12px 0 0;height:8px;transition:height .25s"></div></div>
  <input class="range" type="range" min="0" max="${s.years}" value="0" id="grng"/>
  <button class="btn" id="next">继续</button>`;

function stepBudget(s) {
  session._budget = s.categories.map(() => 0);
  return `<div class="q">${fmt(s.q)}</div>
    <div id="budget">${s.categories.map((c, ci) => `<div class="budget-row">
      <span class="cat">${c}</span>
      <button class="opt" style="width:48px;margin:0;text-align:center" data-d="-1" data-c="${ci}">−</button>
      <span class="amt"><span id="b${ci}">0</span></span>
      <button class="opt" style="width:48px;margin:0;text-align:center" data-d="1" data-c="${ci}">＋</button>
    </div>`).join("")}</div>
    <div class="budget-left" id="left">还剩 ${s.total} ${s.unit} 要分配</div>
    <div id="fb"></div><button class="btn" id="next" disabled>继续</button>`;
}

/* ---------------- step wiring ---------------- */
function wireStep(step) {
  const next = $("#next");
  const advance = () => { session.i++; if (session.i >= session.atom.steps.length) finishLesson(); else renderStep(); };
  if (next) next.addEventListener("click", () => { if (!next.disabled) advance(); });

  if (step.type === "choice" || step.type === "explainback") {
    let answered = false;
    $("#opts").querySelectorAll(".opt").forEach((btn) => btn.addEventListener("click", () => {
      if (answered) return; answered = true;
      const i = +btn.getAttribute("data-i"), ok = i === step.answer;
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
    items.querySelectorAll(".chip").forEach((chip) => chip.addEventListener("click", () => {
      if (chip.classList.contains("placed")) return;
      items.querySelectorAll(".chip").forEach((c) => (c.style.outline = ""));
      selected = chip; chip.style.outline = "3px solid var(--brand)";
    }));
    app().querySelectorAll(".bucket").forEach((b) => b.addEventListener("click", () => {
      if (!selected) return;
      const idx = +selected.getAttribute("data-i"), want = step.items[idx].bucket, bi = +b.getAttribute("data-b");
      if (bi === want) {
        b.querySelector(".drop").appendChild(el(`<div class="placed-chip">${step.items[idx].label}</div>`));
        selected.classList.add("placed"); selected.style.outline = ""; selected = null; placed++;
        if (placed === step.items.length) {
          $("#fb").innerHTML = `<div class="feedback ok">✅ 全部分对了！</div>`;
          next.disabled = false; session.total++; session.correct++;
        }
      } else { b.classList.add("active"); setTimeout(() => b.classList.remove("active"), 250); $("#fb").innerHTML = `<div class="feedback no">再想想：放这里对吗？🤔</div>`; }
    }));
  }

  if (step.type === "slider") {
    const rng = $("#rng");
    const upd = () => { $("#sv").textContent = rng.value; if (step.showSaveRate) $("#rate").textContent = Math.round((rng.value / step.total) * 100) + "%"; };
    rng.addEventListener("input", upd); upd();
  }

  if (step.type === "grow") {
    const rng = $("#grng");
    const max = step.principal * Math.pow(1 + step.rate, step.years);
    const upd = () => {
      const y = +rng.value, val = Math.round(step.principal * Math.pow(1 + step.rate, y));
      $("#gv").textContent = val; $("#gy").textContent = y;
      $("#gbar").style.height = Math.max(8, Math.round((val / max) * 112)) + "px";
    };
    rng.addEventListener("input", upd); upd();
  }

  if (step.type === "budget") {
    const total = step.total;
    const refresh = () => {
      const sum = session._budget.reduce((a, b) => a + b, 0), left = total - sum, leftEl = $("#left");
      session._budget.forEach((v, ci) => { $("#b" + ci).textContent = v; });
      if (left === 0) { leftEl.textContent = "✅ 刚好分完！"; leftEl.className = "budget-left ok"; next.disabled = false; }
      else if (left < 0) { leftEl.textContent = `超了 ${-left} ${step.unit}`; leftEl.className = "budget-left over"; next.disabled = true; }
      else { leftEl.textContent = `还剩 ${left} ${step.unit} 要分配`; leftEl.className = "budget-left"; next.disabled = true; }
    };
    $("#budget").querySelectorAll("[data-d]").forEach((btn) => btn.addEventListener("click", () => {
      const c = +btn.getAttribute("data-c"), d = +btn.getAttribute("data-d");
      const sum = session._budget.reduce((a, b) => a + b, 0), nv = session._budget[c] + d;
      if (nv < 0) return; if (d > 0 && sum >= total) return;
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
  const gainCoins = first ? atom.coins : Math.ceil(atom.coins / 2);
  const gainXp = first ? atom.xp : Math.ceil(atom.xp / 3);
  state.coins += gainCoins; state.xp += gainXp;
  const a = atomState(atom.id), box = Math.min((a.box || 0) + 1, SRS_INTERVALS.length);
  state.atoms[atom.id] = { done: true, box, dueDay: dayNum() + SRS_INTERVALS[box - 1] };
  touchStreak(); save();
  showReward(gainCoins, gainXp, stageForXp(state.xp) > beforeStage, stageForXp(state.xp), atom);
}

function showReward(coins, xp, grew, stage, atom) {
  const overlay = el(`<div class="reward"><div>
    ${grew ? `<div class="mascot" style="margin:auto">${mascotSVG(stage, 0)}</div><div class="big">🎉 Emu 长大了！</div><div>升到 ${STAGES[stage].label}</div>`
      : `<div class="big">${atom.isProject ? "🏆 作品完成！" : "✅ 完成！"}</div>`}
    <div class="gain">+${coins} 💰　+${xp} ⭐</div>
    <div style="margin-top:6px">🔥 连续 ${state.streak} 天</div>
    <button class="btn accent" id="done" style="max-width:260px;margin:18px auto 0">继续</button>
  </div></div>`);
  document.body.appendChild(overlay);
  $("#done", overlay).addEventListener("click", () => { overlay.remove(); renderModule(session.moduleId); });
}

/* ---------------- boot ---------------- */
async function boot() {
  try {
    const idx = await (await fetch("content/index.json")).json();
    modules = await Promise.all(idx.modules.map(async (m) => {
      const data = await (await fetch(m.file)).json();
      return { id: m.id, module: data.module, atoms: data.atoms };
    }));
    modules.forEach((m) => m.atoms.forEach((a, i) => atomIndex.set(a.id, { atom: a, moduleId: m.id, idx: i })));
  } catch (e) {
    app().innerHTML = `<div class="screen"><h2>请用本地服务器打开</h2><p class="muted">需通过 http 提供（不能直接双击 file://）。<br/>在 app 目录运行：<code>python3 -m http.server</code></p></div>`;
    return;
  }
  renderZoo();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}
boot();
