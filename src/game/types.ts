/** Shared types for the timing game. */

export type UpgradeId =
  | "multiplier"
  | "focus"
  | "tempo"
  | "combo"
  | "warmup";

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  /** Cost of the next level given the current owned level. */
  cost(level: number): number;
  maxLevel: number;
}

export interface GameSave {
  version: 1;
  score: number;
  bestStreak: number;
  upgrades: Record<UpgradeId, number>;
}

export interface PressResult {
  errorMs: number;
  points: number;
  grade: "perfect" | "great" | "good" | "ok" | "miss";
  streak: number;
  beatIndex: number;
}
