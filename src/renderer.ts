import { Game } from "./game/Game.js";
import type { GameSnapshot } from "./game/Game.js";
import type { UpgradeId } from "./game/types.js";
import { UPGRADE_DEFS } from "./game/upgrades.js";
import { COLORS, HEIGHT, WIDTH } from "./game/view.js";

const game = new Game();
const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

ctx.imageSmoothingEnabled = false;

type Rect = { x: number; y: number; w: number; h: number };

const PRESS: Rect = { x: 58, y: 128, w: 84, h: 22 };
const START: Rect = { x: 8, y: 128, w: 44, h: 22 };
const RESET: Rect = { x: 278, y: 4, w: 36, h: 12 };
const SHOP_X = 208;
const SHOP_ROW_H = 28;
const SHOP_TOP = 22;

const UPGRADE_ORDER = Object.keys(UPGRADE_DEFS) as UpgradeId[];

const UPGRADE_SHORT: Record<UpgradeId, string> = {
  multiplier: "MULT",
  focus: "FOCUS",
  tempo: "TEMPO",
  combo: "COMBO",
  warmup: "WARM",
};

let snap: GameSnapshot = game.snapshot();
let hover: string | null = null;
let pressFlashUntil = 0;

game.subscribe((s) => {
  snap = s;
});

function fitCanvas(): void {
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  const nextScale = Math.max(1, Math.floor(Math.min(sw / WIDTH, sh / HEIGHT)));
  canvas.style.width = `${WIDTH * nextScale}px`;
  canvas.style.height = `${HEIGHT * nextScale}px`;
}

function toCanvas(clientX: number, clientY: number): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * WIDTH,
    y: ((clientY - rect.top) / rect.height) * HEIGHT,
  };
}

