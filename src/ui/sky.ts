import { PALETTE } from "../game/view.ts";

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const RGB: readonly [number, number, number][] = PALETTE.map(rgb);

/** Cream is stars only — sky bands stop at peach. */
const SKY_LAST = RGB.length - 2;
const HORIZON = 0.68;
const BAND = 55;

let pixels: ImageData | undefined;

function hash(x: number, y: number): number {
  return ((x * 73856093) ^ (y * 19349663)) >>> 0;
}

function warmth(x: number, y: number, w: number, h: number, t: number): number {
  const u = x / w;
  const v = y / h;
  const dx = u - 0.5;
  const hv = v - HORIZON;
  const band = Math.max(0, 1 - hv * hv * BAND);
  return (
    0.05 +
    v * 0.1 +
    band * 0.5 +
    0.03 * Math.sin(u * 3.6 + t * 0.11) +
    0.02 * Math.sin((u + v) * 5.2 - t * 0.07) +
    0.015 * Math.sin(t * 0.22) -
    dx * dx * 0.06
  );
}

function starlit(x: number, y: number, h: number, t: number): boolean {
  if (y >= h * HORIZON * 0.92) return false;
  const hy = hash(x, y);
  if (hy % 1601 !== 0) return false;
  return 0.45 + 0.55 * Math.sin(t * 1.4 + (hy % 97)) > 0.38;
}

/** Night sky + a thin dusk band. Mapped to the full canvas, not the 180px stage. */
export function drawSky(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  w: number,
  h: number,
): void {
  if (!pixels || pixels.width !== w || pixels.height !== h) {
    pixels = new ImageData(w, h);
  }
  const data = pixels.data;
  const t = elapsed;
  const cream = RGB[RGB.length - 1]!;
  let i = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (starlit(x, y, h, t)) {
        data[i] = cream[0];
        data[i + 1] = cream[1];
        data[i + 2] = cream[2];
        data[i + 3] = 255;
        i += 4;
        continue;
      }
      const n = Math.max(0, Math.min(1, warmth(x, y, w, h, t)));
      const scaled = n * SKY_LAST;
      const lo = Math.min(SKY_LAST - 1, Math.floor(scaled));
      const pick = scaled - lo > BAYER[y & 3]![x & 3]! / 16 ? lo + 1 : lo;
      const c = RGB[pick]!;
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = 255;
      i += 4;
    }
  }
  ctx.putImageData(pixels, 0, 0);
}
