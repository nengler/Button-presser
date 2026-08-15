import { DOUBLE_GAP_MS } from "./buttons.ts";
import type { UpgradeDef, UpgradeId } from "./types.ts";

export const UPGRADE_DEFS: Record<UpgradeId, UpgradeDef> = {
  bonusHits: {
    id: "bonusHits",
    name: "Every",
    description: "Every few successful hits, extra points.",
    effect(level) {
      const n = Math.max(1, level);
      return `Every ${bonusHitPeriod(n)} hits, +${bonusHitPayout(n)} points`;
    },
    cost(level) {
      return upgradeCost(1800, 1.85, level);
    },
    maxLevel: 7,
  },
  multiplier: {
    id: "multiplier",
    name: "Multiplier",
    description: "Earn more points per successful press.",
    effect(level) {
      return `Hits pay ×${scoreMultiplier(Math.max(1, level)).toFixed(2)}`;
    },
    cost(level) {
      return upgradeCost(2800, 1.75, level);
    },
    maxLevel: 10,
  },
  focus: {
    id: "focus",
    name: "Focus",
    description: "Widen the timing window so near-misses still score.",
    effect(level) {
      return `Score if within ${windowMs(Math.max(1, level))}ms`;
    },
    cost(level) {
      return upgradeCost(3200, 1.85, level);
    },
    maxLevel: 8,
  },
  tempo: {
    id: "tempo",
    name: "Tempo",
    description: "Streaks on the main button pick up the beat.",
    effect(level) {
      const n = Math.max(1, level);
      return `-${tempoShaveMs(n)}ms per streak hit, down to ${intervalMs(n, TEMPO_STREAK_CAP)}ms`;
    },
    cost(level) {
      return upgradeCost(3600, 1.9, level);
    },
    maxLevel: 5,
  },
  combo: {
    id: "combo",
    name: "Combo Chain",
    description: "Each button's streak multiplies its hits harder.",
    effect(level) {
      const n = Math.max(1, level);
      return `+${Math.round((0.04 + n * 0.02) * 100)}% per streak hit`;
    },
    cost(level) {
      return upgradeCost(3400, 1.9, level);
    },
    maxLevel: 8,
  },
  perfectPay: {
    id: "perfectPay",
    name: "Perfect Pay",
    description: "Perfect hits are worth extra.",
    effect(level) {
      return `Perfects ×${perfectPayFactor(Math.max(1, level)).toFixed(2)}`;
    },
    cost(level) {
      return upgradeCost(3500, 1.9, level);
    },
    maxLevel: 8,
  },
  starRate: {
    id: "starRate",
    name: "Star Pulse",
    description: "Stars attempt leftover beats more often.",
    effect(level) {
      return `Stars try leftover beats every ${starAttemptEvery(Math.max(1, level))}`;
    },
    cost(level) {
      return upgradeCost(6500, 2, level);
    },
    maxLevel: 5,
  },
  starAim: {
    id: "starAim",
    name: "Star Aim",
    description: "Stars tap closer to the beat.",
    effect(level) {
      return `Stars tap ~${starAimErrorMs(Math.max(1, level))}ms late`;
    },
    cost(level) {
      return upgradeCost(7000, 2, level);
    },
    maxLevel: 5,
  },
  starSkill: {
    id: "starSkill",
    name: "Star Share",
    description: "Stars use a share of your scoring upgrades.",
    effect(level) {
      return `Stars use ${Math.round(starShareFactor(Math.max(1, level)) * 100)}% of your scoring upgrades`;
    },
    cost(level) {
      return upgradeCost(8000, 2.05, level);
    },
    maxLevel: 5,
  },
  padPay: {
    id: "padPay",
    name: "Button Pay",
    description: "Extra buttons earn more points.",
    effect(level) {
      return `Extra buttons ×${padPayFactor(Math.max(1, level)).toFixed(2)}`;
    },
    cost(level) {
      return upgradeCost(6000, 1.95, level);
    },
    maxLevel: 6,
  },
  snap: {
    id: "snap",
    name: "Snap",
    description: "Widen the perfect band so close hits grade higher.",
    effect(level) {
      const n = Math.max(1, level);
      return `Perfect if within ${Math.round(gradeBands(n).perfect * 100)}% of the window`;
    },
    cost(level) {
      return upgradeCost(4200, 1.9, level);
    },
    maxLevel: 6,
  },
  greatPay: {
    id: "greatPay",
    name: "Great Pay",
    description: "Great hits are worth extra.",
    effect(level) {
      return `Greats ×${greatPayFactor(Math.max(1, level)).toFixed(2)}`;
    },
    cost(level) {
      return upgradeCost(3800, 1.9, level);
    },
    maxLevel: 8,
  },
  comboDepth: {
    id: "comboDepth",
    name: "Chain",
    description: "Streaks keep multiplying for more hits.",
    effect(level) {
      return `Combo counts through ${comboStreakCap(Math.max(1, level))} hits`;
    },
    cost(level) {
      return upgradeCost(4000, 1.95, level);
    },
    maxLevel: 5,
  },
  twinGap: {
    id: "twinGap",
    name: "Gap",
    description: "More time between the two taps of a double button.",
    effect(level) {
      return `Double-tap window ${doubleGapMs(Math.max(1, level))}ms`;
    },
    cost(level) {
      return upgradeCost(4500, 1.9, level);
    },
    maxLevel: 5,
  },
  starPay: {
    id: "starPay",
    name: "Tip",
    description: "Stars earn more on their own hits.",
    effect(level) {
      return `Star hits ×${starPayFactor(Math.max(1, level)).toFixed(2)}`;
    },
    cost(level) {
      return upgradeCost(7500, 2, level);
    },
    maxLevel: 6,
  },
  crew: {
    id: "crew",
    name: "Crew",
    description: "Raise the star hire cap.",
    effect(level) {
      return `Hire up to ${starMax(Math.max(1, level))} stars`;
    },
    cost(level) {
      return upgradeCost(14000, 2.1, level);
    },
    maxLevel: 4,
  },
};

