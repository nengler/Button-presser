import { useEffect, useRef } from "react";
import type { Game } from "../game/Game.ts";
import { MAIN_PAD, minionsOnStation, padById } from "../game/pads.ts";
import { COLORS, HEIGHT, WIDTH } from "../game/view.ts";
import { fadeOnInk, fillDisc, fillRing, fillSweepRing } from "./pixelDraw.ts";

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

function clientPos(el: HTMLElement, clientX: number, clientY: number) {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return { x: -1, y: -1 };
  return {
    x: ((clientX - rect.left) / rect.width) * WIDTH,
    y: ((clientY - rect.top) / rect.height) * HEIGHT,
  };
}

function hitPad(pads: { id: string }[], sx: number, sy: number): string | null {
  let best: { id: string; d2: number } | null = null;
  const r2 = HIT_R * HIT_R;
  for (const pad of pads) {
    const def = padById(pad.id);
    const d2 = (sx - def.x) ** 2 + (sy - def.y) ** 2;
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
  const near = 1 - Math.min(phase, 1 - phase) * 2;
  const pulseR = Math.round(PULSE_R0 + near * (PULSE_R1 - PULSE_R0));
  const pipR = Math.max(1, Math.round(PIP_R0 + near * (PIP_R1 - PIP_R0)));

  ctx.fillStyle = fadeOnInk(color, 0.08 + near * 0.22);
  fillDisc(ctx, cx, cy, pulseR);
  ctx.fillStyle = COLORS.moss;
  fillRing(ctx, cx, cy, MOSS_IN, MOSS_OUT);
  ctx.fillStyle = color;
  fillSweepRing(ctx, cx, cy, SWEEP_IN, SWEEP_OUT, Math.max(0.001, phase * Math.PI * 2));
  ctx.fillStyle = COLORS.goldHot;
  fillDisc(ctx, cx, cy, pipR);
}

function spawnSparks(specks: Speck[], x: number, y: number) {
  for (let i = 0; i < 18; i++) {
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

export function Playfield({ game }: { game: Game }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitLayerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef(game);
  gameRef.current = game;

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

      const g = gameRef.current;
      g.tick(now);
      if (g.burst.nonce !== 0 && g.burst.nonce !== lastNonce) {
        lastNonce = g.burst.nonce;
        spawnSparks(specks, g.burst.x, g.burst.y);
      }
      for (let i = specks.length - 1; i >= 0; i--) {
        const p = specks[i]!;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt / p.max;
        if (p.life <= 0) specks.splice(i, 1);
      }

      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      const pads = g.pads(now);
      for (const pad of pads) {
        const def = padById(pad.id);
        drawBeat(ctx, def.x, def.y, pad.phase, def.color);
      }

      const n = Math.max(pads.length, 1);
      const minions = g.minions;
      ctx.fillStyle = COLORS.foam;
      for (let i = 0; i < pads.length; i++) {
        const count = minionsOnStation(minions, i, n);
        if (count === 0) continue;
        const pad = padById(pads[i]!.id);
        for (let m = 0; m < count; m++) {
          const angle = (m / count) * Math.PI * 2 + elapsed * MINION_SPIN;
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
        fillDisc(
          ctx,
          Math.round(p.x),
          Math.round(p.y),
          Math.max(1, Math.round(1 + p.life * 3)),
        );
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const padAt = (clientX: number, clientY: number) => {
    const hit = hitLayerRef.current;
    if (!hit) return null;
    const { x, y } = clientPos(hit, clientX, clientY);
    return hitPad(gameRef.current.pads(), x, y);
  };

  const pressAt = (clientX: number, clientY: number) => {
    const id = padAt(clientX, clientY);
    if (!id) return;
    const g = gameRef.current;
    if (!g.snapshot().running && id === MAIN_PAD.id) {
      g.start();
      return;
    }
    g.press(id);
  };

  return (
    <>
      <div className="playfield">
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
      </div>
      {/* Sibling overlay above HUD text so iOS can hit the ring; canvas pointer events are flaky. */}
      <div
        ref={hitLayerRef}
        className="pad-hit"
        onPointerDown={(e) => {
          if (e.button !== 0 && e.pointerType === "mouse") return;
          e.preventDefault();
          pressAt(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          const hit = hitLayerRef.current;
          if (hit) hit.style.cursor = padAt(e.clientX, e.clientY) ? "pointer" : "default";
        }}
        onPointerLeave={() => {
          if (hitLayerRef.current) hitLayerRef.current.style.cursor = "default";
        }}
      />
    </>
  );
}
