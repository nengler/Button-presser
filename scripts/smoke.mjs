/**
 * Zero-dep smoke checks for timing/scoring (run: node --experimental-strip-types won't work on compiled).
 * Prefer: npm run build && node scripts/smoke.mjs
 */
import { nearestBeatError, scorePress } from "../src/game/timing.ts";
import { windowMs } from "../src/game/upgrades.ts";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const origin = 1000;
const interval = 1000;

{
  const { errorMs, beatIndex } = nearestBeatError(2000, origin, interval);
  assert(beatIndex === 1, `expected beat 1, got ${beatIndex}`);
  assert(Math.abs(errorMs) < 0.001, `expected 0 error, got ${errorMs}`);
}

{
  const { errorMs } = nearestBeatError(2050, origin, interval);
  assert(Math.abs(errorMs - 50) < 0.001, `expected +50ms, got ${errorMs}`);
}

{
  const perfect = scorePress({
    errorMs: 0,
    focusLevel: 0,
    multiplierLevel: 0,
    comboLevel: 0,
    streakBefore: 0,
    beatIndex: 0,
  });
  assert(perfect.grade === "perfect", `expected perfect, got ${perfect.grade}`);
  assert(perfect.points > 90, `expected high points, got ${perfect.points}`);
}

{
  const miss = scorePress({
    errorMs: windowMs(0) + 1,
    focusLevel: 0,
    multiplierLevel: 0,
    comboLevel: 0,
    streakBefore: 5,
    beatIndex: 0,
  });
  assert(miss.grade === "miss", `expected miss, got ${miss.grade}`);
  assert(miss.points === 0, `expected 0 points`);
  assert(miss.streak === 0, `expected streak reset`);
}

{
  const late = scorePress({
    errorMs: 40,
    focusLevel: 0,
    multiplierLevel: 0,
    comboLevel: 0,
    streakBefore: 0,
    beatIndex: 0,
  });
  const early = scorePress({
    errorMs: -40,
    focusLevel: 0,
    multiplierLevel: 0,
    comboLevel: 0,
    streakBefore: 0,
    beatIndex: 0,
  });
  assert(late.points === early.points, "early/late same abs error should match");
}

console.log("smoke ok");
