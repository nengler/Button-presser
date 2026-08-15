import type { GameSave } from "./types.ts";
import { extraPadById } from "./pads.ts";
import { emptyUpgrades } from "./upgrades.ts";

const SAVE_KEY = "button-presser-save-v1";

export function defaultSave(): GameSave {
  return {
    version: 3,
    score: 0,
    bestStreak: 0,
    upgrades: emptyUpgrades(),
    stars: 0,
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
      upgrades?: Partial<GameSave["upgrades"]>;
      stars?: number;
      minions?: number;
      unlockedPads?: unknown;
    };
    if (parsed.version !== 1 && parsed.version !== 2 && parsed.version !== 3) {
      return defaultSave();
    }
    const pads = Array.isArray(parsed.unlockedPads)
      ? parsed.unlockedPads.filter(
          (id): id is string => typeof id === "string" && extraPadById(id) !== undefined,
        )
      : [];
    const stars =
      typeof parsed.stars === "number"
        ? parsed.stars
        : typeof parsed.minions === "number"
          ? parsed.minions
          : 0;
    return {
      version: 3,
      score: typeof parsed.score === "number" ? parsed.score : 0,
      bestStreak:
        typeof parsed.bestStreak === "number" ? parsed.bestStreak : 0,
      upgrades: { ...emptyUpgrades(), ...parsed.upgrades },
      stars,
      unlockedPads: pads,
    };
  } catch {
    return defaultSave();
  }
}

export function persistSave(save: GameSave): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
