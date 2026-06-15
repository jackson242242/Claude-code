import type { Module } from "../lib/types";
import earning from "./earning.json";
import budgeting from "./budgeting.json";
import opportunity from "./opportunity.json";
import priceValue from "./price-value.json";
import goals from "./goals.json";
import investing from "./investing.json";
import debt from "./debt.json";
import risk from "./risk.json";
import banking from "./banking-safety.json";
import giving from "./giving.json";

// Order = learning order (earn → budget → spend wisely → save → invest → debt → protect → bank → give).
// All modules feed one Emu. New courses authored via the content pipeline (see ../../CONTENT-PIPELINE.md).
export const MODULES: Module[] = [
  earning, budgeting, opportunity, priceValue, goals,
  investing, debt, risk, banking, giving,
] as unknown as Module[];
