// Content-as-data types. `Step` is a discriminated union so adding a new
// step type forces the compiler to handle it everywhere.

export interface StepInfo { type: "info"; text: string; sub?: string; emu?: string; }
export interface StepChoice { type: "choice" | "explainback"; q: string; options: string[]; answer: number; explain?: string; }
export interface StepSort { type: "sort"; q: string; buckets: string[]; items: { label: string; bucket: number }[]; }
export interface StepSlider { type: "slider"; q: string; total: number; unit: string; showSaveRate?: boolean; target?: string; }
export interface StepGrow { type: "grow"; q: string; principal: number; rate: number; years: number; label?: string; }
export interface StepBudget { type: "budget"; q: string; total: number; unit: string; categories: string[]; }

export type Step = StepInfo | StepChoice | StepSort | StepSlider | StepGrow | StepBudget;

export interface Atom {
  id: string;
  title: string;
  level: string;
  bloom?: string;
  coins: number;
  xp: number;
  isProject?: boolean;
  steps: Step[];
}

export interface ModuleMeta {
  id: string;
  title: string;
  subtitle: string;
  mascot: string;
  minAge: number;
  tier: string;
  authority: string;
  level: string;
}

export interface Module {
  module: ModuleMeta;
  atoms: Atom[];
}
