import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bonusHitPayout,
  bonusHitPeriod,
  comboFactor,
  emptyUpgrades,
  intervalMs,
  padPayFactor,
  perfectPayFactor,
  scoreMultiplier,
  starAimErrorMs,
  starAttemptEvery,
  starShareFactor,
  UPGRADE_DEFS,
  windowMs,
} from "./upgrades.ts";

describe("upgrade formulas", function () {
  it("starts from a full zeroed map", function () {
    const u = emptyUpgrades();
    for (const id of Object.keys(UPGRADE_DEFS)) {
      assert.equal(u[id as keyof typeof u], 0);
    }
  });

  it("widens the window and interval with focus and tempo", function () {
    assert.equal(windowMs(0), 180);
    assert.equal(windowMs(2), 230);
    assert.equal(intervalMs(0), 1000);
    assert.equal(intervalMs(2), 1080);
  });

  it("scales scoring multipliers linearly", function () {
    assert.equal(scoreMultiplier(0), 1);
    assert.equal(scoreMultiplier(4), 2);
    assert.equal(perfectPayFactor(4), 2);
    assert.equal(padPayFactor(4), 2);
  });

  it("applies combo only after the first hit in a streak", function () {
    assert.equal(comboFactor(1, 8), 1);
    assert.ok(comboFactor(5, 0) > 1);
    assert.ok(comboFactor(5, 4) > comboFactor(5, 0));
  });

  it("caps the every-N bonus period at 4", function () {
    assert.equal(bonusHitPeriod(0), 0);
    assert.equal(bonusHitPeriod(1), 10);
    assert.equal(bonusHitPeriod(7), 4);
    assert.equal(bonusHitPayout(2), 70);
    assert.equal(bonusHitPayout(0), 0);
  });

  it("makes stars fire more often and closer with Pulse and Aim", function () {
    assert.equal(starAttemptEvery(0), 8);
    assert.equal(starAttemptEvery(5), 1);
    assert.equal(starAttemptEvery(99), 1);
    assert.ok(starAimErrorMs(0) > starAimErrorMs(5));
    assert.equal(starShareFactor(0), 0);
    assert.equal(starShareFactor(5), 1);
  });

  it("charges more for later levels", function () {
    const def = UPGRADE_DEFS.multiplier;
    assert.ok(def.cost(1) > def.cost(0));
    assert.ok(def.effect(1).includes("×"));
  });
});
