import type { PressResult } from "./types.ts";
import {
  comboFactor,
  scoreMultiplier,
  windowMs,
} from "./upgrades.ts";

const GRADE_THRESHOLDS = {
  perfect: 0.12,
  great: 0.28,
  good: 0.55,
  ok: 1,
} as const;

/**
 * Score a press against the nearest beat. Closer absolute error → more points.
 */
export function scorePress(opts: {
  errorMs: number;
  focusLevel: number;
  multiplierLevel: number;
  comboLevel: number;
  streakBefore: number;
  beatIndex: number;
}): PressResult {
  const window = windowMs(opts.focusLevel);
  const abs = Math.abs(opts.errorMs);
  const ratio = abs / window;

  if (ratio >= 1) {
    return {
      errorMs: opts.errorMs,
      points: 0,
      grade: "miss",
      streak: 0,
      beatIndex: opts.beatIndex,
    };
  }

  const closeness = 1 - ratio;
  const curve = Math.pow(closeness, 1.35);
  const base = 10 + curve * 90;
  const streak = opts.streakBefore + 1;
  const points = Math.round(
    base *
      scoreMultiplier(opts.multiplierLevel) *
      comboFactor(streak, opts.comboLevel),
  );

  let grade: PressResult["grade"] = "ok";
  if (ratio <= GRADE_THRESHOLDS.perfect) grade = "perfect";
  else if (ratio <= GRADE_THRESHOLDS.great) grade = "great";
  else if (ratio <= GRADE_THRESHOLDS.good) grade = "good";

  return {
    errorMs: opts.errorMs,
    points,
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
