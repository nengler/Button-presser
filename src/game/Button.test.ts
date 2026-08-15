import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Button, type HitWorld } from "./Button.ts";
import { EXTRA_BUTTONS, MAIN_BUTTON } from "./buttons.ts";
import { scorePress } from "./timing.ts";
import { emptyUpgrades, windowMs } from "./upgrades.ts";

function world(upgrades = emptyUpgrades()): HitWorld {
  return {
    upgrades,
    evaluateHit(args) {
      return scorePress({
        errorMs: args.errorMs,
        focusLevel: upgrades.focus,
        multiplierLevel: upgrades.multiplier,
        comboLevel: upgrades.combo,
        perfectLevel: upgrades.perfectPay,
        streakBefore: args.streakBefore,
        beatIndex: args.beatIndex,
      });
    },
  };
}

describe("Button press", function () {
  it("tracks a streak on the main button", function () {
    const main = new Button({ def: MAIN_BUTTON, origin: 0 });
    const w = world();
    assert.equal(main.press({ now: 0, fromStar: false, world: w }).ok, true);
    assert.equal(main.press({ now: 1000, fromStar: false, world: w }).ok, true);
    assert.equal(main.streak, 2);
  });

  it("keeps extra-button streaks independent", function () {
    const extra = new Button({ def: EXTRA_BUTTONS[0], origin: 0 });
    const w = world();
    extra.press({ now: 0, fromStar: false, world: w });
    extra.press({ now: 40, fromStar: true, world: w });
    assert.equal(extra.streak, 1);
  });

  it("rejects a second extra hit on the same beat", function () {
    const extra = new Button({ def: EXTRA_BUTTONS[0], origin: 0 });
    const w = world();
    assert.equal(extra.press({ now: 0, fromStar: false, world: w }).ok, true);
    assert.equal(extra.press({ now: 10, fromStar: false, world: w }).ok, false);
  });

  it("counts a reused main beat as a miss", function () {
    const main = new Button({ def: MAIN_BUTTON, origin: 0 });
    const w = world();
    main.press({ now: 0, fromStar: false, world: w });
    const again = main.press({ now: 10, fromStar: false, world: w });
    assert.equal(again.ok, true);
    if (!again.ok) return;
    assert.equal(again.result.grade, "miss");
    assert.equal(main.streak, 0);
  });
});

describe("skipped beats", function () {
  it("holds the streak until the next window closes", function () {
    const main = new Button({ def: MAIN_BUTTON, origin: 0 });
    const upgrades = emptyUpgrades();
    const w = world(upgrades);
    main.press({ now: 0, fromStar: false, world: w });
    main.press({ now: 1000, fromStar: false, world: w });
    assert.equal(main.expireMissedBeats(2000 + windowMs(0), upgrades), null);
    assert.equal(main.streak, 2);
    const skipped = main.expireMissedBeats(2000 + windowMs(0) + 1, upgrades);
    assert.equal(skipped?.grade, "miss");
    assert.equal(main.streak, 0);
  });

  it("starts a new streak after a skip", function () {
    const main = new Button({ def: MAIN_BUTTON, origin: 0 });
    const upgrades = emptyUpgrades();
    const w = world(upgrades);
    main.press({ now: 0, fromStar: false, world: w });
    main.expireMissedBeats(1000 + windowMs(0) + 1, upgrades);
    main.press({ now: 2000, fromStar: false, world: w });
    assert.equal(main.streak, 1);
    main.press({ now: 3000, fromStar: false, world: w });
    assert.equal(main.streak, 2);
  });
});

describe("double button", function () {
  const twin = EXTRA_BUTTONS.find(function (b) {
    return b.id === "pad-twin";
  })!;

  it("sets on the first tap and scores on the second", function () {
    const button = new Button({ def: twin, origin: 0 });
    const w = world();
    const first = button.press({ now: 0, fromStar: false, world: w });
    assert.equal(first.ok, true);
    if (!first.ok) return;
    assert.equal(first.result.grade, "set");
    assert.equal(first.result.points, 0);
    const second = button.press({ now: 80, fromStar: false, world: w });
    assert.equal(second.ok, true);
    if (!second.ok) return;
    assert.equal(second.result.grade, "perfect");
    assert.ok(second.result.points > 0);
  });

  it("misses if the second tap is too late", function () {
    const button = new Button({ def: twin, origin: 0 });
    const w = world();
    button.press({ now: 0, fromStar: false, world: w });
    const late = button.press({ now: 400, fromStar: false, world: w });
    assert.equal(late.ok, true);
    if (!late.ok) return;
    assert.equal(late.result.grade, "miss");
    assert.equal(button.streak, 0);
  });

  it("expires a pending tap after the gap", function () {
    const button = new Button({ def: twin, origin: 0 });
    const w = world();
    button.press({ now: 0, fromStar: false, world: w });
    assert.equal(button.expirePending(200), null);
    const expired = button.expirePending(281);
    assert.equal(expired?.grade, "miss");
  });
});

describe("pair button", function () {
  const pair = EXTRA_BUTTONS.find(function (b) {
    return b.id === "pad-pair";
  })!;

  it("pays on the second consecutive beat", function () {
    const button = new Button({ def: pair, origin: 0 });
    const w = world();
    const first = button.press({ now: 0, fromStar: false, world: w });
    assert.equal(first.ok, true);
    if (!first.ok) return;
    assert.equal(first.result.grade, "set");
    const second = button.press({ now: 750, fromStar: false, world: w });
    assert.equal(second.ok, true);
    if (!second.ok) return;
    assert.equal(second.result.grade, "perfect");
    assert.ok(second.result.points > 0);
  });

  it("restarts the pair if a beat is skipped", function () {
    const button = new Button({ def: pair, origin: 0 });
    const w = world();
    button.press({ now: 0, fromStar: false, world: w });
    const skipped = button.press({ now: 1500, fromStar: false, world: w });
    assert.equal(skipped.ok, true);
    if (!skipped.ok) return;
    assert.equal(skipped.result.grade, "set");
    assert.equal(skipped.result.points, 0);
  });
});
