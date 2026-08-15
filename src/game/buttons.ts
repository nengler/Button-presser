import type { ButtonKind } from "./types.ts";
import { COLORS, HEIGHT, WIDTH } from "./view.ts";

export const STAR_MAX = 4;

export function starCost(owned: number): number {
  return Math.floor(8000 * Math.pow(2, owned));
}

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
  color: string;
};

/** Vertical center of the playfield row. */
export const BUTTON_Y = Math.round(HEIGHT / 2);

/** Center-to-center gap. Leaves a little air between rims. */
export const BUTTON_GAP = 80;

export function buttonCenter(index: number, count: number): { x: number; y: number } {
  const n = Math.max(1, count);
  const span = (n - 1) * BUTTON_GAP;
  const x = Math.round(WIDTH * 0.5 - span * 0.5 + index * BUTTON_GAP);
  return { x, y: BUTTON_Y };
}

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
  color: COLORS.gold,
};

/** Playfield, unlocks, and shop all read this list. */
export const EXTRA_BUTTONS = [
  {
    id: "pad-slow",
    name: "1.5s",
    kind: "beat",
    interval: 1500,
    cost: 12000,
    color: COLORS.sage,
    treeX: 8,
    treeY: 72,
    blurb: "Second button on a 1.5s timer",
    icon: [
      "..XXXX..",
      ".X....X.",
      "X.XXXX.X",
      "X.X..X.X",
      "X.X..X.X",
      "X.XXXX.X",
      ".X....X.",
      "..XXXX..",
    ],
  },
  {
    id: "pad-twin",
    name: "TWIN",
    kind: "double",
    interval: 3000,
    cost: 20000,
    color: COLORS.goldHot,
    treeX: 60,
    treeY: 36,
    blurb: "Double-tap each 3s beat",
    icon: [
      "XXX..XXX",
      "X.X..X.X",
      "XXX..XXX",
      "........",
      "XXX..XXX",
      "X.X..X.X",
      "XXX..XXX",
      "........",
    ],
  },
  {
    id: "pad-pair",
    name: "PAIR",
    kind: "pair",
    interval: 750,
    cost: 28000,
    color: COLORS.miss,
    treeX: 164,
    treeY: 72,
    blurb: "0.75s beat — two hits in a row to score",
    icon: [
      ".XXXXXX.",
      ".X....X.",
      ".XXXXXX.",
      "........",
      ".XXXXXX.",
      ".X....X.",
      ".XXXXXX.",
      "........",
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
