import type { PressResult, ScoreBonus } from "./types.ts";
import {
  comboFactor,
  gradeBands,
  greatPayFactor,
  perfectPayFactor,
  scoreMultiplier,
  windowMs,
} from "./upgrades.ts";

export function zeroPress(args: {
  errorMs: number;
  grade: PressResult["grade"];
  streak: number;
  beatIndex: number;
}): PressResult {
  return {
    errorMs: args.errorMs,
    points: 0,
    basePoints: 0,
    bonuses: [],
    grade: args.grade,
    streak: args.streak,
    beatIndex: args.beatIndex,
  };
}

export function multiplyScore(result: PressResult, factor: number, label: string): void {
  if (factor === 1 || result.points <= 0) return;
  const next = Math.round(result.points * factor);
  const extra = next - result.points;
  if (extra === 0) return;
  result.bonuses.push({ label, points: extra });
  result.points = next;
}

export function addScore(result: PressResult, extra: number, label: string): void {
  if (extra === 0) return;
  result.bonuses.push({ label, points: extra });
  result.points += extra;
}

function pushFactor(args: {
  product: number;
  shown: number;
  factor: number;
  label: string;
  bonuses: ScoreBonus[];
}): { product: number; shown: number } {
  if (args.factor === 1) return { product: args.product, shown: args.shown };
  const product = args.product * args.factor;
  const shown = Math.round(product);
  const extra = shown - args.shown;
  if (extra !== 0) args.bonuses.push({ label: args.label, points: extra });
  return { product, shown };
}

/**
 * Score a press against the nearest beat. Closer absolute error → more points.
 */
export function scorePress(opts: {
  errorMs: number;
  focusLevel: number;
  multiplierLevel: number;
  comboLevel: number;
  perfectLevel?: number;
  snapLevel?: number;
  greatLevel?: number;
  comboDepthLevel?: number;
  streakBefore: number;
  beatIndex: number;
}): PressResult {
  const window = windowMs(opts.focusLevel);
  const abs = Math.abs(opts.errorMs);
  const ratio = abs / window;

  if (ratio >= 1) {
    return zeroPress({
      errorMs: opts.errorMs,
      grade: "miss",
      streak: 0,
      beatIndex: opts.beatIndex,
    });
  }

  const closeness = 1 - ratio;
  const curve = Math.pow(closeness, 1.35);
  const base = 8 + curve * 70;
  const streak = opts.streakBefore + 1;
  const bands = gradeBands(opts.snapLevel ?? 0);

  let grade: PressResult["grade"] = "ok";
  if (ratio <= bands.perfect) grade = "perfect";
  else if (ratio <= bands.great) grade = "great";
  else if (ratio <= bands.good) grade = "good";

  const bonuses: ScoreBonus[] = [];
  let product = base;
  let shown = Math.round(base);
  const afterMult = pushFactor({
    product,
    shown,
    factor: scoreMultiplier(opts.multiplierLevel),
    label: "MULT",
    bonuses,
  });
  const afterCombo = pushFactor({
    product: afterMult.product,
    shown: afterMult.shown,
    factor: comboFactor(streak, opts.comboLevel, opts.comboDepthLevel ?? 0),
    label: "COMBO",
    bonuses,
  });
  const afterPerfect = pushFactor({
    product: afterCombo.product,
    shown: afterCombo.shown,
    factor: grade === "perfect" ? perfectPayFactor(opts.perfectLevel ?? 0) : 1,
    label: "PERF",
    bonuses,
  });
  const afterGreat = pushFactor({
    product: afterPerfect.product,
    shown: afterPerfect.shown,
    factor: grade === "great" ? greatPayFactor(opts.greatLevel ?? 0) : 1,
    label: "GREAT",
    bonuses,
  });

  return {
    errorMs: opts.errorMs,
    points: afterGreat.shown,
    basePoints: Math.round(base),
    bonuses,
    grade,
    streak,
    beatIndex: opts.beatIndex,
  };
}

/** Signed error to the nearest beat timeline position. */
export function nearestBeatError(
  now: number,
  origin: number,
  interval: number,
): { errorMs: number; beatIndex: number } {
  const elapsed = now - origin;
  const exact = elapsed / interval;
  const beatIndex = Math.round(exact);
  const beatTime = origin + beatIndex * interval;
  return { errorMs: now - beatTime, beatIndex };
}

export function withinDoubleGap(firstAt: number, secondAt: number, gapMs: number): boolean {
  const dt = secondAt - firstAt;
  return dt > 0 && dt <= gapMs;
}

/** Second consecutive in-window hit scores. A gap in beat index restarts the pair. */
export function pairCompletes(lastSuccessBeat: number, beatIndex: number): boolean {
  return lastSuccessBeat >= 0 && beatIndex === lastSuccessBeat + 1;
}
