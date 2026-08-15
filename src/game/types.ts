/** Shared types for the timing game. */

export type UpgradeId =
  | "bonusHits"
  | "multiplier"
  | "focus"
  | "tempo"
  | "combo"
  | "perfectPay"
  | "shield"
  | "recovery"
  | "starRate"
  | "starAim"
  | "starSkill"
  | "padPay";

export type ButtonKind = "beat" | "double" | "pair";

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  /** Short inspect line for the owned (or next) level. */
  effect(level: number): string;
  /** Cost of the next level given the current owned level. */
  cost(level: number): number;
  maxLevel: number;
}

export interface GameSave {
  version: 4;
  score: number;
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

export type Burst = { nonce: number; x: number; y: number };

export type ButtonView = { id: string; phase: number; mark: 0 | 1 | 2 };

export type GameSnapshot = {
  score: number;
  streak: number;
  interval: number;
  phase: number;
  lastResult: PressResult | null;
  upgrades: GameSave["upgrades"];
  running: boolean;
  stars: number;
  unlockedPads: string[];
  hitNonce: number;
  hitX: number;
  hitY: number;
};
