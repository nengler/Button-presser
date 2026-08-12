import type { UpgradeDef, UpgradeId } from "./types.js";

export const UPGRADE_DEFS: Record<UpgradeId, UpgradeDef> = {
  multiplier: {
    id: "multiplier",
    name: "Multiplier",
    description: "Earn more points per successful press.",
    cost: (level) => Math.floor(40 * Math.pow(1.65, level)),
    maxLevel: 10,
  },
  focus: {
    id: "focus",
    name: "Focus",
    description: "Widen the timing window so near-misses still score.",
    cost: (level) => Math.floor(55 * Math.pow(1.7, level)),
    maxLevel: 8,
  },
  tempo: {
    id: "tempo",
    name: "Steady Tempo",
    description: "Slightly lengthen the beat interval — easier to settle into.",
    cost: (level) => Math.floor(70 * Math.pow(1.75, level)),
    maxLevel: 5,
  },
  combo: {
    id: "combo",
    name: "Combo Chain",
    description: "Streaks multiply your score harder.",
    cost: (level) => Math.floor(60 * Math.pow(1.7, level)),
    maxLevel: 8,
  },
  warmup: {
    id: "warmup",
    name: "Warm-up",
    description: "Start each session with a small point cushion.",
    cost: (level) => Math.floor(30 * Math.pow(1.55, level)),
    maxLevel: 5,
  },
};

export function emptyUpgrades(): Record<UpgradeId, number> {
  return {
    multiplier: 0,
    focus: 0,
    tempo: 0,
    combo: 0,
    warmup: 0,
  };
}

/** Base beat interval in ms before tempo upgrades. */
export const BASE_INTERVAL_MS = 1000;

/** Max absolute error (ms) that still scores, before focus upgrades. */
export const BASE_WINDOW_MS = 180;

export function intervalMs(tempoLevel: number): number {
  return BASE_INTERVAL_MS + tempoLevel * 40;
}

export function windowMs(focusLevel: number): number {
  return BASE_WINDOW_MS + focusLevel * 25;
}

export function scoreMultiplier(multiplierLevel: number): number {
  return 1 + multiplierLevel * 0.35;
}

export function comboFactor(streak: number, comboLevel: number): number {
  if (streak <= 1) return 1;
  const perHit = 0.05 + comboLevel * 0.025;
  return 1 + Math.min(streak - 1, 40) * perHit;
}

export function warmupBonus(warmupLevel: number): number {
  return warmupLevel * 25;
}
