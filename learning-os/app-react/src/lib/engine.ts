import type { Atom, Module } from "./types";
import { stageForXp } from "./mascot";

export const SRS_INTERVALS = [1, 3, 7, 16, 30]; // days, by Leitner box
export const dayNum = () => Math.floor(Date.now() / 86400000);
export const todayStr = () => new Date().toISOString().slice(0, 10);

export interface AtomProgress { done: boolean; box: number; dueDay: number; }
export interface State {
  coins: number;
  xp: number;
  streak: number;
  lastActiveDay: string | null;
  dose: number;
  atoms: Record<string, AtomProgress>;
}

export const defaultState = (): State => ({ coins: 0, xp: 0, streak: 0, lastActiveDay: null, dose: 1, atoms: {} });

export const atomProgress = (s: State, id: string): AtomProgress =>
  s.atoms[id] || { done: false, box: 0, dueDay: 0 };

export const isDue = (s: State, id: string): boolean => {
  const a = s.atoms[id];
  return !!(a && a.done && a.dueDay <= dayNum());
};

export const isUnlocked = (s: State, mod: Module, idx: number): boolean =>
  idx === 0 || atomProgress(s, mod.atoms[idx - 1].id).done;

/** pick today's task across all modules: due reviews first, else next unlocked unseen */
export function pickToday(s: State, modules: Module[]): string | null {
  for (const m of modules) for (const a of m.atoms) if (isDue(s, a.id)) return a.id;
  for (const m of modules)
    for (let i = 0; i < m.atoms.length; i++)
      if (isUnlocked(s, m, i) && !atomProgress(s, m.atoms[i].id).done) return m.atoms[i].id;
  return null;
}

export interface CompletionResult {
  state: State;
  gainCoins: number;
  gainXp: number;
  grew: boolean;
  stage: number;
}

/** Pure: apply finishing an atom — coins/xp (full first clear, reduced on review),
 *  Leitner reschedule, and streak. Returns a new State + reward info. */
export function applyCompletion(prev: State, atom: Atom): CompletionResult {
  const s: State = { ...prev, atoms: { ...prev.atoms } };
  const first = !atomProgress(s, atom.id).done;
  const beforeStage = stageForXp(s.xp);

  const gainCoins = first ? atom.coins : Math.ceil(atom.coins / 2);
  const gainXp = first ? atom.xp : Math.ceil(atom.xp / 3);
  s.coins += gainCoins;
  s.xp += gainXp;

  const cur = atomProgress(s, atom.id);
  const box = Math.min((cur.box || 0) + 1, SRS_INTERVALS.length);
  s.atoms[atom.id] = { done: true, box, dueDay: dayNum() + SRS_INTERVALS[box - 1] };

  // streak
  const t = todayStr();
  if (s.lastActiveDay !== t) {
    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    s.streak = s.lastActiveDay === y ? s.streak + 1 : 1;
    s.lastActiveDay = t;
  }

  const stage = stageForXp(s.xp);
  return { state: s, gainCoins, gainXp, grew: stage > beforeStage, stage };
}
