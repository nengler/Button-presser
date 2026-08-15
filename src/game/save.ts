import type { GameSave, UpgradeId } from "./types.ts";
import { extraButtonById } from "./buttons.ts";
import { emptyUpgrades } from "./upgrades.ts";

const SAVE_KEY = "button-presser-save-v1";

export function defaultSave(): GameSave {
  return {
    version: 4,
    score: 0,
    upgrades: emptyUpgrades(),
    stars: 0,
    unlockedPads: [],
  };
}

function migrateUpgrades(raw: Record<string, unknown> | undefined): GameSave["upgrades"] {
  const next = emptyUpgrades();
  if (!raw || typeof raw !== "object") return next;
  for (const id of Object.keys(next) as UpgradeId[]) {
    const n = raw[id];
    if (typeof n === "number" && Number.isFinite(n)) next[id] = Math.max(0, n);
  }
  if (next.bonusHits === 0 && typeof raw.warmup === "number") {
    next.bonusHits = Math.max(0, raw.warmup);
  }
  return next;
}

export function loadSave(): GameSave {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as {
      version?: number;
      score?: number;
      upgrades?: Record<string, unknown>;
      stars?: number;
      minions?: number;
      unlockedPads?: unknown;
    };
    if (
      parsed.version !== 1 &&
      parsed.version !== 2 &&
      parsed.version !== 3 &&
      parsed.version !== 4
    ) {
      return defaultSave();
    }
    const pads = Array.isArray(parsed.unlockedPads)
      ? parsed.unlockedPads.filter(function (id): id is string {
          return typeof id === "string" && extraButtonById(id) !== undefined;
        })
      : [];
    const stars =
      typeof parsed.stars === "number"
        ? parsed.stars
        : typeof parsed.minions === "number"
          ? parsed.minions
          : 0;
    return {
      version: 4,
      score: typeof parsed.score === "number" ? parsed.score : 0,
      upgrades: migrateUpgrades(parsed.upgrades),
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
