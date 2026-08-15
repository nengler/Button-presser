import { buttonCenter } from "../game/buttons.ts";

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

export function hitButton(buttons: { id: string }[], sx: number, sy: number): string | null {
  let best: { id: string; d2: number } | null = null;
  const r2 = HIT_R * HIT_R;
  const n = buttons.length;
  for (let i = 0; i < n; i++) {
    const button = buttons[i]!;
    const pos = buttonCenter(i, n);
    const d2 = (sx - pos.x) ** 2 + (sy - pos.y) ** 2;
    if (d2 > r2) continue;
    if (!best || d2 < best.d2) best = { id: button.id, d2 };
  }
  return best?.id ?? null;
}
