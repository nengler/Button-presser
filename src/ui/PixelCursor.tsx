import { useEffect, useRef } from "react";
import type { Game } from "../game/Game.ts";
import { HEIGHT, WIDTH } from "../game/view.ts";
import { fillCursor } from "./pixelDraw.ts";
import { hitButton } from "./pointer.ts";

export function PixelCursor({ game, scale }: { game: Game; scale: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef(game);
  gameRef.current = game;

  useEffect(function () {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !ctx) return;
    const surface = canvas;
    const draw = ctx;

    let visible = false;
    let x = 0;
    let y = 0;
    let hot = false;
    const texel = Math.max(1, Math.round(scale));

    function fit() {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      surface.width = Math.max(1, Math.round(w * dpr));
      surface.height = Math.max(1, Math.round(h * dpr));
      surface.style.width = `${w}px`;
      surface.style.height = `${h}px`;
      draw.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw.imageSmoothingEnabled = false;
      paint();
    }

    function paint() {
      draw.save();
      draw.setTransform(1, 0, 0, 1, 0, 0);
      draw.clearRect(0, 0, surface.width, surface.height);
      draw.restore();
      if (!visible) return;
      fillCursor(draw, x, y, hot, texel);
    }

    function onMove(e: PointerEvent) {
      if (!e.isPrimary || e.pointerType !== "mouse") {
        if (visible) {
          visible = false;
          paint();
        }
        return;
      }
      const nx = Math.round(e.clientX);
      const ny = Math.round(e.clientY);
      const frame = document.querySelector(".frame");
      const rect = frame instanceof HTMLElement ? frame.getBoundingClientRect() : null;
      let nextHot = false;
      if (
        rect &&
        e.clientX >= rect.left &&
        e.clientX <= rect.left + rect.width &&
        e.clientY >= rect.top &&
        e.clientY <= rect.top + rect.height
      ) {
        const gx = ((e.clientX - rect.left) / rect.width) * WIDTH;
        const gy = ((e.clientY - rect.top) / rect.height) * HEIGHT;
        nextHot =
          hitButton(gameRef.current.buttons(), gx, gy) !== null ||
          (e.target instanceof Element && !!e.target.closest("button, .tree-node, .reset"));
      }
      if (visible && nx === x && ny === y && nextHot === hot) return;
      visible = true;
      x = nx;
      y = ny;
      hot = nextHot;
      paint();
    }

    function hide() {
      if (!visible) return;
      visible = false;
      paint();
    }

    fit();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    window.addEventListener("resize", fit);
    return function () {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      window.removeEventListener("resize", fit);
    };
  }, [scale]);

  return <canvas ref={canvasRef} className="pixel-cursor" aria-hidden="true" />;
}
