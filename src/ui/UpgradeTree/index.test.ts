import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyUpgrades } from "../../game/upgrades.ts";
import {
  ICONS,
  type NodeProgress,
  nodeProgress,
  parentsOwned,
  TREE_NODES,
  type TreeNodeId,
} from "./index.ts";

describe("tree progress", function () {
  it("treats EVERY as owned once bought, and STAR by hire count", function () {
    const upgrades = emptyUpgrades();
    const every = nodeProgress("bonusHits", upgrades, 0, []);
    assert.equal(every.owned, false);
    upgrades.bonusHits = 1;
    assert.equal(nodeProgress("bonusHits", upgrades, 0, []).owned, true);
    const star = nodeProgress("star", emptyUpgrades(), 2, []);
    assert.equal(star.owned, true);
    assert.equal(star.level, 2);
    const pad = nodeProgress("pad-slow", emptyUpgrades(), 0, ["pad-slow"]);
    assert.equal(pad.owned, true);
    assert.equal(pad.maxed, true);
  });

  it("lets CREW raise the star hire cap", function () {
    const upgrades = emptyUpgrades();
    assert.equal(nodeProgress("star", upgrades, 4, []).maxed, true);
    upgrades.crew = 2;
    const star = nodeProgress("star", upgrades, 4, []);
    assert.equal(star.maxed, false);
    assert.equal(star.max, 6);
  });

  it("gates later nodes on their parents", function () {
    const upgrades = emptyUpgrades();
    function progressOf(next = upgrades): Record<TreeNodeId, NodeProgress> {
      const progress = {} as Record<TreeNodeId, NodeProgress>;
      for (const node of TREE_NODES) {
        progress[node.id] = nodeProgress(node.id, next, 0, []);
      }
      return progress;
    }
    const every = TREE_NODES.find(function (n) {
      return n.id === "bonusHits";
    })!;
    const mult = TREE_NODES.find(function (n) {
      return n.id === "multiplier";
    })!;
    assert.equal(parentsOwned(every, progressOf()), true);
    assert.equal(parentsOwned(mult, progressOf()), false);
    upgrades.bonusHits = 1;
    assert.equal(parentsOwned(mult, progressOf()), true);
  });

  it("keeps every glyph 8×8 and every wire orthogonal", function () {
    for (const node of TREE_NODES) {
      const rows = ICONS[node.id];
      assert.ok(rows, node.id);
      assert.equal(rows.length, 8, node.id);
      for (const row of rows) {
        assert.equal(row.length, 8, `${node.id} ${row}`);
      }
      for (const pid of node.parents) {
        const parent = TREE_NODES.find(function (n) {
          return n.id === pid;
        });
        assert.ok(parent, pid);
        assert.ok(parent.x === node.x || parent.y === node.y, `${pid} -> ${node.id}`);
      }
    }
  });
});
