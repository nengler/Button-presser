import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nearestBeatError, pairCompletes, scorePress, withinDoubleGap } from "./timing.ts";
import { windowMs } from "./upgrades.ts";

describe("nearestBeatError", function () {
  const origin = 1000;
  const interval = 1000;

  it("lands on an exact beat", function () {
    const { errorMs, beatIndex } = nearestBeatError(2000, origin, interval);
    assert.equal(beatIndex, 1);
    assert.ok(Math.abs(errorMs) < 0.001);
  });

  it("is signed toward the nearest beat", function () {
    assert.equal(nearestBeatError(2050, origin, interval).errorMs, 50);
    assert.equal(nearestBeatError(1950, origin, interval).errorMs, -50);
  });
});

describe("scorePress", function () {
  const base = {
    focusLevel: 0,
    multiplierLevel: 0,
    comboLevel: 0,
    streakBefore: 0,
    beatIndex: 0,
  };

  it("grades a dead-on hit as perfect with points", function () {
    const hit = scorePress({ ...base, errorMs: 0 });
    assert.equal(hit.grade, "perfect");
    assert.ok(hit.points > 70);
    assert.equal(hit.streak, 1);
  });

  it("misses outside the window and resets streak", function () {
    const miss = scorePress({
      ...base,
      errorMs: windowMs(0) + 1,
      streakBefore: 5,
    });
    assert.equal(miss.grade, "miss");
    assert.equal(miss.points, 0);
    assert.equal(miss.streak, 0);
  });

  it("pays the same for early and late of equal error", function () {
    const late = scorePress({ ...base, errorMs: 40 });
    const early = scorePress({ ...base, errorMs: -40 });
    assert.equal(late.points, early.points);
    assert.equal(late.grade, early.grade);
  });

  it("boosts perfects when perfect pay is owned", function () {
    const boosted = scorePress({ ...base, errorMs: 0, perfectLevel: 4 });
    const plain = scorePress({ ...base, errorMs: 0, perfectLevel: 0 });
    assert.equal(boosted.grade, "perfect");
    assert.ok(boosted.points > plain.points);
  });

  it("does not boost a non-perfect with perfect pay", function () {
    const errorMs = windowMs(0) * 0.4;
    const boosted = scorePress({ ...base, errorMs, perfectLevel: 4 });
    const plain = scorePress({ ...base, errorMs, perfectLevel: 0 });
    assert.notEqual(boosted.grade, "perfect");
    assert.equal(boosted.points, plain.points);
  });

  it("promotes a near-great into a perfect once snap is owned", function () {
    const errorMs = windowMs(0) * 0.2;
    const plain = scorePress({ ...base, errorMs });
    const snapped = scorePress({ ...base, errorMs, snapLevel: 6 });
    assert.equal(plain.grade, "great");
    assert.equal(snapped.grade, "perfect");
  });

  it("boosts greats when great pay is owned", function () {
    const errorMs = windowMs(0) * 0.2;
    const boosted = scorePress({ ...base, errorMs, greatLevel: 4 });
    const plain = scorePress({ ...base, errorMs, greatLevel: 0 });
    assert.equal(plain.grade, "great");
    assert.ok(boosted.points > plain.points);
  });
});

describe("double and pair helpers", function () {
  it("accepts a second tap inside the gap", function () {
    assert.equal(withinDoubleGap(1000, 1200, 280), true);
    assert.equal(withinDoubleGap(1000, 1400, 280), false);
    assert.equal(withinDoubleGap(1000, 1000, 280), false);
  });

  it("completes a pair only on the next beat", function () {
    assert.equal(pairCompletes(4, 5), true);
    assert.equal(pairCompletes(4, 6), false);
    assert.equal(pairCompletes(-1, 0), false);
  });
});
