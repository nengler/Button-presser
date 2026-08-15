import type { ButtonKind } from "./types.ts";
import { COLORS } from "./view.ts";

export const STAR_COST = 220;
export const STAR_MAX = 4;

/** Max gap between the two taps of a double button. */
export const DOUBLE_GAP_MS = 280;

/** 8×8 glyph: `X` on, `.` off. */
export type Glyph = readonly string[];

export type ButtonDef = {
  id: string;
  name: string;
  kind: ButtonKind;
  interval: number;
  cost: number;
  /** Center on the 320×180 stage (pixels, Y down). */
  x: number;
  y: number;
  color: string;
};

export type ExtraButtonDef = ButtonDef & {
  treeX: number;
  treeY: number;
  blurb: string;
  icon: Glyph;
};

export const MAIN_BUTTON: ButtonDef = {
  id: "main",
  name: "MAIN",
  kind: "beat",
  interval: 1000,
  cost: 0,
  x: 88,
  y: 88,
  color: COLORS.gold,
};

/** Playfield, unlocks, and skill tree all read this list. */
export const EXTRA_BUTTONS = [
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
    blurb: "Second button on a 1.5s timer",
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
] as const satisfies readonly ExtraButtonDef[];

export type ExtraButtonId = (typeof EXTRA_BUTTONS)[number]["id"];

const BY_ID = new Map<string, ButtonDef>([
  [MAIN_BUTTON.id, MAIN_BUTTON],
  ...EXTRA_BUTTONS.map(function (p) {
    return [p.id, p] as const;
  }),
]);

export function extraButtonById(id: string): ExtraButtonDef | undefined {
  return EXTRA_BUTTONS.find(function (p) {
    return p.id === id;
  });
}

export function isExtraButtonId(id: string): id is ExtraButtonId {
  return extraButtonById(id) !== undefined;
}

export function buttonById(id: string): ButtonDef {
  return BY_ID.get(id) ?? MAIN_BUTTON;
}

export function starsOnButton(stars: number, index: number, buttons: number): number {
  if (buttons <= 0) return 0;
  return Math.floor(stars / buttons) + (index < stars % buttons ? 1 : 0);
}
