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
      return Math.floor(80 * Math.pow(1.7, level));
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
      return Math.floor(90 * Math.pow(1.75, level));
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
      return Math.floor(110 * Math.pow(1.8, level));
    },
    maxLevel: 8,
  },
  tempo: {
    id: "tempo",
    name: "Steady Tempo",
    description: "Slightly lengthen the beat interval — easier to settle into.",
    effect(level) {
      return `Main beat every ${intervalMs(Math.max(1, level))}ms`;
    },
    cost(level) {
      return Math.floor(130 * Math.pow(1.8, level));
    },
    maxLevel: 5,
  },
  combo: {
    id: "combo",
    name: "Combo Chain",
    description: "Streaks multiply your score harder.",
    effect(level) {
      const n = Math.max(1, level);
      return `+${Math.round((0.04 + n * 0.02) * 100)}% per streak hit`;
    },
    cost(level) {
      return Math.floor(120 * Math.pow(1.8, level));
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
      return Math.floor(140 * Math.pow(1.8, level));
    },
    maxLevel: 8,
  },
  shield: {
    id: "shield",
    name: "Shield",
    description: "Each Start, ignore that many misses without breaking streak.",
    effect(level) {
      const n = Math.max(1, level);
      return `${shieldCharges(n)} miss${shieldCharges(n) === 1 ? "" : "es"} ignored per Start`;
    },
    cost(level) {
      return Math.floor(150 * Math.pow(1.85, level));
    },
    maxLevel: 3,
  },
  recovery: {
    id: "recovery",
    name: "Clutch",
    description: "The hit after a miss is worth extra.",
    effect(level) {
      return `After a miss, next hit ×${recoveryFactor(Math.max(1, level)).toFixed(2)}`;
    },
    cost(level) {
      return Math.floor(125 * Math.pow(1.8, level));
    },
    maxLevel: 5,
  },
  starRate: {
    id: "starRate",
    name: "Star Pulse",
    description: "Stars attempt leftover beats more often.",
    effect(level) {
      return `Stars try leftover beats every ${starAttemptEvery(Math.max(1, level))}`;
    },
    cost(level) {
      return Math.floor(180 * Math.pow(1.85, level));
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
      return Math.floor(180 * Math.pow(1.85, level));
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
      return Math.floor(200 * Math.pow(1.85, level));
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
      return Math.floor(160 * Math.pow(1.8, level));
    },
    maxLevel: 6,
  },
};

export function emptyUpgrades(): Record<UpgradeId, number> {
  return {
    bonusHits: 0,
    multiplier: 0,
    focus: 0,
    tempo: 0,
    combo: 0,
    perfectPay: 0,
    shield: 0,
    recovery: 0,
    starRate: 0,
    starAim: 0,
    starSkill: 0,
    padPay: 0,
  };
}

/** Base beat interval in ms before tempo upgrades. */
export const BASE_INTERVAL_MS = 1000;

/** Max absolute error (ms) that still scores, before focus upgrades. */
export const BASE_WINDOW_MS = 180;

/** Beats a star skips between leftover attempts, by Pulse level. */
const STAR_PERIOD = [8, 6, 4, 3, 2, 1] as const;

export function intervalMs(tempoLevel: number): number {
  return BASE_INTERVAL_MS + tempoLevel * 40;
}

export function windowMs(focusLevel: number): number {
  return BASE_WINDOW_MS + focusLevel * 25;
}

export function scoreMultiplier(multiplierLevel: number): number {
  return 1 + multiplierLevel * 0.25;
}

export function comboFactor(streak: number, comboLevel: number): number {
  if (streak <= 1) return 1;
  const perHit = 0.04 + comboLevel * 0.02;
  return 1 + Math.min(streak - 1, 40) * perHit;
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

export function recoveryFactor(level: number): number {
  return 1 + level * 0.3;
}

export function padPayFactor(level: number): number {
  return 1 + level * 0.25;
}

export function starShareFactor(level: number): number {
  return Math.min(1, Math.max(0, level) * 0.2);
}

export function shieldCharges(level: number): number {
  return Math.max(0, level);
}

export function starAttemptEvery(rateLevel: number): number {
  const i = Math.max(0, Math.min(STAR_PERIOD.length - 1, rateLevel));
  return STAR_PERIOD[i]!;
}

/** How late a star taps, in ms. Lower is closer. */
export function starAimErrorMs(aimLevel: number): number {
  return Math.max(28, 150 - aimLevel * 22);
}
