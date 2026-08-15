import { starMax, UPGRADE_DEFS } from "../../game/upgrades.ts";
import type { UpgradeId } from "../../game/types.ts";
import { COLORS } from "../../game/view.ts";
import {
  EXTRA_BUTTONS,
  extraButtonById,
  type ExtraButtonId,
  type Glyph,
  isExtraButtonId,
  starCost,
} from "../../game/buttons.ts";

export const NODE = 16;

export const NODE_TINT: Record<string, string> = {
  bonusHits: COLORS.gold,
  multiplier: COLORS.goldHot,
  focus: COLORS.miss,
  combo: COLORS.gold,
  tempo: COLORS.goldHot,
  perfectPay: COLORS.foam,
  star: COLORS.foam,
  starRate: COLORS.foam,
  starAim: COLORS.goldHot,
  starSkill: COLORS.gold,
  padPay: COLORS.sage,
  snap: COLORS.foam,
  greatPay: COLORS.goldHot,
  comboDepth: COLORS.gold,
  twinGap: COLORS.goldHot,
  starPay: COLORS.foam,
  crew: COLORS.gold,
  "pad-slow": COLORS.sage,
  "pad-twin": COLORS.goldHot,
  "pad-pair": COLORS.miss,
};

/** 8×8 glyphs: X = on, . = off. Centered in the cell so they survive stage scale. */
export const ICONS: Record<string, Glyph> = {
  bonusHits: [
    "..X..X..",
    "........",
    "X..XX..X",
    "..XXXX..",
    "..XXXX..",
    "X..XX..X",
    "........",
    "..X..X..",
  ],
  multiplier: [
    "XX....XX",
    "XXX..XXX",
    ".XX..XX.",
    "..XXXX..",
    "..XXXX..",
    ".XX..XX.",
    "XXX..XXX",
    "XX....XX",
  ],
  focus: [
    "...XX...",
    "...XX...",
    "........",
    "XX.XX.XX",
    "XX.XX.XX",
    "........",
    "...XX...",
    "...XX...",
  ],
  tempo: [
    "..XXXX..",
    ".X....X.",
    "X..XX..X",
    "X.XX...X",
    "X...X..X",
    "X......X",
    ".X....X.",
    "..XXXX..",
  ],
  combo: [
    ".XXXX...",
    "XX..XX..",
    "XX..XXXX",
    ".XXXX..X",
    "X..XXXX.",
    "XXXX..XX",
    "..XX..XX",
    "...XXXX.",
  ],
  star: [
    "...XX...",
    "...XX...",
    "XXXXXXXX",
    ".XXXXXX.",
    "..XXXX..",
    ".XX..XX.",
    "XX....XX",
    "X......X",
  ],
  starRate: [
    "..XXXX..",
    ".X....X.",
    "X..XX..X",
    "X.X..X.X",
    "X.X..X.X",
    "X..XX..X",
    ".X....X.",
    "..XXXX..",
  ],
  starAim: [
    "...XX...",
    "...XX...",
    "..XXXX..",
    "XXXXXXXX",
    "XXXXXXXX",
    "..XXXX..",
    "...XX...",
    "...XX...",
  ],
  perfectPay: [
    "...XX...",
    ".XXXXXX.",
    "XX.XX.XX",
    "XXXXXXXX",
    "XXXXXXXX",
    "XX.XX.XX",
    ".XXXXXX.",
    "...XX...",
  ],
  starSkill: [
    "..XXXX..",
    ".XXXXXX.",
    "XXXX....",
    "XXXX....",
    "XXXXXXXX",
    "XXXXXXXX",
    ".XXXXXX.",
    "..XXXX..",
  ],
  padPay: [
    "XXXX....",
    "X..X....",
    "XXXX.XXX",
    ".....X.X",
    "XXXX.XXX",
    "X..X....",
    "XXXX....",
    "........",
  ],
  snap: [
    "XX....XX",
    "X......X",
    "........",
    "..XXXX..",
    "..XXXX..",
    "........",
    "X......X",
    "XX....XX",
  ],
  greatPay: [
    "...XX...",
    "..XXXX..",
    ".XX..XX.",
    "...XX...",
    "..XXXX..",
    ".XX..XX.",
    "...XX...",
    "........",
  ],
  comboDepth: [
    "XX...XX.",
    "XXXXXXX.",
    "XX...XXX",
    "..XXXXXX",
    "XXXXXX..",
    "XXX...XX",
    ".XXXXXXX",
    ".XX...XX",
  ],
  twinGap: [
    "XXX..XXX",
    "X.X..X.X",
    "XXX..XXX",
    "........",
    "........",
    "XXX..XXX",
    "X.X..X.X",
    "XXX..XXX",
  ],
  starPay: [
    "...XX...",
    "..XXXX..",
    ".XXXXXX.",
    "XX.XX.XX",
    ".XXXXXX.",
    "..X..X..",
    ".XX..XX.",
    "........",
  ],
  crew: [
    "...XX...",
    "..XXXX..",
    "...XX...",
    ".XX..XX.",
    "XXXX.XXX",
    ".XX..XX.",
    "XX.XX.XX",
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
  /** Default: every parent. `any` opens after one parent is owned. */
  require?: "any";
  title: string;
  blurb: string;
};

const EXTRA_BUTTON_PARENTS: Record<ExtraButtonId, TreeNodeId[]> = {
  "pad-slow": ["bonusHits"],
  "pad-twin": ["combo"],
  "pad-pair": ["tempo"],
};

const EARLY_NODES: TreeNode[] = [
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
    parents: ["multiplier"],
    title: "FOCUS",
    blurb: "Wider timing window",
  },
  {
    id: "perfectPay",
    x: 164,
    y: 108,
    parents: ["focus"],
    title: "PERF",
    blurb: "Perfect hits pay extra",
  },
  {
    id: "combo",
    x: 60,
    y: 72,
    parents: ["multiplier"],
    title: "COMBO",
    blurb: "Each button's streak pays harder",
  },
  {
    id: "tempo",
    x: 112,
    y: 72,
    parents: ["focus"],
    title: "TEMPO",
    blurb: "Slower beat, easier settle",
  },
];

