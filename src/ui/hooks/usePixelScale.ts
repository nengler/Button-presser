import { useSyncExternalStore } from "react";
import { HEIGHT, WIDTH } from "../../game/view.ts";

export function containScale(): number {
  return Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT);
}

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("resize", onStoreChange);
  return function () {
    window.removeEventListener("resize", onStoreChange);
  };
}

/** Contain-fit 320×180 to the window. Nearest-neighbor CSS keeps it chunky. */
export function usePixelScale(): number {
  return useSyncExternalStore(subscribe, containScale);
}
