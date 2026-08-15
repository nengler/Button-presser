import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BUTTON_GAP,
  BUTTON_Y,
  buttonById,
  buttonCenter,
  EXTRA_BUTTONS,
  extraButtonById,
  isExtraButtonId,
  MAIN_BUTTON,
  STAR_MAX,
  starCost,
  starsOnButton,
} from "./buttons.ts";
import { WIDTH } from "./view.ts";

describe("button layout", function () {
  it("centers a single button on the stage", function () {
    const pos = buttonCenter(0, 1);
    assert.equal(pos.x, Math.round(WIDTH * 0.5));
    assert.equal(pos.y, BUTTON_Y);
  });

  it("spaces a row evenly around the midline", function () {
    const a = buttonCenter(0, 2);
    const b = buttonCenter(1, 2);
    assert.equal(b.x - a.x, BUTTON_GAP);
    assert.equal(a.x + b.x, WIDTH);
  });
});

describe("button lookup", function () {
  it("finds extras by id and falls back to main", function () {
    assert.equal(extraButtonById("pad-slow")?.kind, "beat");
    assert.equal(isExtraButtonId("pad-twin"), true);
    assert.equal(isExtraButtonId("main"), false);
    assert.equal(buttonById("nope").id, MAIN_BUTTON.id);
    assert.equal(EXTRA_BUTTONS.length, 3);
  });
});

describe("stars", function () {
  it("spreads hired stars across buttons", function () {
    assert.equal(starsOnButton(0, 0, 1), 0);
    assert.equal(starsOnButton(3, 0, 2), 2);
    assert.equal(starsOnButton(3, 1, 2), 1);
    assert.equal(starsOnButton(4, 0, 0), 0);
  });

  it("doubles hire cost each time, up to the cap", function () {
    assert.equal(starCost(0), 8000);
    assert.equal(starCost(1), 16000);
    assert.equal(STAR_MAX, 4);
  });
});
