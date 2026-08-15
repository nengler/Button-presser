import { padById } from "../game/pads.ts";

export const HIT_R = 43;

type RectCanvas = {
  width: number;
  height: number;
  getBoundingClientRect(): { left: number; top: number; width: number; height: number };
};

export function pointerToCanvas(
  canvas: RectCanvas,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  if (
    clientX < rect.left ||
    clientX > rect.left + rect.width ||
    clientY < rect.top ||
    clientY > rect.top + rect.height
  ) {
    return null;
  }
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}

export function hitPad(pads: { id: string }[], sx: number, sy: number): string | null {
  let best: { id: string; d2: number } | null = null;
  const r2 = HIT_R * HIT_R;
  for (const pad of pads) {
    const def = padById(pad.id);
    const d2 = (sx - def.x) ** 2 + (sy - def.y) ** 2;
    if (d2 > r2) continue;
    if (!best || d2 < best.d2) best = { id: pad.id, d2 };
  }
  return best?.id ?? null;
}
