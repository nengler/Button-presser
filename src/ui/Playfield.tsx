import { useEffect, useRef } from "react";
import { padById } from "../game/toys.ts";
import { COLORS, HEIGHT, PX, WIDTH } from "../game/view.ts";
import type { Burst, PadRuntime } from "./useFutureToys.ts";
import { fadeOnInk, fillDisc, fillRing, fillSweepRing } from "./pixelDraw.ts";

const HIT_R = 1.2;
const SPARK_POOL = 40;
const MINION_ORBIT = 1.38;
const MINION_SPIN = 0.85;
const MAX_DT = 0.05;

const MOSS_IN = Math.round(0.88 * PX);
const MOSS_OUT = Math.round(0.94 * PX);
const SWEEP_IN = Math.round(0.98 * PX);
const SWEEP_OUT = Math.round(1.06 * PX);
const MINION_R = Math.max(1, Math.round(0.11 * PX));

type Speck = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
};

function toScreen(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.round(WIDTH / 2 + x * PX),
    y: Math.round(HEIGHT / 2 - y * PX),
  };
}

function toWorld(sx: number, sy: number): { x: number; y: number } {
  return {
    x: (sx - WIDTH / 2) / PX,
    y: (HEIGHT / 2 - sy) / PX,
  };
}

function eventToStage(canvas: HTMLCanvasElement, e: PointerEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * WIDTH,
    y: ((e.clientY - rect.top) / rect.height) * HEIGHT,
  };
}

function hitPad(pads: PadRuntime[], sx: number, sy: number): string | null {
  const { x: wx, y: wy } = toWorld(sx, sy);
  let best: { id: string; d2: number } | null = null;
  const r2 = HIT_R * HIT_R;
  for (const pad of pads) {
    const def = padById(pad.id);
    const dx = wx - def.x;
    const dy = wy - def.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > r2) continue;
    if (!best || d2 < best.d2) best = { id: pad.id, d2 };
  }
  return best?.id ?? null;
}

function minionsOnStation(minions: number, index: number, stations: number): number {
  if (stations <= 0) return 0;
  return Math.floor(minions / stations) + (index < minions % stations ? 1 : 0);
}

function drawBeat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  phase: number,
  color: string,
) {
  const dist = Math.min(phase, 1 - phase);
  const near = 1 - dist * 2;
  const pulseR = Math.round(0.7 * PX + near * 0.25 * PX);
  const pipR = Math.max(1, Math.round(0.08 * PX + near * 0.1 * PX));
  const sweep = Math.max(0.001, phase * Math.PI * 2);
  const pulseOpacity = 0.08 + near * 0.22;

  ctx.fillStyle = fadeOnInk(color, pulseOpacity);
  fillDisc(ctx, cx, cy, pulseR);

  ctx.fillStyle = COLORS.moss;
  fillRing(ctx, cx, cy, MOSS_IN, MOSS_OUT);

  ctx.fillStyle = color;
  fillSweepRing(ctx, cx, cy, SWEEP_IN, SWEEP_OUT, sweep);

  ctx.fillStyle = COLORS.goldHot;
  fillDisc(ctx, cx, cy, pipR);
}

function spawnSparks(specks: Speck[], burst: Burst) {
  for (let i = 0; i < 18; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1.2 + Math.random() * 3.4;
    specks.push({
      x: burst.x,
      y: burst.y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 1,
      max: 0.45 + Math.random() * 0.35,
    });
  }
  if (specks.length > SPARK_POOL) {
    specks.splice(0, specks.length - SPARK_POOL);
  }
}

function stepSparks(specks: Speck[], dt: number) {
  for (let i = specks.length - 1; i >= 0; i--) {
    const p = specks[i]!;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt / p.max;
    if (p.life <= 0) specks.splice(i, 1);
  }
}

export function Playfield({
  pads,
  minions,
  burst,
  onPressPad,
}: {
  pads: PadRuntime[];
  minions: number;
  burst: Burst;
  onPressPad: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padsRef = useRef(pads);
  const minionsRef = useRef(minions);
  const burstRef = useRef(burst);
  const onPressRef = useRef(onPressPad);
  padsRef.current = pads;
  minionsRef.current = minions;
  burstRef.current = burst;
  onPressRef.current = onPressPad;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !ctx) return;

    ctx.imageSmoothingEnabled = false;

    const specks: Speck[] = [];
    let lastNonce = 0;
    let elapsed = 0;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
      last = now;
      elapsed += dt;

      const burstNow = burstRef.current;
      if (burstNow.nonce !== 0 && burstNow.nonce !== lastNonce) {
        lastNonce = burstNow.nonce;
        spawnSparks(specks, burstNow);
      }
      stepSparks(specks, dt);

      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      const livePads = padsRef.current;
      for (const pad of livePads) {
        const def = padById(pad.id);
        const { x, y } = toScreen(def.x, def.y);
        drawBeat(ctx, x, y, pad.phase, def.color);
      }

      const stations = livePads.map((p) => p.id);
      const n = Math.max(stations.length, 1);
      const minionCount = minionsRef.current;
      ctx.fillStyle = COLORS.foam;
      for (let i = 0; i < stations.length; i++) {
        const assigned = minionsOnStation(minionCount, i, n);
        if (assigned === 0) continue;
        const pad = padById(stations[i]!);
        for (let m = 0; m < assigned; m++) {
          const angle = (m / assigned) * Math.PI * 2 + elapsed * MINION_SPIN;
          const { x, y } = toScreen(
            pad.x + Math.cos(angle) * MINION_ORBIT,
            pad.y + Math.sin(angle) * MINION_ORBIT,
          );
          fillDisc(ctx, x, y, MINION_R);
        }
      }

      ctx.fillStyle = COLORS.goldHot;
      for (const p of specks) {
        const { x, y } = toScreen(p.x, p.y);
        const r = Math.max(1, Math.round((0.04 + p.life * 0.08) * PX));
        fillDisc(ctx, x, y, r);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const pointOnPad = (e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const { x, y } = eventToStage(canvas, e);
    return hitPad(padsRef.current, x, y);
  };

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      onPointerDown={(e) => {
        const id = pointOnPad(e.nativeEvent);
        if (id) onPressRef.current(id);
      }}
      onPointerMove={(e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.style.cursor = pointOnPad(e.nativeEvent) ? "pointer" : "default";
      }}
      onPointerLeave={() => {
        const canvas = canvasRef.current;
        if (canvas) canvas.style.cursor = "default";
      }}
    />
  );
}
