import type { PressResult } from "./types.ts";
import { comboFactor, perfectPayFactor, scoreMultiplier, windowMs } from "./upgrades.ts";

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
  perfectLevel?: number;
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
  const base = 8 + curve * 70;
  const streak = opts.streakBefore + 1;

  let grade: PressResult["grade"] = "ok";
  if (ratio <= GRADE_THRESHOLDS.perfect) grade = "perfect";
  else if (ratio <= GRADE_THRESHOLDS.great) grade = "great";
  else if (ratio <= GRADE_THRESHOLDS.good) grade = "good";

  const perfectBoost = grade === "perfect" ? perfectPayFactor(opts.perfectLevel ?? 0) : 1;
  const points = Math.round(
    base *
      scoreMultiplier(opts.multiplierLevel) *
      comboFactor(streak, opts.comboLevel) *
      perfectBoost,
  );

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

export function withinDoubleGap(firstAt: number, secondAt: number, gapMs: number): boolean {
  const dt = secondAt - firstAt;
  return dt > 0 && dt <= gapMs;
}

/** Second consecutive in-window hit scores. A gap in beat index restarts the pair. */
export function pairCompletes(lastSuccessBeat: number, beatIndex: number): boolean {
  return lastSuccessBeat >= 0 && beatIndex === lastSuccessBeat + 1;
}
