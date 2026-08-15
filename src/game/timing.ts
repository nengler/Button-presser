import type { PressResult } from "./types.ts";
import {
  comboFactor,
  gradeBands,
  greatPayFactor,
  perfectPayFactor,
  scoreMultiplier,
  windowMs,
} from "./upgrades.ts";

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
  const bands = gradeBands(opts.snapLevel ?? 0);

  let grade: PressResult["grade"] = "ok";
  if (ratio <= bands.perfect) grade = "perfect";
  else if (ratio <= bands.great) grade = "great";
  else if (ratio <= bands.good) grade = "good";

  const perfectBoost = grade === "perfect" ? perfectPayFactor(opts.perfectLevel ?? 0) : 1;
  const greatBoost = grade === "great" ? greatPayFactor(opts.greatLevel ?? 0) : 1;
  const points = Math.round(
    base *
      scoreMultiplier(opts.multiplierLevel) *
      comboFactor(streak, opts.comboLevel, opts.comboDepthLevel ?? 0) *
      perfectBoost *
      greatBoost,
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
