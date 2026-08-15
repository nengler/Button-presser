import { useCallback } from "react";
import type { Game } from "../../game/Game.ts";
import { buttonById, buttonCenter, starsOnButton } from "../../game/buttons.ts";
import { COLORS, HEIGHT, WIDTH } from "../../game/view.ts";
import {
  fadeOnInk,
  fillDisc,
  fillRing,
  fillSoftDot,
  fillStar,
  fillSweepRing,
} from "../pixelDraw.ts";
import { hitButton, pointerToCanvas } from "../pointer.ts";
import { drawSparks, spawnSparks, type Speck, stepSparks } from "../sparks.ts";
import { armSfx, playPress } from "./sfx.ts";
import "./index.css";

const RING_IN = 29;
const RING_OUT = 34;
const RIM = 36;
const PIP_R0 = 2;
const PIP_R1 = 5;
const STAR_ORBIT = 42;
const STAR_SPIN = 0.85;
const MAX_DT = 0.05;

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

  ctx.fillStyle = COLORS.ink2;
  fillDisc(ctx, cx, cy, RIM);
  ctx.fillStyle = COLORS.foam;
  fillRing(ctx, cx, cy, RING_OUT, RIM);
  ctx.fillStyle = COLORS.ink;
  fillRing(ctx, cx, cy, RING_IN, RING_OUT);
  const span = Math.max(0.001, phase * Math.PI * 2);
  fillSweepRing(ctx, cx, cy, RING_IN, RING_OUT, span, color);
  const mid = (RING_IN + RING_OUT) * 0.5;
  fillSoftDot(ctx, cx + Math.sin(span) * mid, cy + Math.cos(span) * mid, COLORS.foam);
  fillSoftDot(
    ctx,
    cx + Math.sin(span) * (mid + 1.4),
    cy + Math.cos(span) * (mid + 1.4),
    COLORS.goldHot,
  );
  ctx.fillStyle = COLORS.ink2;
  fillDisc(ctx, cx, cy, RING_IN);
  ctx.fillStyle = fadeOnInk(COLORS.goldHot, 0.55 + near * 0.45);
  fillDisc(ctx, cx, cy, pipR);
  if (mark > 0) {
    ctx.fillStyle = mark === 2 ? COLORS.foam : COLORS.sage;
    fillRing(ctx, cx, cy, 8, 10);
  }
}

function bindPlayfield(game: Game, canvas: HTMLCanvasElement | null) {
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

    game.tick(now);
    if (game.burst.nonce !== 0 && game.burst.nonce !== lastNonce) {
      lastNonce = game.burst.nonce;
      spawnSparks(specks, game.burst.x, game.burst.y);
    }
    stepSparks(specks, dt);

    draw.clearRect(0, 0, WIDTH, HEIGHT);

    const buttons = game.buttons(now);
    const n = Math.max(buttons.length, 1);
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i]!;
      const def = buttonById(button.id);
      const pos = buttonCenter(i, n);
      drawBeat(draw, pos.x, pos.y, button.phase, def.color, button.mark);
    }

    draw.fillStyle = COLORS.foam;
    const stars = game.stars;
    for (let i = 0; i < buttons.length; i++) {
      const count = starsOnButton(stars, i, n);
      if (count === 0) continue;
      const pos = buttonCenter(i, n);
      for (let m = 0; m < count; m++) {
        const angle = (m / count) * Math.PI * 2 + elapsed * STAR_SPIN;
        fillStar(
          draw,
          Math.round(pos.x + Math.cos(angle) * STAR_ORBIT),
          Math.round(pos.y - Math.sin(angle) * STAR_ORBIT),
        );
      }
    }

    drawSparks(draw, specks);

    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);

  const stage: HTMLElement = surface.closest(".stage") ?? surface;
  function uiControl(t: EventTarget | null) {
    return t instanceof Element && !!t.closest("button, .shop");
  }

  function onPointerDown(e: PointerEvent) {
    if (!e.isPrimary) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (uiControl(e.target)) return;
    const pos = pointerToCanvas(surface, e.clientX, e.clientY);
    if (!pos) return;
    e.preventDefault();
    armSfx();
    const id = hitButton(game.buttons(), pos.x, pos.y);
    if (!id) return;
    if (!game.press(id)) return;
    const snap = game.snapshot();
    if (snap.lastResult) playPress(snap.lastResult, snap.upgrades.focus);
  }

  const opts: AddEventListenerOptions = { capture: true, passive: false };
  stage.addEventListener("pointerdown", onPointerDown, opts);

  return function () {
    cancelAnimationFrame(raf);
    stage.removeEventListener("pointerdown", onPointerDown, opts);
  };
}

export function Playfield({ game }: { game: Game }) {
  const bind = useCallback(
    function (canvas: HTMLCanvasElement | null) {
      return bindPlayfield(game, canvas);
    },
    [game],
  );

  return (
    <div className="playfield">
      <canvas ref={bind} width={WIDTH} height={HEIGHT} />
    </div>
  );
}
