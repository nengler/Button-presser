import { useEffect, useRef } from "react";
import { drawSky } from "./sky.ts";

const MAX_DT = 0.05;

export function Sky({ scale }: { scale: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;

    const fit = () => {
      const w = Math.max(1, Math.ceil(window.innerWidth / scale));
      const h = Math.max(1, Math.ceil(window.innerHeight / scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      canvas.style.width = `${w * scale}px`;
      canvas.style.height = `${h * scale}px`;
    };
    fit();
    window.addEventListener("resize", fit);

    let elapsed = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      elapsed += Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
      last = now;
      drawSky(ctx, elapsed, canvas.width, canvas.height);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, [scale]);

  return (
    <div className="sky" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
