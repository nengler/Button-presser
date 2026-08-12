import type { GameSave } from "./types.js";
import { emptyUpgrades } from "./upgrades.js";

const SAVE_KEY = "button-presser-save-v1";

export function defaultSave(): GameSave {
  return {
    version: 1,
    score: 0,
    bestStreak: 0,
    upgrades: emptyUpgrades(),
  };
}

export function loadSave(): GameSave {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<GameSave>;
    if (parsed.version !== 1) return defaultSave();
    return {
      version: 1,
      score: typeof parsed.score === "number" ? parsed.score : 0,
      bestStreak:
        typeof parsed.bestStreak === "number" ? parsed.bestStreak : 0,
      upgrades: { ...emptyUpgrades(), ...parsed.upgrades },
    };
  } catch {
    return defaultSave();
  }
}

export function persistSave(save: GameSave): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
