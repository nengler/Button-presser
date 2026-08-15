import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { extraButtonById } from "./buttons.ts";
import { defaultSave, loadSave, persistSave } from "./save.ts";
import { installMemoryStorage } from "../test/memoryStorage.ts";

describe("save", function () {
  beforeEach(function () {
    installMemoryStorage();
  });

  it("returns defaults when nothing is stored", function () {
    const save = loadSave();
    assert.deepEqual(save, defaultSave());
    assert.equal(save.version, 4);
    assert.equal(save.score, 0);
    assert.deepEqual(save.unlockedPads, []);
  });

  it("round-trips a persist", function () {
    const next = defaultSave();
    next.score = 1234;
    next.upgrades.multiplier = 2;
    next.stars = 1;
    next.unlockedPads = ["pad-slow"];
    persistSave(next);
    assert.deepEqual(loadSave(), next);
  });

  it("drops unknown versions and broken JSON", function () {
    localStorage.setItem("button-presser-save-v1", JSON.stringify({ version: 99, score: 9 }));
    assert.deepEqual(loadSave(), defaultSave());
    localStorage.setItem("button-presser-save-v1", "{nope");
    assert.deepEqual(loadSave(), defaultSave());
  });

  it("migrates warmup and minions from older saves", function () {
    localStorage.setItem(
      "button-presser-save-v1",
      JSON.stringify({
        version: 2,
        score: 50,
        upgrades: { warmup: 3, multiplier: 1 },
        minions: 2,
        unlockedPads: ["pad-slow", "ghost"],
      }),
    );
    const save = loadSave();
    assert.equal(save.version, 4);
    assert.equal(save.score, 50);
    assert.equal(save.upgrades.bonusHits, 3);
    assert.equal(save.upgrades.multiplier, 1);
    assert.equal(save.stars, 2);
    assert.deepEqual(save.unlockedPads, ["pad-slow"]);
    assert.ok(extraButtonById("pad-slow"));
  });
});
