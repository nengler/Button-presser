import { COLORS } from "../game/view.ts";

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function fadeMix(fg: string, bg: string, alpha: number): string {
  const t = Math.max(0, Math.min(1, alpha));
  const [r, g, b] = hexRgb(fg);
  const [br, bgR, bb] = hexRgb(bg);
  return `rgb(${Math.round(r * t + br * (1 - t))},${Math.round(g * t + bgR * (1 - t))},${Math.round(b * t + bb * (1 - t))})`;
}

export function fadeOnInk(fg: string, alpha: number): string {
  return fadeMix(fg, COLORS.ink, alpha);
}

const CURSOR_ROWS = [
  "10",
  "110",
  "1210",
  "12210",
  "122210",
  "1222210",
  "1222111",
  "1210",
  "11210",
  "10 1210",
  "    10",
] as const;

/** Same arrow, one row shorter so it reads as pushed into the click. */
const CURSOR_PRESS_ROWS = [
  "10",
  "110",
  "1210",
  "122210",
  "1222210",
  "1222111",
  "1210",
  "11210",
  "10 1210",
  "    10",
] as const;

function eachCursorPixel(
  rows: readonly string[],
  fn: (col: number, row: number, ch: string) => void,
): void {
  for (const [row, cells] of rows.entries()) {
    for (const [col, ch] of [...cells].entries()) {
      if (ch === "0" || ch === " ") continue;
      fn(col, row, ch);
    }
  }
}

/** Classic arrow, hotspot at the tip. `hot` is gold fill (game button / UI). */
export function fillCursor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hot: boolean,
  texel = 1,
  pressed = false,
): void {
  const fill = hot ? COLORS.goldHot : COLORS.foam;
  const ink = COLORS.ink;
  const rows = pressed ? CURSOR_PRESS_ROWS : CURSOR_ROWS;
  const originY = y + (pressed ? texel : 0);

  ctx.fillStyle = fill;
  eachCursorPixel(rows, function (col, row) {
    const px = x + col * texel;
    const py = originY + row * texel;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        ctx.fillRect(px + dx * texel, py + dy * texel, texel, texel);
      }
    }
  });
  eachCursorPixel(rows, function (col, row, ch) {
    ctx.fillStyle = ch === "1" ? ink : fill;
    ctx.fillRect(x + col * texel, originY + row * texel, texel, texel);
  });
}

export function fillStar(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.fillRect(cx, cy - 3, 1, 7);
  ctx.fillRect(cx - 3, cy, 7, 1);
  ctx.fillRect(cx - 1, cy - 1, 3, 3);
}

export function fillDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  if (r < 1) {
    ctx.fillRect(cx, cy, 1, 1);
    return;
  }
  const r2 = r * r;
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r2 - y * y));
    ctx.fillRect(cx - w, cy + y, w * 2 + 1, 1);
  }
}

function eachRingPixel(rInner: number, rOuter: number, fn: (x: number, y: number) => void): void {
  const inner2 = rInner * rInner;
  const outer2 = rOuter * rOuter;
  for (let y = -rOuter; y <= rOuter; y++) {
    for (let x = -rOuter; x <= rOuter; x++) {
      const d2 = x * x + y * y;
      if (d2 <= outer2 && d2 >= inner2) fn(x, y);
    }
  }
}

export function fillRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
): void {
  eachRingPixel(rInner, rOuter, function (x, y) {
    ctx.fillRect(cx + x, cy + y, 1, 1);
  });
}

/** Sweep from 6 o'clock toward 3 o'clock. `sweep` is 0–2π radians.
 *  Leading edge is feathered so the front crawls instead of popping pixels. */
export function fillSweepRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  sweep: number,
  color: string,
): void {
  const tau = Math.PI * 2;
  const span = Math.max(0, Math.min(tau, sweep));
  if (span <= 0) return;
  const feather = 0.2;
  const preview = feather * 0.55;
  eachRingPixel(rInner, rOuter, function (x, y) {
    let fromBottom = Math.PI / 2 - Math.atan2(y, x);
    if (fromBottom < 0) fromBottom += tau;
    const d = fromBottom - span;
    let t = 0;
    if (d <= 0) {
      const behind = -d;
      t = behind < feather ? 0.35 + 0.65 * (behind / feather) : 1;
    } else if (d < preview) {
      t = 0.32 * (1 - d / preview);
    }
    if (t <= 0) return;
    ctx.fillStyle = fadeOnInk(color, t);
    ctx.fillRect(cx + x, cy + y, 1, 1);
  });
}

/** Bilinear 2×2 so a point can crawl between texels. */
export function fillSoftDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
): void {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  plotSoft(ctx, x0, y0, (1 - fx) * (1 - fy), color);
  plotSoft(ctx, x0 + 1, y0, fx * (1 - fy), color);
  plotSoft(ctx, x0, y0 + 1, (1 - fx) * fy, color);
  plotSoft(ctx, x0 + 1, y0 + 1, fx * fy, color);
}

function plotSoft(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  weight: number,
  color: string,
): void {
  if (weight < 0.08) return;
  ctx.fillStyle = fadeOnInk(color, 0.4 + weight * 0.6);
  ctx.fillRect(x, y, 1, 1);
}
