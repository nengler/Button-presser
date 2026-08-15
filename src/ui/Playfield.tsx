import { useRef } from "react";
import type { Game } from "../game/Game.ts";
import { buttonById, starsOnButton } from "../game/buttons.ts";
import { COLORS, HEIGHT, WIDTH } from "../game/view.ts";
import { fadeOnInk, fillDisc, fillRing, fillStar, fillSweepRing } from "./pixelDraw.ts";
import { hitButton, pointerToCanvas } from "./pointer.ts";
import { armSfx, playPress } from "./sfx.ts";

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
  const gameRef = useRef(game);
  gameRef.current = game;

  return (
    <div className="playfield">
      <canvas
        ref={function (canvas) {
          if (!canvas) return;
          const surface = canvas;
          const ctx = surface.getContext("2d", { alpha: true });
          if (!ctx) return;
          const draw = ctx;
          draw.imageSmoothingEnabled = false;

          const specks: Speck[] = [];
          let lastNonce = 0;
          let elapsed = 0;
          let last = performance.now();
          let raf = 0;

          function tick(now: number) {
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

            draw.clearRect(0, 0, WIDTH, HEIGHT);

            const buttons = g.buttons(now);
            for (const button of buttons) {
              const def = buttonById(button.id);
              drawBeat(draw, def.x, def.y, button.phase, def.color, button.mark);
            }

            const n = Math.max(buttons.length, 1);
            const stars = g.stars;
            draw.fillStyle = COLORS.foam;
            for (let i = 0; i < buttons.length; i++) {
              const count = starsOnButton(stars, i, n);
              if (count === 0) continue;
              const button = buttonById(buttons[i]!.id);
              for (let m = 0; m < count; m++) {
                const angle = (m / count) * Math.PI * 2 + elapsed * STAR_SPIN;
                fillStar(
                  draw,
                  Math.round(button.x + Math.cos(angle) * STAR_ORBIT),
                  Math.round(button.y - Math.sin(angle) * STAR_ORBIT),
                );
              }
            }

            draw.fillStyle = COLORS.goldHot;
            for (const p of specks) {
              fillDisc(draw, Math.round(p.x), Math.round(p.y), Math.max(1, Math.round(1 + p.life * 3)));
            }

            raf = requestAnimationFrame(tick);
          }

          raf = requestAnimationFrame(tick);

          const stage: HTMLElement = surface.closest(".stage") ?? surface;
          function uiControl(t: EventTarget | null) {
            return t instanceof Element && !!t.closest("button, .tree");
          }

          function onPointerDown(e: PointerEvent) {
            if (!e.isPrimary) return;
            if (e.pointerType === "mouse" && e.button !== 0) return;
            if (uiControl(e.target)) return;
            const pos = pointerToCanvas(surface, e.clientX, e.clientY);
            if (!pos) return;
            e.preventDefault();
            armSfx();
            const g = gameRef.current;
            const id = hitButton(g.buttons(), pos.x, pos.y);
            if (!id) return;
            if (!g.press(id)) return;
            const snap = g.snapshot();
            if (snap.lastResult) playPress(snap.lastResult, snap.upgrades.focus);
          }

          const opts: AddEventListenerOptions = { capture: true, passive: false };
          stage.addEventListener("pointerdown", onPointerDown, opts);

          return function () {
            cancelAnimationFrame(raf);
            stage.removeEventListener("pointerdown", onPointerDown, opts);
          };
        }}
        width={WIDTH}
        height={HEIGHT}
      />
    </div>
  );
}