function upgradeCost(base: number, growth: number, level: number): number {
  return Math.floor(base * Math.pow(growth, level));
}

export function emptyUpgrades(): Record<UpgradeId, number> {
  return {
    bonusHits: 0,
    multiplier: 0,
    focus: 0,
    tempo: 0,
    combo: 0,
    perfectPay: 0,
    starRate: 0,
    starAim: 0,
    starSkill: 0,
    padPay: 0,
    snap: 0,
    greatPay: 0,
    comboDepth: 0,
    twinGap: 0,
    starPay: 0,
    crew: 0,
  };
}

/** Base beat interval in ms before tempo upgrades. */
const BASE_INTERVAL_MS = 1000;

/** Ms shaved off the main beat per streak hit, per tempo level. */
const TEMPO_SHAVE_MS = 4;

/** Streak hits that still speed the main beat. */
const TEMPO_STREAK_CAP = 12;

/** Max absolute error (ms) that still scores, before focus upgrades. */
const BASE_WINDOW_MS = 180;

/** Beats a star skips between leftover attempts, by Pulse level. */
const STAR_PERIOD = [8, 6, 4, 3, 2, 1] as const;

function tempoShaveMs(tempoLevel: number): number {
  return Math.max(0, tempoLevel) * TEMPO_SHAVE_MS;
}

export function intervalMs(tempoLevel: number, streak = 0): number {
  const hits = Math.min(Math.max(0, streak), TEMPO_STREAK_CAP);
  return BASE_INTERVAL_MS - tempoShaveMs(tempoLevel) * hits;
}

export function windowMs(focusLevel: number): number {
  return BASE_WINDOW_MS + focusLevel * 25;
}

export function scoreMultiplier(multiplierLevel: number): number {
  return 1 + multiplierLevel * 0.25;
}

export function comboStreakCap(depthLevel: number): number {
  return 40 + Math.max(0, depthLevel) * 8;
}

export function comboFactor(streak: number, comboLevel: number, depthLevel = 0): number {
  if (streak <= 1) return 1;
  const perHit = 0.04 + comboLevel * 0.02;
  return 1 + Math.min(streak - 1, comboStreakCap(depthLevel)) * perHit;
}

/** Hits between lump bonuses. Level 1 = every 10, down to every 4. */
export function bonusHitPeriod(level: number): number {
  if (level <= 0) return 0;
  return Math.max(4, 11 - level);
}

export function bonusHitPayout(level: number): number {
  if (level <= 0) return 0;
  return level * 35;
}

export function perfectPayFactor(level: number): number {
  return 1 + level * 0.25;
}

export function padPayFactor(level: number): number {
  return 1 + level * 0.25;
}

export function greatPayFactor(level: number): number {
  return 1 + level * 0.2;
}

export function starPayFactor(level: number): number {
  return 1 + level * 0.3;
}

export type GradeBands = {
  perfect: number;
  great: number;
  good: number;
};

export function gradeBands(snapLevel: number): GradeBands {
  const snap = Math.max(0, snapLevel);
  return {
    perfect: 0.12 + snap * 0.02,
    great: 0.28 + snap * 0.025,
    good: 0.55 + snap * 0.02,
  };
}

/** Max gap between the two taps of a double button. */
export function doubleGapMs(gapLevel: number): number {
  return DOUBLE_GAP_MS + Math.max(0, gapLevel) * 40;
}

export function starMax(crewLevel: number): number {
  return 4 + Math.max(0, crewLevel);
}

export function starShareFactor(level: number): number {
  return Math.min(1, Math.max(0, level) * 0.2);
}

export function starAttemptEvery(rateLevel: number): number {
  const i = Math.max(0, Math.min(STAR_PERIOD.length - 1, rateLevel));
  return STAR_PERIOD[i]!;
}

/** How late a star taps, in ms. Lower is closer. */
export function starAimErrorMs(aimLevel: number): number {
  return Math.max(28, 150 - aimLevel * 22);
}
