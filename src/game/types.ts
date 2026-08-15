/** Shared types for the timing game. */

export type UpgradeId =
  | "multiplier"
  | "focus"
  | "tempo"
  | "combo"
  | "warmup"
  | "starRate"
  | "starAim";

export type PadKind = "beat" | "double" | "pair";

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  /** Cost of the next level given the current owned level. */
  cost(level: number): number;
  maxLevel: number;
}

export interface GameSave {
  version: 3;
  score: number;
  bestStreak: number;
  upgrades: Record<UpgradeId, number>;
  stars: number;
  unlockedPads: string[];
}

export type Grade = "perfect" | "great" | "good" | "ok" | "miss" | "set";

export interface PressResult {
  errorMs: number;
  points: number;
  grade: Grade;
  streak: number;
  beatIndex: number;
}
