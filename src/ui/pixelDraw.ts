import { COLORS } from "../game/view.ts";

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function fadeOnInk(fg: string, alpha: number): string {
  const t = Math.max(0, Math.min(1, alpha));
  const [r, g, b] = hexRgb(fg);
  const [ir, ig, ib] = hexRgb(COLORS.ink);
  return `rgb(${Math.round(r * t + ir * (1 - t))},${Math.round(g * t + ig * (1 - t))},${Math.round(b * t + ib * (1 - t))})`;
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

function eachRingPixel(
  rInner: number,
  rOuter: number,
  fn: (x: number, y: number) => void,
): void {
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
  eachRingPixel(rInner, rOuter, (x, y) => ctx.fillRect(cx + x, cy + y, 1, 1));
}

/** Sweep from 6 o'clock toward 3 o'clock. `sweep` is 0–2π radians. */
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
  eachRingPixel(rInner, rOuter, (x, y) => {
    let fromBottom = Math.PI / 2 - Math.atan2(y, x);
    if (fromBottom < 0) fromBottom += tau;
    if (fromBottom <= span) ctx.fillRect(cx + x, cy + y, 1, 1);
  });
}
