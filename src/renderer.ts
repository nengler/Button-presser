import { Game } from "./game/Game.js";
import type { GameSnapshot } from "./game/Game.js";
import type { UpgradeId } from "./game/types.js";
import { UPGRADE_DEFS } from "./game/upgrades.js";

const game = new Game();

const els = {
  score: document.getElementById("score")!,
  streak: document.getElementById("streak")!,
  best: document.getElementById("best")!,
  feedback: document.getElementById("feedback")!,
  error: document.getElementById("error")!,
  press: document.getElementById("press") as HTMLButtonElement,
  start: document.getElementById("start") as HTMLButtonElement,
  pulse: document.getElementById("pulse")!,
  ring: document.getElementById("ring")!,
  upgrades: document.getElementById("upgrades")!,
  reset: document.getElementById("reset") as HTMLButtonElement,
};

function formatSignedMs(ms: number): string {
  const sign = ms > 0 ? "+" : "";
  return `${sign}${ms.toFixed(0)} ms`;
}

function renderUpgrades(snap: GameSnapshot): void {
  els.upgrades.replaceChildren();
  for (const id of Object.keys(UPGRADE_DEFS) as UpgradeId[]) {
    const def = UPGRADE_DEFS[id];
    const level = snap.upgrades[id];
    const cost = snap.upgradeCosts[id];
    const maxed = cost === null;

    const row = document.createElement("div");
    row.className = "upgrade";

    const text = document.createElement("div");
    text.className = "upgrade-text";

    const name = document.createElement("div");
    name.className = "upgrade-name";
    name.append(document.createTextNode(`${def.name} `));
    const lvl = document.createElement("span");
    lvl.className = "lvl";
    lvl.textContent = `Lv ${level}/${def.maxLevel}`;
    name.append(lvl);

    const desc = document.createElement("div");
    desc.className = "upgrade-desc";
    desc.textContent = def.description;

    text.append(name, desc);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "buy";
    btn.textContent = maxed ? "Max" : `${cost} pts`;
    btn.disabled = maxed || snap.score < (cost ?? Infinity);
    btn.addEventListener("click", () => game.buyUpgrade(id));

    row.append(text, btn);
    els.upgrades.append(row);
  }
}

function setBeatVisual(phase: number): void {
  const dist = Math.min(phase, 1 - phase);
  const near = 1 - dist * 2;
  els.pulse.style.setProperty("--near", String(near));
  els.ring.style.setProperty("--phase", String(phase));
  els.ring.style.setProperty("--near", String(Math.max(0, near)));
}

let lastShopKey = "";
let lastResultKey = "";

function shopKey(snap: GameSnapshot): string {
  return `${Math.floor(snap.score)}|${JSON.stringify(snap.upgrades)}`;
}

function render(snap: GameSnapshot): void {
  els.score.textContent = String(Math.floor(snap.score));
  els.streak.textContent = String(snap.streak);
  els.best.textContent = String(snap.bestStreak);
  els.start.textContent = snap.running ? "Pause" : "Start";
  els.press.disabled = !snap.running;

  setBeatVisual(snap.phase);

  if (snap.lastResult) {
    const key = `${snap.lastResult.beatIndex}:${snap.lastResult.grade}:${snap.lastResult.points}:${snap.lastResult.errorMs}`;
    if (key !== lastResultKey) {
      lastResultKey = key;
      const r = snap.lastResult;
      els.feedback.textContent =
        r.grade === "miss" ? "Miss" : `+${r.points} · ${r.grade}`;
      els.feedback.dataset.grade = r.grade;
      els.error.textContent = formatSignedMs(r.errorMs);
    }
  }

  const nextShop = shopKey(snap);
  if (nextShop !== lastShopKey) {
    lastShopKey = nextShop;
    renderUpgrades(snap);
  }
}

els.start.addEventListener("click", () => {
  if (game.snapshot().running) game.stop();
  else game.start();
});

els.press.addEventListener("click", () => {
  game.press();
  flashPress();
});

els.reset.addEventListener("click", () => {
  if (confirm("Reset all progress?")) {
    game.resetProgress();
    game.stop();
  }
});

window.addEventListener("keydown", (e) => {
  if (e.code !== "Space" && e.key !== " ") return;
  e.preventDefault();
  if (!game.snapshot().running) {
    game.start();
    return;
  }
  game.press();
  flashPress();
});

let feedbackTimer = 0;

function flashPress(): void {
  els.press.classList.remove("hit");
  void els.press.offsetWidth;
  els.press.classList.add("hit");
  window.clearTimeout(feedbackTimer);
  feedbackTimer = window.setTimeout(() => {
    els.press.classList.remove("hit");
  }, 180);
}

game.subscribe(render);

requestAnimationFrame(function frame() {
  const snap = game.snapshot();
  if (snap.running) {
    setBeatVisual(snap.phase);
  } else {
    const t = (performance.now() / snap.interval) % 1;
    setBeatVisual(t);
  }
  requestAnimationFrame(frame);
});
