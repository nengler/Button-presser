import { useState, useSyncExternalStore } from "react";

const RATE = 10;

type LerpStore = {
  subscribe: (onStoreChange: () => void) => () => void;
  getSnapshot: () => number;
  setTarget: (next: number) => void;
};

function createLerpStore(initial: number): LerpStore {
  let value = Math.floor(initial);
  let target = value;
  let raf = 0;
  let last = 0;
  const listeners = new Set<() => void>();

  function emit() {
    for (const listener of listeners) listener();
  }

  function stop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function tick(now: number) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (target <= value) {
      value = target;
      raf = 0;
      emit();
      return;
    }
    const next = value + (target - value) * (1 - Math.exp(-RATE * dt));
    if (target - next < 0.45) {
      value = target;
      raf = 0;
    } else {
      value = next;
      raf = requestAnimationFrame(tick);
    }
    emit();
  }

  return {
    subscribe(onStoreChange) {
      listeners.add(onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
        if (listeners.size === 0) stop();
      };
    },
    getSnapshot() {
      return Math.floor(value);
    },
    setTarget(next) {
      const want = Math.floor(next);
      target = want;
      if (want <= value) {
        value = want;
        stop();
        return;
      }
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    },
  };
}

/** Chase `target` upward. Drops snap immediately (spend / reset). */
export function useLerpedScore(target: number): number {
  const [store] = useState(function () {
    return createLerpStore(target);
  });
  store.setTarget(target);
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
