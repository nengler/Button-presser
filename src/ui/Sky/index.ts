import { PALETTE } from "../../game/view";

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

/** Night stays on the two navies; dusk lands on moss/sage instead of the oranges. */
const SKY = [RGB[0], RGB[1], RGB[2], RGB[3], RGB[3]] as const;
const LAST = SKY.length - 1;
const STAR_DIM = RGB[6]!;
const STAR_HOT = RGB[7]!;
/** Push the old dusk curve toward the bottom of the window. */
const FALL = 1.5;
/** Slow the dusk drift and star twinkle. */
const TIME = 0.8;
/** How far Bayer strays from a hard 0.5 cutoff. 1 is full dither. */
const DITHER = 0.45;

let pixels: ImageData | undefined;

function hash(x: number, y: number): number {
  return ((x * 73856093) ^ (y * 19349663)) >>> 0;
}

function warmth(x: number, y: number, w: number, h: number, t: number): number {
  const u = x / w;
  const v = Math.pow(y / h, FALL);
  const dx = u - 0.5;
  return (
    v * 0.42 +
    v * v * 0.32 +
    0.045 * Math.sin(u * 3.6 + t * 0.11) +
    0.03 * Math.sin((u + v) * 5.2 - t * 0.07) +
    0.02 * Math.sin(t * 0.22) -
    dx * dx * 0.1
  );
}

function starlit(x: number, y: number, h: number): boolean {
  if (y / h > 0.55) return false;
  return hash(x, y) % 420 === 0;
}

function starColor(x: number, y: number, t: number): [number, number, number] {
  const hy = hash(x, y);
  const phase = ((hy >>> 11) % 628) / 100;
  const rate = 0.5 + ((hy >>> 5) % 8) * 0.28;
  return Math.sin(t * rate + phase) > 0.55 ? STAR_HOT : STAR_DIM;
}

/** Same dusk as the 180px sky, stretched so night lasts longer and sun sits at the bottom. */
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
  const t = elapsed * TIME;
  let i = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = Math.max(0, Math.min(1, warmth(x, y, w, h, t)));
      const scaled = n * LAST;
      const lo = Math.min(LAST - 1, Math.floor(scaled));
      const bayer = BAYER[y & 3]![x & 3]! / 16;
      const pick = scaled - lo > 0.5 + (bayer - 0.5) * DITHER ? lo + 1 : lo;
      const c = starlit(x, y, h) ? starColor(x, y, t) : SKY[pick]!;
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = 255;
      i += 4;
    }
  }
  ctx.putImageData(pixels, 0, 0);
}
