import { containScale } from "../hooks/usePixelScale.ts";
import { drawSky } from "./index.ts";

const MAX_DT = 0.05;

export function Sky() {
  return (
    <div className="sky" aria-hidden="true">
      <canvas
        ref={function (canvas) {
          if (!canvas) return;
          const surface = canvas;
          const ctx = surface.getContext("2d", { alpha: false });
          if (!ctx) return;
          const draw = ctx;
          draw.imageSmoothingEnabled = false;

          function fit() {
            const scale = containScale();
            const w = Math.max(1, Math.ceil(window.innerWidth / scale));
            const h = Math.max(1, Math.ceil(window.innerHeight / scale));
            if (surface.width !== w || surface.height !== h) {
              surface.width = w;
              surface.height = h;
            }
            surface.style.width = `${w * scale}px`;
            surface.style.height = `${h * scale}px`;
          }
          fit();
          window.addEventListener("resize", fit);

          let elapsed = 0;
          let last = performance.now();
          let raf = 0;
          function tick(now: number) {
            elapsed += Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
            last = now;
            drawSky(draw, elapsed, surface.width, surface.height);
            raf = requestAnimationFrame(tick);
          }
          raf = requestAnimationFrame(tick);

          return function () {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", fit);
          };
        }}
      />
    </div>
  );
}
