import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buttonCenter, MAIN_BUTTON } from "../game/buttons.ts";
import { HEIGHT, WIDTH } from "../game/view.ts";
import { HIT_R, hitButton, pointerToCanvas } from "./pointer.ts";

describe("pointerToCanvas", function () {
  const scale = 3;
  const canvas = {
    width: WIDTH,
    height: HEIGHT,
    getBoundingClientRect() {
      return { left: 100, top: 50, width: WIDTH * scale, height: HEIGHT * scale };
    },
  };

  it("maps a scaled click onto the bitmap", function () {
    const main = buttonCenter(0, 1);
    const onButton = pointerToCanvas(
      canvas,
      100 + (main.x / WIDTH) * WIDTH * scale,
      50 + (main.y / HEIGHT) * HEIGHT * scale,
    );
    assert.ok(onButton);
    assert.ok(Math.abs(onButton.x - main.x) < 0.001);
    assert.ok(Math.abs(onButton.y - main.y) < 0.001);
  });

  it("ignores letterbox clicks", function () {
    assert.equal(pointerToCanvas(canvas, 99, 50), null);
  });
});

describe("hitButton", function () {
  it("hits inside the radius and misses outside", function () {
    const buttons = [{ id: MAIN_BUTTON.id }];
    const main = buttonCenter(0, 1);
    assert.equal(hitButton(buttons, main.x, main.y), MAIN_BUTTON.id);
    assert.equal(hitButton(buttons, main.x + HIT_R, main.y), MAIN_BUTTON.id);
    assert.equal(hitButton(buttons, main.x + HIT_R + 1, main.y), null);
  });
});
