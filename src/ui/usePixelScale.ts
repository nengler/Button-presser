import { useEffect, useState } from "react";
import { HEIGHT, WIDTH } from "../game/view.ts";

/** Integer zoom so 320×180 stays chunky. */
export function usePixelScale(): number {
  const [scale, setScale] = useState(3);

  useEffect(() => {
    const fit = () => {
      setScale(
        Math.max(1, Math.floor(Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT))),
      );
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return scale;
}
