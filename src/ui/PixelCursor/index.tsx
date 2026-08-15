import { useEffect, useRef } from "react";
import type { Game } from "../../game/Game.ts";
import { HEIGHT, WIDTH } from "../../game/view.ts";
import { fillCursor } from "../pixelDraw.ts";
import { hitButton } from "../pointer.ts";
import "./index.css";

export function PixelCursor({ game, scale }: { game: Game; scale: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef(game);
  useEffect(
    function () {
      gameRef.current = game;
    },
    [game],
  );

  useEffect(
    function () {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d", { alpha: true });
      if (!canvas || !ctx) return;
      const surface = canvas;
      const draw = ctx;

      let visible = false;
      let x = 0;
      let y = 0;
      let hot = false;
      let pressed = false;
      const texel = scale;

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
        fillCursor(draw, x, y, hot, texel, pressed);
      }

      function onPointer(e: PointerEvent) {
        if (!e.isPrimary || e.pointerType !== "mouse") {
          if (visible) {
            visible = false;
            pressed = false;
            paint();
          }
          return;
        }
        const frame = document.querySelector(".frame");
        const rect = frame instanceof HTMLElement ? frame.getBoundingClientRect() : null;
        const ox = rect ? rect.left : 0;
        const oy = rect ? rect.top : 0;
        const nx = ox + Math.floor((e.clientX - ox) / texel) * texel;
        const ny = oy + Math.floor((e.clientY - oy) / texel) * texel;
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
            (e.target instanceof Element && !!e.target.closest("button, .shop-node, .reset"));
        }
        const nextPressed = (e.buttons & 1) !== 0;
        if (visible && nx === x && ny === y && nextHot === hot && nextPressed === pressed) return;
        visible = true;
        x = nx;
        y = ny;
        hot = nextHot;
        pressed = nextPressed;
        paint();
      }

      function hide() {
        if (!visible && !pressed) return;
        visible = false;
        pressed = false;
        paint();
      }

      fit();
      window.addEventListener("pointermove", onPointer);
      window.addEventListener("pointerdown", onPointer);
      window.addEventListener("pointerup", onPointer);
      window.addEventListener("pointercancel", hide);
      window.addEventListener("pointerleave", hide);
      window.addEventListener("blur", hide);
      window.addEventListener("resize", fit);
      return () => {
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("pointerdown", onPointer);
        window.removeEventListener("pointerup", onPointer);
        window.removeEventListener("pointercancel", hide);
        window.removeEventListener("pointerleave", hide);
        window.removeEventListener("blur", hide);
        window.removeEventListener("resize", fit);
      };
    },
    [scale],
  );

  return <canvas ref={canvasRef} className="pixel-cursor" aria-hidden="true" />;
}
