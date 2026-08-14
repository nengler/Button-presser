import { UPGRADE_DEFS } from "../game/upgrades.ts";
import type { UpgradeId } from "../game/types.ts";
import { EXTRA_PADS, MINION_COST, MINION_MAX } from "../game/toys.ts";

export const NODE = 16;

/** 8×8 glyphs: X = on, . = off */
export const ICONS: Record<string, string[]> = {
  warmup: [
    "........",
    "...XX...",
    "...XX...",
    ".XXXXXX.",
    ".XXXXXX.",
    "...XX...",
    "...XX...",
    "........",
  ],
  multiplier: [
    "........",
    "......X.",
    ".....XX.",
    "....XXX.",
    "...XXXX.",
    "..XXXXX.",
    ".XXXXXX.",
    "........",
  ],
  focus: [
    "........",
    "...XX...",
    "...XX...",
    "XX.XX.XX",
    "XX.XX.XX",
    "...XX...",
    "...XX...",
    "........",
  ],
  tempo: [
    "..XXXX..",
    ".X....X.",
    "X..XX..X",
    "X.X....X",
    "X....X.X",
    "X..XX..X",
    ".X....X.",
    "..XXXX..",
  ],
  combo: [
    "........",
    ".XX..XX.",
    ".XX..XX.",
    "..XXXX..",
    "..XXXX..",
    ".XX..XX.",
    ".XX..XX.",
    "........",
  ],
  minion: [
    "........",
    "..XXXX..",
    ".XXXXXX.",
    ".XX..XX.",
    ".XXXXXX.",
    "..XXXX..",
    ".XX..XX.",
    "........",
  ],
  "pad-b": [
    "........",
    ".XXXXXX.",
    ".X....X.",
    ".X.XX.X.",
    ".X.XX.X.",
    ".X....X.",
    ".XXXXXX.",
    "........",
  ],
  "pad-c": [
    "........",
    ".XXXX...",
    ".X..X...",
    ".XXXX.XX",
    "......X.",
    "...XXXX.",
    "...X..X.",
    "...XXXX.",
  ],
};

export type TreeNodeId = UpgradeId | "minion" | "pad-b" | "pad-c";

export type TreeNode = {
  id: TreeNodeId;
  x: number;
  y: number;
  parents: TreeNodeId[];
  title: string;
  blurb: string;
};

/** Bottom roots → top/right advanced, with a merge into minion. */
export const TREE_NODES: TreeNode[] = [
  {
    id: "warmup",
    x: 20,
    y: 96,
    parents: [],
    title: "WARM",
    blurb: "Start with a point cushion",
  },
  {
    id: "multiplier",
    x: 84,
    y: 96,
    parents: ["warmup"],
    title: "MULT",
    blurb: "More points per hit",
  },
  {
    id: "focus",
    x: 148,
    y: 96,
    parents: ["warmup"],
    title: "FOCUS",
    blurb: "Wider timing window",
  },
  {
    id: "combo",
    x: 84,
    y: 48,
    parents: ["multiplier"],
    title: "COMBO",
    blurb: "Streaks pay harder",
  },
  {
    id: "tempo",
    x: 148,
    y: 48,
    parents: ["focus"],
    title: "TEMPO",
    blurb: "Slower beat, easier settle",
  },
  {
    id: "minion",
    x: 212,
    y: 48,
    parents: ["multiplier", "focus"],
    title: "MINION",
    blurb: "Hires a helper on leftover beats",
  },
  {
    id: "pad-b",
    x: 212,
    y: 8,
    parents: ["minion"],
    title: "PAD B",
    blurb: "Extra pad, 1.4s timer",
  },
  {
    id: "pad-c",
    x: 276,
    y: 48,
    parents: ["minion"],
    title: "PAD C",
    blurb: "Extra pad, 0.7s timer",
  },
];

export type NodeProgress = {
  level: number;
  max: number;
  cost: number | null;
  owned: boolean;
  maxed: boolean;
};

export function nodeProgress(
  id: TreeNodeId,
  upgrades: Record<UpgradeId, number>,
  minions: number,
  unlockedPads: string[],
): NodeProgress {
  if (id === "minion") {
    return {
      level: minions,
      max: MINION_MAX,
      cost: minions >= MINION_MAX ? null : MINION_COST,
      owned: minions > 0,
      maxed: minions >= MINION_MAX,
    };
  }
  if (id === "pad-b" || id === "pad-c") {
    const pad = EXTRA_PADS.find((p) => p.id === id)!;
    const owned = unlockedPads.includes(id);
    return {
      level: owned ? 1 : 0,
      max: 1,
      cost: owned ? null : pad.cost,
      owned,
      maxed: owned,
    };
  }
  const def = UPGRADE_DEFS[id];
  const level = upgrades[id];
  const maxed = level >= def.maxLevel;
  return {
    level,
    max: def.maxLevel,
    cost: maxed ? null : def.cost(level),
    owned: level > 0,
    maxed,
  };
}

export function parentsOwned(
  node: TreeNode,
  progress: Record<TreeNodeId, NodeProgress>,
): boolean {
  return node.parents.every((p) => progress[p]?.owned);
}
