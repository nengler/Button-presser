import { UPGRADE_DEFS } from "../game/upgrades.ts";
import type { UpgradeId } from "../game/types.ts";
import { COLORS } from "../game/view.ts";
import {
  EXTRA_BUTTONS,
  STAR_COST,
  STAR_MAX,
  extraButtonById,
  isExtraButtonId,
  type ExtraButtonId,
  type Glyph,
} from "../game/buttons.ts";

export const NODE = 16;

export const NODE_TINT: Record<string, string> = {
  bonusHits: COLORS.gold,
  multiplier: COLORS.goldHot,
  focus: COLORS.miss,
  combo: COLORS.gold,
  tempo: COLORS.goldHot,
  perfectPay: COLORS.foam,
  shield: COLORS.sage,
  recovery: COLORS.miss,
  star: COLORS.foam,
  starRate: COLORS.foam,
  starAim: COLORS.goldHot,
  starSkill: COLORS.gold,
  padPay: COLORS.sage,
  "pad-slow": COLORS.sage,
  "pad-twin": COLORS.goldHot,
  "pad-pair": COLORS.miss,
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
  bonusHits: [
    "........",
    "X..X..X.",
    "X..X..X.",
    "........",
    ".X..X..X",
    ".X..X..X",
    "........",
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
  star: [
    "........",
    "...X....",
    "..XXX...",
    "XXXXXXX.",
    "..XXX...",
    ".XX.XX..",
    ".X...X..",
    "........",
  ],
  starRate: [
    "........",
    "...XX...",
    "..X..X..",
    ".X.X..X.",
    ".X....X.",
    "..X..X..",
    "...XX...",
    "........",
  ],
  starAim: [
    "........",
    "...X....",
    "...X....",
    ".XXXXX..",
    "...X....",
    "...X....",
    "........",
    "........",
  ],
  perfectPay: [
    "........",
    "...X....",
    ".XXXXX..",
    "XX.X.XX.",
    ".XXXXX..",
    "...X....",
    "........",
    "........",
  ],
  shield: [
    "..XXXX..",
    ".X....X.",
    "X......X",
    "X......X",
    "X......X",
    ".X....X.",
    "..XXXX..",
    "........",
  ],
  recovery: [
    "........",
    "...XX...",
    "..XXXX..",
    ".XX..XX.",
    "...XX...",
    "...XX...",
    "...XX...",
    "........",
  ],
  starSkill: [
    "........",
    ".XX..XX.",
    "XXXXXXX.",
    ".XXXXX..",
    "..XXX...",
    ".XX.XX..",
    "XX...XX.",
    "........",
  ],
  padPay: [
    "........",
    ".XX..XX.",
    ".XX..XX.",
    "........",
    "..XXXX..",
    "..X..X..",
    "..XXXX..",
    "........",
  ],
  ...Object.fromEntries(
    EXTRA_BUTTONS.map(function (p) {
      return [p.id, p.icon];
    }),
  ),
};

export type TreeNodeId = UpgradeId | "star" | ExtraButtonId;

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
    id: "bonusHits",
    x: 8,
    y: 108,
    parents: [],
    title: "EVERY",
    blurb: "Bonus points every few hits",
  },
  {
    id: "multiplier",
    x: 60,
    y: 108,
    parents: ["bonusHits"],
    title: "MULT",
    blurb: "More points per hit",
  },
  {
    id: "focus",
    x: 112,
    y: 108,
    parents: ["bonusHits"],
    title: "FOCUS",
    blurb: "Wider timing window",
  },
  {
    id: "perfectPay",
    x: 164,
    y: 108,
    parents: ["bonusHits"],
    title: "PERF",
    blurb: "Perfect hits pay extra",
  },
  {
    id: "shield",
    x: 8,
    y: 72,
    parents: ["bonusHits"],
    title: "SHIELD",
    blurb: "Ignore misses without breaking streak",
  },
  {
    id: "combo",
    x: 60,
    y: 72,
    parents: ["multiplier"],
    title: "COMBO",
    blurb: "Streaks pay harder",
  },
  {
    id: "tempo",
    x: 112,
    y: 72,
    parents: ["focus"],
    title: "TEMPO",
    blurb: "Slower beat, easier settle",
  },
  {
    id: "recovery",
    x: 164,
    y: 72,
    parents: ["perfectPay"],
    title: "CLUTCH",
    blurb: "The hit after a miss pays extra",
  },
  {
    id: "star",
    x: 216,
    y: 72,
    parents: ["multiplier", "focus"],
    title: "STAR",
    blurb: "Hires a star that taps leftover beats. Starts rare.",
  },
  {
    id: "starSkill",
    x: 164,
    y: 36,
    parents: ["star"],
    title: "SHARE",
    blurb: "Stars use a share of your scoring upgrades",
  },
  {
    id: "starRate",
    x: 216,
    y: 36,
    parents: ["star"],
    title: "PULSE",
    blurb: "Stars attempt leftover beats more often",
  },
  {
    id: "starAim",
    x: 268,
    y: 72,
    parents: ["star"],
    title: "AIM",
    blurb: "Stars tap closer to the beat",
  },
  {
    id: "padPay",
    x: 268,
    y: 36,
    parents: ["star"],
    title: "BTNS",
    blurb: "Extra buttons earn more",
  },
];

/** Bottom roots → top/right advanced, with a merge into star. */
export const TREE_NODES: TreeNode[] = [
  ...UPGRADE_NODES,
  ...EXTRA_BUTTONS.map(function (button) {
    return {
      id: button.id,
      x: button.treeX,
      y: button.treeY,
      parents: ["star"] as TreeNodeId[],
      title: button.name,
      blurb: button.blurb,
    };
  }),
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
  stars: number,
  unlockedPads: string[],
): NodeProgress {
  if (id === "star") {
    return {
      level: stars,
      max: STAR_MAX,
      cost: stars >= STAR_MAX ? null : STAR_COST,
      owned: stars > 0,
      maxed: stars >= STAR_MAX,
    };
  }
  if (isExtraButtonId(id)) {
    const button = extraButtonById(id)!;
    const owned = unlockedPads.includes(id);
    return {
      level: owned ? 1 : 0,
      max: 1,
      cost: owned ? null : button.cost,
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

export function parentsOwned(node: TreeNode, progress: Record<TreeNodeId, NodeProgress>): boolean {
  return node.parents.every(function (p) {
    return progress[p]?.owned;
  });
}
