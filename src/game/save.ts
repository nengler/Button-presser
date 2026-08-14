import type { GameSave } from "./types.ts";
import { emptyUpgrades } from "./upgrades.ts";

const SAVE_KEY = "button-presser-save-v1";

export function defaultSave(): GameSave {
  return {
    version: 2,
    score: 0,
    bestStreak: 0,
    upgrades: emptyUpgrades(),
    minions: 0,
    unlockedPads: [],
  };
}

export function loadSave(): GameSave {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as {
      version?: number;
      score?: number;
      bestStreak?: number;
      upgrades?: GameSave["upgrades"];
      minions?: number;
      unlockedPads?: unknown;
    };
    if (parsed.version !== 1 && parsed.version !== 2) return defaultSave();
    const pads = Array.isArray(parsed.unlockedPads)
      ? parsed.unlockedPads.filter((id): id is string => typeof id === "string")
      : [];
    return {
      version: 2,
      score: typeof parsed.score === "number" ? parsed.score : 0,
      bestStreak:
        typeof parsed.bestStreak === "number" ? parsed.bestStreak : 0,
      upgrades: { ...emptyUpgrades(), ...parsed.upgrades },
      minions: typeof parsed.minions === "number" ? parsed.minions : 0,
      unlockedPads: pads,
    };
  } catch {
    return defaultSave();
  }
}

export function persistSave(save: GameSave): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
