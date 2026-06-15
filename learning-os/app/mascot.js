// Emu mascot — 5 growth stages mapped to mastery (XP).
// One programmable SVG family so the animal "grows up" without separate art files.
// stages: 0 egg → 1 hatchling → 2 juvenile → 3 sub-adult → 4 adult

export const STAGES = [
  { key: "egg", label: "🥚 蛋", min: 0 },
  { key: "hatchling", label: "🐣 幼崽", min: 30 },
  { key: "juvenile", label: "🐤 少年", min: 80 },
  { key: "subadult", label: "🦃 青年", min: 150 },
  { key: "adult", label: "🦤 成年", min: 250 },
];

export function stageForXp(xp) {
  let s = 0;
  for (let i = 0; i < STAGES.length; i++) if (xp >= STAGES[i].min) s = i;
  return s;
}

// progress (0..1) toward the NEXT stage
export function stageProgress(xp) {
  const s = stageForXp(xp);
  if (s >= STAGES.length - 1) return 1;
  const cur = STAGES[s].min, next = STAGES[s + 1].min;
  return Math.max(0, Math.min(1, (xp - cur) / (next - cur)));
}

const BODY = "#cfa15c", BODY2 = "#b9863f", BEAK = "#f59e0b", EYE = "#1f2937", FOOT = "#9a6a2e";

function eyes(cx) {
  return `<circle cx="${cx - 10}" cy="0" r="6" fill="#fff"/><circle cx="${cx - 9}" cy="1" r="3.2" fill="${EYE}"/>
          <circle cx="${cx + 10}" cy="0" r="6" fill="#fff"/><circle cx="${cx + 11}" cy="1" r="3.2" fill="${EYE}"/>`;
}

function svg(inner) {
  return `<svg class="mascot" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

export function mascotSVG(stage, prog = 0) {
  switch (stage) {
    case 0: { // egg, cracks grow with progress
      const cracks = prog > 0.5
        ? `<path d="M78 92 l14 12 -12 12 16 10" fill="none" stroke="#bb8f48" stroke-width="3.5" stroke-linecap="round"/>`
        : `<path d="M84 100 l10 9 -8 9" fill="none" stroke="#bb8f48" stroke-width="3" stroke-linecap="round"/>`;
      return svg(`<ellipse cx="100" cy="112" rx="56" ry="70" fill="#f6e7c5" stroke="#d8b878" stroke-width="4"/>
        <ellipse cx="82" cy="88" rx="16" ry="22" fill="#fff" opacity=".35"/>${cracks}`);
    }
    case 1: { // hatchling: round body, half shell, tiny
      return svg(`<g transform="translate(100,118)">
        <ellipse cx="0" cy="18" rx="46" ry="40" fill="${BODY}"/>
        <ellipse cx="0" cy="-14" rx="30" ry="28" fill="${BODY}"/>
        ${eyes(0).replace(/cy="0"/g,'cy="-16"').replace(/cy="1"/g,'cy="-15"')}
        <path d="M-7 -6 l14 0 -7 9 z" fill="${BEAK}"/>
        <path d="M-44 40 q44 26 88 0 q-10 22 -44 22 q-34 0 -44 -22z" fill="#e9d3a3"/>
        <line x1="-12" y1="56" x2="-12" y2="68" stroke="${FOOT}" stroke-width="5" stroke-linecap="round"/>
        <line x1="12" y1="56" x2="12" y2="68" stroke="${FOOT}" stroke-width="5" stroke-linecap="round"/>
      </g>`);
    }
    case 2: { // juvenile: taller body, short neck
      return svg(`<g transform="translate(100,108)">
        <ellipse cx="0" cy="40" rx="42" ry="44" fill="${BODY}"/>
        <rect x="-12" y="-6" width="24" height="40" rx="12" fill="${BODY}"/>
        <ellipse cx="0" cy="-22" rx="22" ry="20" fill="${BODY}"/>
        ${eyes(0).replace(/cy="0"/g,'cy="-24"').replace(/cy="1"/g,'cy="-23"')}
        <path d="M-6 -16 l12 0 -6 10 z" fill="${BEAK}"/>
        <line x1="-12" y1="82" x2="-12" y2="100" stroke="${FOOT}" stroke-width="6" stroke-linecap="round"/>
        <line x1="12" y1="82" x2="12" y2="100" stroke="${FOOT}" stroke-width="6" stroke-linecap="round"/>
      </g>`);
    }
    case 3: { // sub-adult: longer neck + legs
      return svg(`<g transform="translate(100,96)">
        <ellipse cx="0" cy="52" rx="40" ry="42" fill="${BODY}"/>
        <ellipse cx="6" cy="44" rx="30" ry="34" fill="${BODY2}" opacity=".5"/>
        <path d="M0 16 q-6 -40 4 -56" stroke="${BODY}" stroke-width="16" fill="none" stroke-linecap="round"/>
        <ellipse cx="6" cy="-44" rx="17" ry="16" fill="${BODY}"/>
        ${eyes(6).replace(/cy="0"/g,'cy="-46"').replace(/cy="1"/g,'cy="-45"')}
        <path d="M14 -46 l16 3 -14 8 z" fill="${BEAK}"/>
        <line x1="-12" y1="92" x2="-14" y2="120" stroke="${FOOT}" stroke-width="6" stroke-linecap="round"/>
        <line x1="12" y1="92" x2="14" y2="120" stroke="${FOOT}" stroke-width="6" stroke-linecap="round"/>
        <path d="M-14 120 l-8 6 M-14 120 l-2 9 M14 120 l8 6 M14 120 l2 9" stroke="${FOOT}" stroke-width="4" stroke-linecap="round"/>
      </g>`);
    }
    default: { // adult: full emu, long neck + legs, fluffy
      return svg(`<g transform="translate(100,78)">
        <ellipse cx="-2" cy="62" rx="46" ry="46" fill="${BODY}"/>
        <ellipse cx="8" cy="56" rx="36" ry="40" fill="${BODY2}" opacity=".45"/>
        <path d="M-30 36 q-10 18 6 30 M-18 30 q-12 20 4 32 M30 36 q10 18 -6 30" stroke="${BODY2}" stroke-width="4" fill="none" opacity=".5"/>
        <path d="M-2 22 q-10 -54 8 -74" stroke="${BODY}" stroke-width="17" fill="none" stroke-linecap="round"/>
        <ellipse cx="8" cy="-58" rx="17" ry="16" fill="${BODY}"/>
        <path d="M2 -64 q6 -8 12 -2" stroke="${BODY2}" stroke-width="3" fill="none"/>
        ${eyes(8).replace(/cy="0"/g,'cy="-60"').replace(/cy="1"/g,'cy="-59"')}
        <path d="M16 -60 l18 3 -16 9 z" fill="${BEAK}"/>
        <line x1="-14" y1="104" x2="-18" y2="140" stroke="${FOOT}" stroke-width="7" stroke-linecap="round"/>
        <line x1="14" y1="104" x2="18" y2="140" stroke="${FOOT}" stroke-width="7" stroke-linecap="round"/>
        <path d="M-18 140 l-10 8 M-18 140 l-2 12 M-18 140 l8 11 M18 140 l10 8 M18 140 l2 12 M18 140 l-8 11" stroke="${FOOT}" stroke-width="4.5" stroke-linecap="round"/>
      </g>`);
    }
  }
}
