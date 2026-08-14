import { COLORS } from "./view.ts";

export const MINION_COST = 80;
export const MINION_MAX = 4;

/** 8×8 glyph: `X` on, `.` off. */
export type Glyph = readonly string[];

export type PadDef = {
  id: string;
  name: string;
  interval: number;
  cost: number;
  /** Center on the 320×180 stage (pixels, Y down). */
  x: number;
  y: number;
  color: string;
};

export type ExtraPadDef = PadDef & {
  treeX: number;
  treeY: number;
  blurb: string;
  icon: Glyph;
};

export const MAIN_PAD: PadDef = {
  id: "main",
  name: "PAD A",
  interval: 1000,
  cost: 0,
  x: 104,
  y: 77,
  color: COLORS.gold,
};

/** Playfield, unlocks, and skill tree all read this list. */
export const EXTRA_PADS = [
  {
    id: "pad-b",
    name: "PAD B",
    interval: 1400,
    cost: 120,
    x: 216,
    y: 49,
    color: "#7eb8c9",
    treeX: 212,
    treeY: 8,
    blurb: "Extra pad, 1.4s timer",
    icon: [
      "........",
      ".XXXXXX.",
      ".X....X.",
      ".X.XX.X.",
      ".X.XX.X.",
      ".X....X.",
      ".XXXXXX.",
      "........",
    ],
  },
  {
    id: "pad-c",
    name: "PAD C",
    interval: 720,
    cost: 180,
    x: 216,
    y: 131,
    color: "#c98b7e",
    treeX: 276,
    treeY: 48,
    blurb: "Extra pad, 0.7s timer",
    icon: [
      "........",
      ".XXXX...",
      ".X..X...",
      ".XXXX.XX",
      "......X.",
      "...XXXX.",
      "...X..X.",
      "...XXXX.",
    ],
  },
] as const satisfies readonly ExtraPadDef[];

export type ExtraPadId = (typeof EXTRA_PADS)[number]["id"];

const BY_ID = new Map<string, PadDef>([
  [MAIN_PAD.id, MAIN_PAD],
  ...EXTRA_PADS.map((p) => [p.id, p] as const),
]);

export function extraPadById(id: string): ExtraPadDef | undefined {
  return EXTRA_PADS.find((p) => p.id === id);
}

export function isExtraPadId(id: string): id is ExtraPadId {
  return extraPadById(id) !== undefined;
}

export function padById(id: string): PadDef {
  return BY_ID.get(id) ?? MAIN_PAD;
}

export function minionsOnStation(
  minions: number,
  index: number,
  stations: number,
): number {
  if (stations <= 0) return 0;
  return Math.floor(minions / stations) + (index < minions % stations ? 1 : 0);
}
