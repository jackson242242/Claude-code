import type { Tier } from "../api/types";

export const colors = {
  background: "#0E1116",
  surface: "#1A1F29",
  surfaceAlt: "#232A36",
  text: "#F5F7FA",
  textMuted: "#9AA4B2",
  accent: "#3B82F6",
  positive: "#22C55E",
  negative: "#EF4444",
  border: "#2A3140",
};

export const tierColors: Record<Tier, string> = {
  S: "#FF7B72",
  A: "#FFA657",
  B: "#E3B341",
  C: "#7EE787",
  D: "#79C0FF",
  F: "#9AA4B2",
};
