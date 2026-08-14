import { useEffect, useRef } from "react";
import { padById } from "../game/toys.ts";
import { COLORS, HEIGHT, WIDTH } from "../game/view.ts";
import type { Burst, PadRuntime } from "./useFutureToys.ts";

/** Matches the old R3F orthographic `camera.zoom`. */
const ZOOM = 36;
const HIT_R = 1.2;
const SPARK_POOL = 40;
const MINION_ORBIT = 1.38;
const MINION_SPIN = 0.85;
const MAX_DT = 0.05;

type Speck = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
};

function worldToScreen(x: number, y: number): [number, number] {
  return [WIDTH / 2 + x * ZOOM, HEIGHT / 2 - y * ZOOM];
}

function screenToWorld(sx: number, sy: number): [number, number] {
  return [(sx - WIDTH / 2) / ZOOM, (HEIGHT / 2 - sy) / ZOOM];
}

function eventToStage(canvas: HTMLCanvasElement, e: PointerEvent | MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * WIDTH,
    y: ((e.clientY - rect.top) / rect.height) * HEIGHT,
  };
}

function hitPad(pads: PadRuntime[], sx: number, sy: number): string | null {
  const [wx, wy] = screenToWorld(sx, sy);
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

function drawBeat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  phase: number,
  color: string,
) {
  const dist = Math.min(phase, 1 - phase);
  const near = 1 - dist * 2;
  const pulseR = (0.7 + near * 0.25) * ZOOM;
  const pipR = (0.08 + near * 0.1) * ZOOM;
  const sweep = Math.max(0.001, phase * Math.PI * 2);
  const pulseOpacity = 0.08 + near * 0.22;

  ctx.globalAlpha = pulseOpacity;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = COLORS.moss;
  ctx.lineWidth = (0.94 - 0.88) * ZOOM;
  ctx.beginPath();
  ctx.arc(cx, cy, ((0.88 + 0.94) / 2) * ZOOM, 0, Math.PI * 2);
  ctx.stroke();

  // Three.js ring theta is CCW from -π/2 (bottom in Y-up). Canvas Y is down, so
  // start at +π/2 (bottom) and sweep CCW.
  ctx.strokeStyle = color;
  ctx.lineWidth = (1.06 - 0.98) * ZOOM;
  ctx.beginPath();
  ctx.arc(
    cx,
    cy,
    ((0.98 + 1.06) / 2) * ZOOM,
    Math.PI / 2,
    Math.PI / 2 - sweep,
    true,
  );
  ctx.stroke();

  ctx.fillStyle = COLORS.goldHot;
  ctx.beginPath();
  ctx.arc(cx, cy, pipR, 0, Math.PI * 2);
  ctx.fill();
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
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

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

      ctx.imageSmoothingEnabled = false;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      const livePads = padsRef.current;
      for (const pad of livePads) {
        const def = padById(pad.id);
        const [cx, cy] = worldToScreen(def.x, def.y);
        drawBeat(ctx, cx, cy, pad.phase, def.color);
      }

      const stations = livePads.map((p) => p.id);
      const n = Math.max(stations.length, 1);
      const minionCount = minionsRef.current;
      ctx.fillStyle = COLORS.foam;
      for (let i = 0; i < stations.length; i++) {
        const assigned = [...Array(minionCount).keys()].filter((m) => m % n === i)
          .length;
        if (assigned === 0) continue;
        const pad = padById(stations[i]!);
        for (let m = 0; m < assigned; m++) {
          const angle = (m / assigned) * Math.PI * 2 + elapsed * MINION_SPIN;
          const [mx, my] = worldToScreen(
            pad.x + Math.cos(angle) * MINION_ORBIT,
            pad.y + Math.sin(angle) * MINION_ORBIT,
          );
          ctx.beginPath();
          ctx.arc(mx, my, 0.11 * ZOOM, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.fillStyle = COLORS.goldHot;
      for (const p of specks) {
        const [sx, sy] = worldToScreen(p.x, p.y);
        const r = (0.04 + p.life * 0.08) * ZOOM;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      onClick={(e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { x, y } = eventToStage(canvas, e.nativeEvent);
        const id = hitPad(padsRef.current, x, y);
        if (id) onPressRef.current(id);
      }}
      onPointerMove={(e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { x, y } = eventToStage(canvas, e.nativeEvent);
        const id = hitPad(padsRef.current, x, y);
        document.body.style.cursor = id ? "pointer" : "default";
      }}
      onPointerLeave={() => {
        document.body.style.cursor = "default";
      }}
    />
  );
}
