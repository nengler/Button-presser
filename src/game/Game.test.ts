import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { EXTRA_BUTTONS, MAIN_BUTTON, STAR_MAX, starCost } from "./buttons.ts";
import { Game } from "./Game.ts";
import { defaultSave, persistSave } from "./save.ts";
import { installMemoryStorage } from "../test/memoryStorage.ts";
import { scorePress } from "./timing.ts";
import { bonusHitPayout, bonusHitPeriod, UPGRADE_DEFS, windowMs } from "./upgrades.ts";

describe("Game", function () {
  beforeEach(function () {
    installMemoryStorage();
  });

  it("starts and scores on the first on-beat press", function () {
    const game = new Game();
    assert.equal(game.press(MAIN_BUTTON.id, 8000), true);
    const snap = game.snapshot();
    assert.equal(snap.running, true);
    assert.equal(snap.lastResult?.grade, "perfect");
    assert.ok(snap.score > 0);
  });

  it("still misses a first press that is far from the beat", function () {
    const game = new Game();
    game.press(MAIN_BUTTON.id, 8000 + windowMs(0) + 1);
    assert.equal(game.snapshot().lastResult?.grade, "miss");
  });

  it("notifies subscribers on press", function () {
    const game = new Game();
    let n = 0;
    const unsub = game.subscribe(function () {
      n += 1;
    });
    game.press(MAIN_BUTTON.id, 0);
    assert.ok(n >= 1);
    unsub();
    const after = n;
    game.press(MAIN_BUTTON.id, 1000);
    assert.equal(n, after);
  });

  it("refuses upgrades that cost more than the current score", function () {
    const game = new Game();
    assert.equal(game.buyUpgrade("bonusHits"), false);
    game.debugGrantCash(UPGRADE_DEFS.bonusHits.cost(0));
    assert.equal(game.buyUpgrade("bonusHits"), true);
    assert.equal(game.upgrades.bonusHits, 1);
  });

  it("unlocks an extra button when you can afford it", function () {
    const slow = EXTRA_BUTTONS[0];
    const game = new Game();
    assert.equal(game.unlockButton(slow.id), false);
    game.debugGrantCash(slow.cost);
    assert.equal(game.unlockButton(slow.id), true);
    assert.equal(game.unlockButton(slow.id), false);
    assert.deepEqual(game.snapshot().unlockedPads, [slow.id]);
  });

  it("hires stars up to the cap", function () {
    const game = new Game();
    game.debugGrantCash(1_000_000);
    for (let i = 0; i < STAR_MAX; i++) {
      assert.equal(game.hireStar(), true);
    }
    assert.equal(game.hireStar(), false);
    assert.equal(game.stars, STAR_MAX);
    assert.ok(starCost(0) < starCost(1));
    assert.equal(game.buyUpgrade("crew"), true);
    assert.equal(game.hireStar(), true);
    assert.equal(game.stars, STAR_MAX + 1);
  });

  it("adds the every-N bonus on a player hit", function () {
    const save = defaultSave();
    save.upgrades.bonusHits = 1;
    persistSave(save);
    const game = new Game();
    const period = bonusHitPeriod(1);
    for (let i = 0; i < period; i++) {
      game.press(MAIN_BUTTON.id, i * 1000);
    }
    const base = scorePress({
      errorMs: 0,
      focusLevel: 0,
      multiplierLevel: 0,
      comboLevel: 0,
      streakBefore: period - 1,
      beatIndex: period - 1,
    }).points;
    assert.equal(game.snapshot().lastResult?.points, base + bonusHitPayout(1));
  });

  it("clears progress", function () {
    const game = new Game();
    game.debugGrantCash(50);
    game.resetProgress();
    assert.deepEqual(game.snapshot().score, 0);
    assert.equal(game.upgrades.bonusHits, 0);
  });
});
