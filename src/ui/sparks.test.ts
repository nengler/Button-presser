import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { spawnSparks, type Speck, stepSparks } from "./sparks.ts";

describe("sparks", function () {
  it("caps the pool and ages specks out", function () {
    const specks: Speck[] = [];
    spawnSparks(specks, 10, 20, 18);
    spawnSparks(specks, 10, 20, 18);
    spawnSparks(specks, 10, 20, 18);
    assert.ok(specks.length <= 40);
    const n = specks.length;
    stepSparks(specks, 10);
    assert.ok(specks.length < n);
  });
});
