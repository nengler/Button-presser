/** Internal render resolution (16:9). Draw here; the stage integer-scales it. */
export const WIDTH = 320;
export const HEIGHT = 180;

/**
 * SLSO8 (Luis Miguel Maldonado) — dusk, eight stops.
 * Oil 6 is too tight for grades + sky bands. 31 fights a clean stage.
 * https://lospec.com/palette-list/slso8
 */
export const PALETTE = [
  "#0d2b45",
  "#203c56",
  "#544e68",
  "#8d697a",
  "#d08159",
  "#ffaa5e",
  "#ffd4a3",
  "#ffecd6",
] as const;

export const COLORS = {
  ink: PALETTE[0],
  ink2: PALETTE[1],
  panel: PALETTE[1],
  moss: PALETTE[2],
  sage: PALETTE[3],
  foam: PALETTE[7],
  gold: PALETTE[5],
  goldHot: PALETTE[6],
  miss: PALETTE[4],
  perfect: PALETTE[7],
  great: PALETTE[6],
  good: PALETTE[5],
  ok: PALETTE[3],
  dim: PALETTE[2],
} as const;
