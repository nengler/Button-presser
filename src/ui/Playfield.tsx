import { useEffect, useRef } from "react";
import type { Game } from "../game/Game.ts";
import { padById, starsOnStation } from "../game/pads.ts";
import { COLORS, HEIGHT, WIDTH } from "../game/view.ts";
import { fadeOnInk, fillDisc, fillRing, fillStar, fillSweepRing } from "./pixelDraw.ts";
import { hitPad, pointerToCanvas } from "./pointer.ts";

const RING_IN = 30;
const RING_OUT = 34;
const PIP_R0 = 2;
const PIP_R1 = 5;
const STAR_ORBIT = 42;
const STAR_SPIN = 0.85;
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

function drawBeat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  phase: number,
  color: string,
  mark: 0 | 1 | 2,
) {
  const near = 1 - Math.min(phase, 1 - phase) * 2;
  const pipR = Math.max(2, Math.round(PIP_R0 + near * (PIP_R1 - PIP_R0)));

  ctx.fillStyle = COLORS.moss;
  fillRing(ctx, cx, cy, RING_IN, RING_OUT);
  ctx.fillStyle = color;
  fillSweepRing(ctx, cx, cy, RING_IN, RING_OUT, Math.max(0.001, phase * Math.PI * 2));
  ctx.fillStyle = fadeOnInk(COLORS.goldHot, 0.5 + near * 0.5);
  fillDisc(ctx, cx, cy, pipR);
  if (mark > 0) {
    ctx.fillStyle = mark === 2 ? COLORS.foam : COLORS.sage;
    fillRing(ctx, cx, cy, 8, 10);
  }
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
  const gameRef = useRef(game);
  gameRef.current = game;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
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

      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      const pads = g.pads(now);
      for (const pad of pads) {
        const def = padById(pad.id);
        drawBeat(ctx, def.x, def.y, pad.phase, def.color, pad.mark);
      }

      const n = Math.max(pads.length, 1);
      const stars = g.stars;
      ctx.fillStyle = COLORS.foam;
      for (let i = 0; i < pads.length; i++) {
        const count = starsOnStation(stars, i, n);
        if (count === 0) continue;
        const pad = padById(pads[i]!.id);
        for (let m = 0; m < count; m++) {
          const angle = (m / count) * Math.PI * 2 + elapsed * STAR_SPIN;
          fillStar(
            ctx,
            Math.round(pad.x + Math.cos(angle) * STAR_ORBIT),
            Math.round(pad.y - Math.sin(angle) * STAR_ORBIT),
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

    const stage: HTMLElement = canvas.closest(".stage") ?? canvas;
    const uiControl = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest("button, .tree");

    const onPointerDown = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (uiControl(e.target)) return;
      const pos = pointerToCanvas(canvas, e.clientX, e.clientY);
      if (!pos) return;
      e.preventDefault();
      const id = hitPad(gameRef.current.pads(), pos.x, pos.y);
      if (!id) return;
      gameRef.current.press(id);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!e.isPrimary || e.pointerType !== "mouse") return;
      const pos = pointerToCanvas(canvas, e.clientX, e.clientY);
      canvas.style.cursor =
        pos && hitPad(gameRef.current.pads(), pos.x, pos.y) ? "pointer" : "default";
    };

    const opts: AddEventListenerOptions = { capture: true, passive: false };
    stage.addEventListener("pointerdown", onPointerDown, opts);
    stage.addEventListener("pointermove", onPointerMove, opts);

    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("pointerdown", onPointerDown, opts);
      stage.removeEventListener("pointermove", onPointerMove, opts);
    };
  }, []);

  return (
    <div className="playfield">
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
    </div>
  );
}
