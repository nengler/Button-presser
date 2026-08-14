import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { minionsOnStation, padById } from "../game/toys.ts";
import { COLORS, HEIGHT, WIDTH } from "../game/view.ts";
import type { Burst, PadRuntime } from "./useFutureToys.ts";
import { fadeOnInk, fillDisc, fillRing, fillSweepRing } from "./pixelDraw.ts";

/** Beat-ring sizes in stage pixels. */
const MOSS_IN = 32;
const MOSS_OUT = 34;
const SWEEP_IN = 35;
const SWEEP_OUT = 38;
const PULSE_R0 = 25;
const PULSE_R1 = 34;
const PIP_R0 = 3;
const PIP_R1 = 7;
const HIT_R = 43;
const MINION_ORBIT = 50;
const MINION_R = 4;
const MINION_SPIN = 0.85;
const SPARK_POOL = 40;
const SPARK_SPEED0 = 43;
const SPARK_SPEED1 = 166;
const MAX_DT = 0.05;

type Speck = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
};

function eventToStage(canvas: HTMLCanvasElement, e: PointerEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * WIDTH,
    y: ((e.clientY - rect.top) / rect.height) * HEIGHT,
  };
}

function hitPad(pads: PadRuntime[], sx: number, sy: number): string | null {
  let best: { id: string; d2: number } | null = null;
  const r2 = HIT_R * HIT_R;
  for (const pad of pads) {
    const def = padById(pad.id);
    const dx = sx - def.x;
    const dy = sy - def.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > r2) continue;
    if (!best || d2 < best.d2) best = { id: pad.id, d2 };
  }
  return best?.id ?? null;
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
  const pulseR = Math.round(PULSE_R0 + near * (PULSE_R1 - PULSE_R0));
  const pipR = Math.max(1, Math.round(PIP_R0 + near * (PIP_R1 - PIP_R0)));
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
    const s = SPARK_SPEED0 + Math.random() * (SPARK_SPEED1 - SPARK_SPEED0);
    specks.push({
      x: burst.x,
      y: burst.y,
      vx: Math.cos(a) * s,
      vy: -Math.sin(a) * s,
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
  padsRef,
  minionsRef,
  burstRef,
  onPressPad,
}: {
  padsRef: RefObject<PadRuntime[]>;
  minionsRef: RefObject<number>;
  burstRef: RefObject<Burst>;
  onPressPad: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onPressRef = useRef(onPressPad);
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
      if (burstNow && burstNow.nonce !== 0 && burstNow.nonce !== lastNonce) {
        lastNonce = burstNow.nonce;
        spawnSparks(specks, burstNow);
      }
      stepSparks(specks, dt);

      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      const livePads = padsRef.current ?? [];
      for (const pad of livePads) {
        const def = padById(pad.id);
        drawBeat(ctx, def.x, def.y, pad.phase, def.color);
      }

      const stations = livePads.map((p) => p.id);
      const n = Math.max(stations.length, 1);
      const minionCount = minionsRef.current ?? 0;
      ctx.fillStyle = COLORS.foam;
      for (let i = 0; i < stations.length; i++) {
        const assigned = minionsOnStation(minionCount, i, n);
        if (assigned === 0) continue;
        const pad = padById(stations[i]!);
        for (let m = 0; m < assigned; m++) {
          const angle = (m / assigned) * Math.PI * 2 + elapsed * MINION_SPIN;
          fillDisc(
            ctx,
            Math.round(pad.x + Math.cos(angle) * MINION_ORBIT),
            Math.round(pad.y - Math.sin(angle) * MINION_ORBIT),
            MINION_R,
          );
        }
      }

      ctx.fillStyle = COLORS.goldHot;
      for (const p of specks) {
        const r = Math.max(1, Math.round(1 + p.life * 3));
        fillDisc(ctx, Math.round(p.x), Math.round(p.y), r);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [burstRef, minionsRef, padsRef]);

  const pointOnPad = (e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const { x, y } = eventToStage(canvas, e);
    return hitPad(padsRef.current ?? [], x, y);
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