function hit(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

function shopBuyRect(index: number): Rect {
  return {
    x: SHOP_X + 72,
    y: SHOP_TOP + index * SHOP_ROW_H + 6,
    w: 36,
    h: 14,
  };
}

function fillRect(r: Rect, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

function strokeRect(r: Rect, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
}

function text(
  str: string,
  x: number,
  y: number,
  color: string,
  size = 8,
  align: CanvasTextAlign = "left",
): void {
  ctx.fillStyle = color;
  ctx.font = `${size}px monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillText(str, x, y);
}

function gradeColor(grade: string): string {
  switch (grade) {
    case "perfect":
      return COLORS.perfect;
    case "great":
      return COLORS.great;
    case "good":
      return COLORS.good;
    case "ok":
      return COLORS.ok;
    case "miss":
      return COLORS.miss;
    default:
      return COLORS.sage;
  }
}

function phaseNow(): number {
  if (snap.running) return snap.phase;
  return (performance.now() / snap.interval) % 1;
}

function drawBeat(phase: number): void {
  const cx = 100;
  const cy = 72;
  const dist = Math.min(phase, 1 - phase);
  const near = 1 - dist * 2;

  // Soft pulse disc
  const pr = 28 + near * 10;
  ctx.beginPath();
  ctx.fillStyle = `rgba(212, 162, 76, ${0.08 + near * 0.22})`;
  ctx.arc(cx, cy, pr, 0, Math.PI * 2);
  ctx.fill();

  // Outer ring
  ctx.beginPath();
  ctx.strokeStyle = COLORS.moss;
  ctx.lineWidth = 2;
  ctx.arc(cx, cy, 36, 0, Math.PI * 2);
  ctx.stroke();

  // Sweep arc
  ctx.beginPath();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.arc(cx, cy, 40, -Math.PI / 2, -Math.PI / 2 + phase * Math.PI * 2);
  ctx.stroke();

  // Center pip
  const pip = 3 + near * 4;
  ctx.beginPath();
  ctx.fillStyle = COLORS.goldHot;
  ctx.arc(cx, cy, pip, 0, Math.PI * 2);
  ctx.fill();
}

function drawButton(
  r: Rect,
  label: string,
  id: string,
  enabled: boolean,
  primary = false,
): void {
  const hovered = hover === id && enabled;
  if (primary) {
    const flashing = enabled && performance.now() < pressFlashUntil;
    if (!enabled) {
      fillRect(r, COLORS.ink2);
      strokeRect(r, COLORS.dim);
      text(label, r.x + r.w / 2, r.y + 6, COLORS.dim, 10, "center");
    } else {
      fillRect(r, flashing || hovered ? COLORS.goldHot : COLORS.gold);
      text(label, r.x + r.w / 2, r.y + 6, COLORS.ink, 10, "center");
    }
  } else {
    fillRect(r, hovered ? COLORS.moss : COLORS.ink2);
    strokeRect(r, enabled ? COLORS.sage : COLORS.dim);
    text(label, r.x + r.w / 2, r.y + 6, enabled ? COLORS.foam : COLORS.dim, 8, "center");
  }
}

function draw(): void {
  // Live phase for running game (snapshot phase is stale between events).
  const live = game.snapshot();
  snap = { ...snap, ...live, phase: live.running ? live.phase : phaseNow() };
  const phase = snap.running ? snap.phase : phaseNow();

  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Right panel
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(SHOP_X, 0, WIDTH - SHOP_X, HEIGHT);
  ctx.fillStyle = COLORS.moss;
  ctx.fillRect(SHOP_X, 0, 1, HEIGHT);

  // Brand
  text("BUTTON PRESSER", 8, 6, COLORS.foam, 10);
  text("hit the beat", 8, 18, COLORS.sage, 7);

  // Stats strip
  text(`SCR ${Math.floor(snap.score)}`, 8, 34, COLORS.goldHot, 8);
  text(`STR ${snap.streak}`, 78, 34, COLORS.foam, 8);
  text(`BEST ${snap.bestStreak}`, 130, 34, COLORS.sage, 8);

  drawBeat(phase);

  // Feedback
  if (snap.lastResult) {
    const r = snap.lastResult;
    const label =
      r.grade === "miss" ? "MISS" : `+${r.points} ${r.grade.toUpperCase()}`;
    text(label, 100, 108, gradeColor(r.grade), 9, "center");
    const sign = r.errorMs > 0 ? "+" : "";
    text(`${sign}${r.errorMs.toFixed(0)}ms`, 100, 118, COLORS.dim, 7, "center");
  } else {
    text(snap.running ? "…" : "ready", 100, 108, COLORS.sage, 9, "center");
  }

  drawButton(START, snap.running ? "PAUSE" : "START", "start", true);
  drawButton(PRESS, "PRESS", "press", snap.running, true);

  text("SPACE", 100, 156, COLORS.dim, 7, "center");
  text("or click", 100, 166, COLORS.dim, 6, "center");

  // Shop
  text("UPGRADES", SHOP_X + 8, 6, COLORS.foam, 8);
  const resetHover = hover === "reset";
  text("reset", RESET.x + 2, RESET.y + 2, resetHover ? COLORS.goldHot : COLORS.dim, 7);

  UPGRADE_ORDER.forEach((id, i) => {
    const level = snap.upgrades[id];
    const cost = snap.upgradeCosts[id];
    const y = SHOP_TOP + i * SHOP_ROW_H;
    const short = UPGRADE_SHORT[id];
    const max = UPGRADE_DEFS[id].maxLevel;

    text(short, SHOP_X + 8, y, COLORS.foam, 7);
    text(`${level}/${max}`, SHOP_X + 8, y + 10, COLORS.sage, 6);

    const buy = shopBuyRect(i);
    const maxed = cost === null;
    const canBuy = !maxed && snap.score >= (cost ?? Infinity);
    const idKey = `buy:${id}`;
    const hovered = hover === idKey;

    fillRect(buy, hovered && canBuy ? COLORS.moss : COLORS.ink2);
    strokeRect(buy, canBuy ? COLORS.gold : COLORS.dim);
    text(
      maxed ? "MAX" : String(cost),
      buy.x + buy.w / 2,
      buy.y + 3,
      canBuy || maxed ? COLORS.goldHot : COLORS.dim,
      7,
      "center",
    );
  });
}

function hitTest(x: number, y: number): string | null {
  if (hit(START, x, y)) return "start";
  if (hit(PRESS, x, y) && snap.running) return "press";
  if (hit(RESET, x, y)) return "reset";
  for (let i = 0; i < UPGRADE_ORDER.length; i++) {
    const id = UPGRADE_ORDER[i]!;
    const cost = snap.upgradeCosts[id];
    if (cost === null) continue;
    if (hit(shopBuyRect(i), x, y) && snap.score >= cost) return `buy:${id}`;
  }
  return null;
}

function onPointer(clientX: number, clientY: number, click: boolean): void {
  const { x, y } = toCanvas(clientX, clientY);
  const id = hitTest(x, y);
  hover = id;
  canvas.style.cursor = id ? "pointer" : "default";

  if (!click || !id) return;

  if (id === "start") {
    if (game.snapshot().running) game.stop();
    else game.start();
    return;
  }
  if (id === "press") {
    game.press();
    pressFlashUntil = performance.now() + 120;
    return;
  }
  if (id === "reset") {
    if (confirm("Reset all progress?")) {
      game.resetProgress();
      game.stop();
    }
    return;
  }
  if (id.startsWith("buy:")) {
    game.buyUpgrade(id.slice(4) as UpgradeId);
  }
}

window.addEventListener("resize", fitCanvas);
fitCanvas();

canvas.addEventListener("pointermove", (e) => onPointer(e.clientX, e.clientY, false));
canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  onPointer(e.clientX, e.clientY, true);
});
canvas.addEventListener("pointerleave", () => {
  hover = null;
  canvas.style.cursor = "default";
});

window.addEventListener("keydown", (e) => {
  if (e.code !== "Space" && e.key !== " ") return;
  e.preventDefault();
  if (!game.snapshot().running) {
    game.start();
    return;
  }
  game.press();
  pressFlashUntil = performance.now() + 120;
});

requestAnimationFrame(function frame() {
  draw();
  requestAnimationFrame(frame);
});
