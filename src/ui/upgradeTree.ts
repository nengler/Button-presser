import { UPGRADE_DEFS } from "../game/upgrades.ts";
import type { UpgradeId } from "../game/types.ts";
import { COLORS } from "../game/view.ts";
import {
  EXTRA_PADS,
  MINION_COST,
  MINION_MAX,
  extraPadById,
  isExtraPadId,
  type ExtraPadId,
  type Glyph,
} from "../game/pads.ts";

export const NODE = 16;

export const NODE_TINT: Record<string, string> = {
  warmup: COLORS.gold,
  multiplier: COLORS.goldHot,
  focus: COLORS.miss,
  combo: COLORS.gold,
  tempo: COLORS.goldHot,
  minion: COLORS.foam,
  "pad-b": COLORS.goldHot,
  "pad-c": COLORS.miss,
};

/** Pixel specks behind the constellation. */
export const TREE_STARS: { x: number; y: number; c: string; d: number }[] = [
  { x: 8, y: 14, c: COLORS.foam, d: 0 },
  { x: 28, y: 6, c: COLORS.goldHot, d: 1 },
  { x: 52, y: 22, c: COLORS.gold, d: 2 },
  { x: 70, y: 8, c: COLORS.foam, d: 0 },
  { x: 118, y: 18, c: COLORS.goldHot, d: 1 },
  { x: 134, y: 4, c: COLORS.gold, d: 2 },
  { x: 176, y: 26, c: COLORS.foam, d: 0 },
  { x: 198, y: 10, c: COLORS.gold, d: 1 },
  { x: 244, y: 20, c: COLORS.goldHot, d: 2 },
  { x: 268, y: 6, c: COLORS.foam, d: 0 },
  { x: 300, y: 28, c: COLORS.gold, d: 1 },
  { x: 14, y: 58, c: COLORS.goldHot, d: 2 },
  { x: 46, y: 72, c: COLORS.foam, d: 0 },
  { x: 62, y: 40, c: COLORS.gold, d: 1 },
  { x: 108, y: 78, c: COLORS.goldHot, d: 2 },
  { x: 168, y: 66, c: COLORS.foam, d: 0 },
  { x: 188, y: 86, c: COLORS.gold, d: 1 },
  { x: 236, y: 74, c: COLORS.goldHot, d: 0 },
  { x: 258, y: 98, c: COLORS.foam, d: 2 },
  { x: 292, y: 80, c: COLORS.gold, d: 1 },
  { x: 310, y: 54, c: COLORS.goldHot, d: 0 },
  { x: 6, y: 108, c: COLORS.gold, d: 1 },
  { x: 38, y: 120, c: COLORS.foam, d: 2 },
  { x: 96, y: 114, c: COLORS.goldHot, d: 0 },
  { x: 154, y: 122, c: COLORS.gold, d: 1 },
  { x: 220, y: 118, c: COLORS.foam, d: 2 },
  { x: 280, y: 110, c: COLORS.goldHot, d: 0 },
];

/** 8×8 glyphs: X = on, . = off */
export const ICONS: Record<string, Glyph> = {
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
  ...Object.fromEntries(EXTRA_PADS.map((p) => [p.id, p.icon])),
};

export type TreeNodeId = UpgradeId | "minion" | ExtraPadId;

export type TreeNode = {
  id: TreeNodeId;
  x: number;
  y: number;
  parents: TreeNodeId[];
  title: string;
  blurb: string;
};

const UPGRADE_NODES: TreeNode[] = [
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
];

/** Bottom roots → top/right advanced, with a merge into minion. */
export const TREE_NODES: TreeNode[] = [
  ...UPGRADE_NODES,
  ...EXTRA_PADS.map((pad) => ({
    id: pad.id,
    x: pad.treeX,
    y: pad.treeY,
    parents: ["minion"] as TreeNodeId[],
    title: pad.name,
    blurb: pad.blurb,
  })),
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
  if (isExtraPadId(id)) {
    const pad = extraPadById(id)!;
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
