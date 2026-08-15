import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Button } from "./Button.ts";
import { EXTRA_BUTTONS, MAIN_BUTTON } from "./buttons.ts";
import { Star } from "./Star.ts";
import { emptyUpgrades, starAimErrorMs, starAttemptEvery } from "./upgrades.ts";

describe("Star", function () {
  it("only the first star on a button auto-taps", function () {
    const button = new Button({ def: MAIN_BUTTON, origin: 0 });
    const lead = new Star(button);
    const spare = new Star(button);
    button.stars = [lead, spare];
    let presses = 0;
    const host = {
      upgrades: emptyUpgrades(),
      press() {
        presses += 1;
        return true;
      },
    };
    const period = starAttemptEvery(0);
    const aim = starAimErrorMs(0);
    for (let i = 0; i < period; i++) {
      spare.tick(i * 1000 + aim, host);
    }
    assert.equal(presses, 0);
    for (let i = 0; i < period; i++) {
      lead.tick(i * 1000 + aim, host);
    }
    assert.equal(presses, 1);
  });

  it("finishes a pending double tap", function () {
    const twin = EXTRA_BUTTONS.find(function (b) {
      return b.id === "pad-twin";
    })!;
    const button = new Button({ def: twin, origin: 0 });
    const star = new Star(button);
    button.stars = [star];
    button.press({
      now: 0,
      fromStar: false,
      world: {
        upgrades: emptyUpgrades(),
        evaluateHit() {
          throw new Error("first tap should not score");
        },
      },
    });
    let fromStar = false;
    star.tick(80, {
      upgrades: emptyUpgrades(),
      press(_id, _now, opts) {
        fromStar = opts.fromStar;
        return true;
      },
    });
    assert.equal(fromStar, true);
  });
});
