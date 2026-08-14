import { useEffect, useState } from "react";
import { HEIGHT, WIDTH } from "../game/view.ts";

/** Same integer scale as before: 320×180, then nearest whole zoom. */
export function usePixelScale(reserveY = 0): number {
  const [scale, setScale] = useState(3);

  useEffect(() => {
    const fit = () => {
      const sw = window.innerWidth;
      const sh = window.innerHeight - reserveY;
      setScale(Math.max(1, Math.floor(Math.min(sw / WIDTH, sh / HEIGHT))));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [reserveY]);

  return scale;
}
