import { useEffect, useRef, useState } from "react";

const RATE = 10;

/** Chase `target` upward. Drops snap immediately (spend / reset). */
export function useLerpedScore(target: number): number {
  const want = Math.floor(target);
  const [value, setValue] = useState(want);
  const valueRef = useRef(want);
  const targetRef = useRef(want);
  targetRef.current = want;

  useEffect(() => {
    const tgt = Math.floor(target);
    if (tgt <= valueRef.current) {
      valueRef.current = tgt;
      setValue(tgt);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const cur = valueRef.current;
      const nextTarget = targetRef.current;
      if (nextTarget <= cur) {
        valueRef.current = nextTarget;
        setValue(nextTarget);
        return;
      }
      const next = cur + (nextTarget - cur) * (1 - Math.exp(-RATE * dt));
      if (nextTarget - next < 0.45) {
        valueRef.current = nextTarget;
        setValue(nextTarget);
        return;
      }
      valueRef.current = next;
      setValue(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return Math.floor(value);
}
