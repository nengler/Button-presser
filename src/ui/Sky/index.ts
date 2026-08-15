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

const LAST = RGB.length - 1;
/** Push the old dusk curve toward the bottom of the window. */
const FALL = 1.75;

let pixels: ImageData | undefined;

function hash(x: number, y: number): number {
  return ((x * 73856093) ^ (y * 19349663)) >>> 0;
}

function warmth(x: number, y: number, w: number, h: number, t: number): number {
  const u = x / w;
  const v = Math.pow(y / h, FALL);
  const dx = u - 0.5;
  return (
    v * 0.52 +
    v * v * 0.28 +
    0.07 * Math.sin(u * 3.6 + t * 0.11) +
    0.045 * Math.sin((u + v) * 5.2 - t * 0.07) +
    0.03 * Math.sin(t * 0.22) -
    dx * dx * 0.1
  );
}

function starlit(x: number, y: number, h: number, t: number): boolean {
  if (y / h > 0.62) return false;
  const hy = hash(x, y);
  if (hy % 1601 !== 0) return false;
  return 0.45 + 0.55 * Math.sin(t * 1.4 + (hy % 97)) > 0.38;
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
  const t = elapsed;
  let i = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = Math.max(0, Math.min(1, warmth(x, y, w, h, t)));
      const scaled = n * LAST;
      const lo = Math.min(LAST - 1, Math.floor(scaled));
      const pick = scaled - lo > BAYER[y & 3]![x & 3]! / 16 ? lo + 1 : lo;
      const c = starlit(x, y, h, t) ? RGB[LAST]! : RGB[pick]!;
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = 255;
      i += 4;
    }
  }
  ctx.putImageData(pixels, 0, 0);
}
