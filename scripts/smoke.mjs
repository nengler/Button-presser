/**
 * Zero-dep smoke checks for timing/scoring (run: node --experimental-strip-types won't work on compiled).
 * Prefer: npm run build && node scripts/smoke.mjs
 */
import { Game } from "../src/game/Game.ts";
import { nearestBeatError, pairCompletes, scorePress, withinDoubleGap } from "../src/game/timing.ts";
import {
  bonusHitPeriod,
  bonusHitPayout,
  perfectPayFactor,
  starAimErrorMs,
  starAttemptEvery,
  starShareFactor,
  windowMs,
} from "../src/game/upgrades.ts";
import { MAIN_PAD } from "../src/game/pads.ts";
import { HEIGHT, WIDTH } from "../src/game/view.ts";
import { HIT_R, hitPad, pointerToCanvas } from "../src/ui/pointer.ts";

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
  assert(perfect.points > 70, `expected high points, got ${perfect.points}`);
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

{
  const scale = 3;
  const canvas = {
    width: WIDTH,
    height: HEIGHT,
    getBoundingClientRect() {
      return { left: 100, top: 50, width: WIDTH * scale, height: HEIGHT * scale };
    },
  };
  const pads = [{ id: MAIN_PAD.id }];
  const onPad = pointerToCanvas(
    canvas,
    100 + (MAIN_PAD.x / WIDTH) * WIDTH * scale,
    50 + (MAIN_PAD.y / HEIGHT) * HEIGHT * scale,
  );
  assert(onPad !== null, "scaled pad click should map onto the bitmap");
  assert(Math.abs(onPad.x - MAIN_PAD.x) < 0.001, `expected x ${MAIN_PAD.x}, got ${onPad.x}`);
  assert(Math.abs(onPad.y - MAIN_PAD.y) < 0.001, `expected y ${MAIN_PAD.y}, got ${onPad.y}`);
  assert(hitPad(pads, onPad.x, onPad.y) === MAIN_PAD.id, "center of main pad should hit");
  assert(hitPad(pads, MAIN_PAD.x + HIT_R, MAIN_PAD.y) === MAIN_PAD.id, "edge of hit radius should hit");
  assert(hitPad(pads, MAIN_PAD.x + HIT_R + 1, MAIN_PAD.y) === null, "outside hit radius should miss");
  assert(pointerToCanvas(canvas, 99, 50) === null, "letterbox left of canvas should miss");
}

{
  const boosted = scorePress({
    errorMs: 0,
    focusLevel: 0,
    multiplierLevel: 0,
    comboLevel: 0,
    perfectLevel: 4,
    streakBefore: 0,
    beatIndex: 0,
  });
  const plain = scorePress({
    errorMs: 0,
    focusLevel: 0,
    multiplierLevel: 0,
    comboLevel: 0,
    perfectLevel: 0,
    streakBefore: 0,
    beatIndex: 0,
  });
  assert(boosted.grade === "perfect", "perfect grade still perfect");
  assert(boosted.points > plain.points, "perfect pay should increase perfects");
}

{
  assert(bonusHitPeriod(0) === 0, "no every-N bonus at level 0");
  assert(bonusHitPeriod(1) === 10, "level 1 every 10 hits");
  assert(bonusHitPeriod(7) === 4, "high every-N floors at 4");
  assert(bonusHitPayout(2) === 70, "payout scales with level");
  assert(perfectPayFactor(4) === 2, "perfect pay +25% per level");
  assert(starShareFactor(5) === 1, "max share is 100%");
  assert(starShareFactor(0) === 0, "no share without the upgrade");
}

{
  assert(starAttemptEvery(0) === 8, "stars start on every 8th leftover beat");
  assert(starAttemptEvery(5) === 1, "max pulse attempts every leftover beat");
  assert(starAimErrorMs(0) > starAimErrorMs(5), "aim upgrades tap closer");
  assert(withinDoubleGap(1000, 1200, 280), "double tap inside gap");
  assert(!withinDoubleGap(1000, 1400, 280), "double tap outside gap");
  assert(pairCompletes(4, 5), "pair scores on the next beat");
  assert(!pairCompletes(4, 6), "pair resets if a beat is skipped");
  assert(!pairCompletes(-1, 0), "first success does not score a pair");
}

{
  globalThis.localStorage = {
    getItem() {
      return null;
    },
    setItem() {},
    removeItem() {},
    clear() {},
    key() {
      return null;
    },
    length: 0,
  };

  const onBeat = new Game();
  assert(onBeat.press(MAIN_PAD.id, 8000), "first on-beat press should start and score");
  const hit = onBeat.snapshot();
  assert(hit.running, "first press should start the session");
  assert(hit.lastResult?.grade === "perfect", `expected perfect, got ${hit.lastResult?.grade}`);
  assert(hit.score > 0, "first press should add points");

  const late = new Game();
  late.press(MAIN_PAD.id, 8000 + windowMs(0) + 1);
  assert(late.snapshot().lastResult?.grade === "miss", "first press still misses when far from the beat");
}

console.log("smoke ok");
