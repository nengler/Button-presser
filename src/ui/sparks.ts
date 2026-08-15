import { COLORS } from "../game/view.ts";
import { fadeOnInk, fillDisc } from "./pixelDraw.ts";

const SPARK_POOL = 40;
const SPARK_SPEED0 = 43;
const SPARK_SPEED1 = 166;

export type Speck = {
  life: number;
  max: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

export function spawnSparks(specks: Speck[], x: number, y: number, count = 18): void {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = SPARK_SPEED0 + Math.random() * (SPARK_SPEED1 - SPARK_SPEED0);
    specks.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: -Math.sin(a) * s,
      life: 1,
      max: 0.45 + Math.random() * 0.35,
    });
  }
  if (specks.length > SPARK_POOL) specks.splice(0, specks.length - SPARK_POOL);
}

export function stepSparks(specks: Speck[], dt: number): void {
  for (let i = specks.length - 1; i >= 0; i--) {
    const p = specks[i]!;
    p.x += p.vx * p.life * dt;
    p.y += p.vy * p.life * dt;
    p.life -= dt / p.max;
    if (p.life <= 0) specks.splice(i, 1);
  }
}

export function drawSparks(ctx: CanvasRenderingContext2D, specks: Speck[]): void {
  for (const p of specks) {
    ctx.fillStyle = fadeOnInk(COLORS.goldHot, p.life);
    fillDisc(ctx, Math.round(p.x), Math.round(p.y), Math.max(1, Math.round(1 + p.life * 3)));
  }
}
