import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fadeMix } from "./pixelDraw.ts";

describe("fadeMix", function () {
  it("returns the foreground at alpha 1 and the background at 0", function () {
    assert.equal(fadeMix("#ff0000", "#000000", 1), "rgb(255,0,0)");
    assert.equal(fadeMix("#ff0000", "#000000", 0), "rgb(0,0,0)");
  });

  it("clamps alpha", function () {
    assert.equal(fadeMix("#ffffff", "#000000", 2), "rgb(255,255,255)");
    assert.equal(fadeMix("#ffffff", "#000000", -1), "rgb(0,0,0)");
  });
});