const BUTTON_NODES: TreeNode[] = EXTRA_BUTTONS.map(function (button) {
  return {
    id: button.id,
    x: button.treeX,
    y: button.treeY,
    parents: EXTRA_BUTTON_PARENTS[button.id],
    title: button.name,
    blurb: button.blurb,
  };
});

const LATE_NODES: TreeNode[] = [
  {
    id: "twinGap",
    x: 8,
    y: 36,
    parents: ["pad-twin"],
    title: "GAP",
    blurb: "More time between double taps",
  },
  {
    id: "comboDepth",
    x: 60,
    y: 4,
    parents: ["pad-twin"],
    title: "CHAIN",
    blurb: "Streaks keep multiplying longer",
  },
  {
    id: "padPay",
    x: 112,
    y: 36,
    parents: ["pad-twin"],
    title: "BTNS",
    blurb: "Extra buttons earn more",
  },
  {
    id: "star",
    x: 164,
    y: 36,
    parents: ["padPay"],
    title: "STAR",
    blurb: "Hires a star that taps leftover beats. Starts rare.",
  },
  {
    id: "starRate",
    x: 164,
    y: 4,
    parents: ["star"],
    title: "PULSE",
    blurb: "Stars attempt leftover beats more often",
  },
  {
    id: "starAim",
    x: 216,
    y: 36,
    parents: ["star"],
    title: "AIM",
    blurb: "Stars tap closer to the beat",
  },
  {
    id: "starSkill",
    x: 112,
    y: 4,
    parents: ["starRate"],
    title: "SHARE",
    blurb: "Stars use a share of your scoring upgrades",
  },
  {
    id: "starPay",
    x: 216,
    y: 4,
    parents: ["starAim"],
    title: "TIP",
    blurb: "Stars earn more on their own hits",
  },
  {
    id: "crew",
    x: 268,
    y: 36,
    parents: ["starAim"],
    title: "CREW",
    blurb: "Raise the star hire cap",
  },
  {
    id: "snap",
    x: 216,
    y: 108,
    parents: ["perfectPay"],
    title: "SNAP",
    blurb: "Easier perfects",
  },
  {
    id: "greatPay",
    x: 216,
    y: 72,
    parents: ["snap"],
    title: "GREAT",
    blurb: "Great hits pay extra",
  },
];

/** Bottom roots → top/right advanced. Extra buttons fork off before stars. */
export const TREE_NODES: TreeNode[] = [...EARLY_NODES, ...BUTTON_NODES, ...LATE_NODES];

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
    const max = starMax(upgrades.crew);
    return {
      level: stars,
      max,
      cost: stars >= max ? null : starCost(stars),
      owned: stars > 0,
      maxed: stars >= max,
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
  if (node.parents.length === 0) return true;
  function owned(p: TreeNodeId): boolean {
    return progress[p]?.owned === true;
  }
  return node.require === "any" ? node.parents.some(owned) : node.parents.every(owned);
}
