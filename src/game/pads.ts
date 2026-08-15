import type { PadKind } from "./types.ts";
import { COLORS } from "./view.ts";

export const STAR_COST = 220;
export const STAR_MAX = 4;

/** Max gap between the two taps of a double pad. */
export const DOUBLE_GAP_MS = 280;

/** 8×8 glyph: `X` on, `.` off. */
export type Glyph = readonly string[];

export type PadDef = {
  id: string;
  name: string;
  kind: PadKind;
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
  kind: "beat",
  interval: 1000,
  cost: 0,
  x: 88,
  y: 88,
  color: COLORS.gold,
};

/** Playfield, unlocks, and skill tree all read this list. */
export const EXTRA_PADS = [
  {
    id: "pad-slow",
    name: "1.5s",
    kind: "beat",
    interval: 1500,
    cost: 280,
    x: 176,
    y: 48,
    color: COLORS.sage,
    treeX: 164,
    treeY: 4,
    blurb: "Second pad on a 1.5s timer",
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
    id: "pad-twin",
    name: "TWIN",
    kind: "double",
    interval: 3000,
    cost: 420,
    x: 256,
    y: 92,
    color: COLORS.goldHot,
    treeX: 216,
    treeY: 4,
    blurb: "Double-tap each 3s beat",
    icon: [
      "........",
      ".XX..XX.",
      ".XX..XX.",
      "........",
      ".XX..XX.",
      ".XX..XX.",
      "........",
      "........",
    ],
  },
  {
    id: "pad-pair",
    name: "PAIR",
    kind: "pair",
    interval: 750,
    cost: 520,
    x: 168,
    y: 140,
    color: COLORS.miss,
    treeX: 268,
    treeY: 4,
    blurb: "0.75s beat — two hits in a row to score",
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

export function starsOnStation(
  stars: number,
  index: number,
  stations: number,
): number {
  if (stations <= 0) return 0;
  return Math.floor(stars / stations) + (index < stars % stations ? 1 : 0);
}
