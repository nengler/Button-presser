import { COLORS } from "../game/view.ts";

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Blend `fg` over the ink backdrop. Keeps pulse discs on the pixel grid. */
export function fadeOnInk(fg: string, alpha: number): string {
  const t = Math.max(0, Math.min(1, alpha));
  const [fr, fgG, fb] = hexRgb(fg);
  const [br, bg, bb] = hexRgb(COLORS.ink);
  const r = Math.round(fr * t + br * (1 - t));
  const g = Math.round(fgG * t + bg * (1 - t));
  const b = Math.round(fb * t + bb * (1 - t));
  return `rgb(${r},${g},${b})`;
}

export function fillDisc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
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

export function fillRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
): void {
  const inner2 = rInner * rInner;
  const outer2 = rOuter * rOuter;
  for (let y = -rOuter; y <= rOuter; y++) {
    for (let x = -rOuter; x <= rOuter; x++) {
      const d2 = x * x + y * y;
      if (d2 <= outer2 && d2 >= inner2) ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
}

/** Sweep from 6 o'clock toward 3 o'clock, then up. `sweep` is radians, 0–2π. */
export function fillSweepRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  sweep: number,
): void {
  const tau = Math.PI * 2;
  const span = Math.max(0, Math.min(tau, sweep));
  if (span <= 0) return;
  const inner2 = rInner * rInner;
  const outer2 = rOuter * rOuter;
  for (let y = -rOuter; y <= rOuter; y++) {
    for (let x = -rOuter; x <= rOuter; x++) {
      const d2 = x * x + y * y;
      if (d2 > outer2 || d2 < inner2) continue;
      let fromBottom = Math.PI / 2 - Math.atan2(y, x);
      if (fromBottom < 0) fromBottom += tau;
      if (fromBottom <= span) ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
}

/** Stamp an 8×8 `X`/`.` glyph at stage pixels `(x, y)`. */
export function stampGlyph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rows: readonly string[],
  color: string,
): void {
  ctx.fillStyle = color;
  for (let row = 0; row < rows.length; row++) {
    const line = rows[row]!;
    for (let col = 0; col < line.length; col++) {
      if (line[col] === "X") ctx.fillRect(x + col, y + row, 1, 1);
    }
  }
}
