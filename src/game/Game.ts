import { loadSave, persistSave } from "./save.ts";
import { nearestBeatError, scorePress } from "./timing.ts";
import type { GameSave, PressResult, UpgradeId } from "./types.ts";
import { MINION_COST, MINION_MAX, extraPadById } from "./toys.ts";
import { UPGRADE_DEFS, intervalMs, warmupBonus } from "./upgrades.ts";

export type GameListener = (snapshot: GameSnapshot) => void;

export interface GameSnapshot {
  score: number;
  streak: number;
  bestStreak: number;
  interval: number;
  phase: number;
  lastResult: PressResult | null;
  upgrades: GameSave["upgrades"];
  upgradeCosts: Record<UpgradeId, number | null>;
  running: boolean;
  minions: number;
  unlockedPads: string[];
}

export class Game {
  private save: GameSave;
  private origin = 0;
  private streak = 0;
  private lastResult: PressResult | null = null;
  private usedBeats = new Set<number>();
  private running = false;
  private warmupGranted = false;
  private listeners = new Set<GameListener>();

  constructor() {
    this.save = loadSave();
  }

  subscribe(listener: GameListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.origin = performance.now();
    this.streak = 0;
    this.usedBeats.clear();
    this.lastResult = null;
    if (!this.warmupGranted && this.save.upgrades.warmup > 0) {
      this.save.score += warmupBonus(this.save.upgrades.warmup);
      this.warmupGranted = true;
      this.persist();
    }
    this.emit();
  }

  stop(): void {
    this.running = false;
    this.emit();
  }

  press(now = performance.now()): PressResult | null {
    if (!this.running) return null;

    const interval = intervalMs(this.save.upgrades.tempo);
    const { errorMs, beatIndex } = nearestBeatError(now, this.origin, interval);

    // One press per beat — second try on same beat is a miss that breaks streak.
    if (this.usedBeats.has(beatIndex)) {
      this.streak = 0;
      this.lastResult = {
        errorMs,
        points: 0,
        grade: "miss",
        streak: 0,
        beatIndex,
      };
      this.emit();
      return this.lastResult;
    }

    this.usedBeats.add(beatIndex);
    // Bound memory: keep recent beat indices only.
    if (this.usedBeats.size > 64) {
      const min = beatIndex - 32;
      for (const b of [...this.usedBeats]) {
        if (b < min) this.usedBeats.delete(b);
      }
    }

    const result = scorePress({
      errorMs,
      focusLevel: this.save.upgrades.focus,
      multiplierLevel: this.save.upgrades.multiplier,
      comboLevel: this.save.upgrades.combo,
      streakBefore: this.streak,
      beatIndex,
    });

    this.streak = result.streak;
    if (result.streak > this.save.bestStreak) {
      this.save.bestStreak = result.streak;
    }
    this.save.score += result.points;
    this.lastResult = result;
    this.persist();
    this.emit();
    return result;
  }

  buyUpgrade(id: UpgradeId): boolean {
    const def = UPGRADE_DEFS[id];
    const level = this.save.upgrades[id];
    if (level >= def.maxLevel) return false;
    const cost = def.cost(level);
    if (this.save.score < cost) return false;
    this.save.score -= cost;
    this.save.upgrades[id] = level + 1;
    this.persist();
    this.emit();
    return true;
  }

  /** True when this beat is still open (minions skip if the player already hit it). */
  canPress(now = performance.now()): boolean {
    if (!this.running) return false;
    const interval = intervalMs(this.save.upgrades.tempo);
    const { beatIndex } = nearestBeatError(now, this.origin, interval);
    return !this.usedBeats.has(beatIndex);
  }

  addScore(points: number): void {
    if (points === 0) return;
    this.save.score += points;
    this.persist();
    this.emit();
  }

  spendScore(amount: number): boolean {
    if (amount <= 0 || this.save.score < amount) return false;
    this.save.score -= amount;
    this.persist();
    this.emit();
    return true;
  }

  hireMinion(): boolean {
    if (this.save.minions >= MINION_MAX) return false;
    if (this.save.score < MINION_COST) return false;
    this.save.score -= MINION_COST;
    this.save.minions += 1;
    this.persist();
    this.emit();
    return true;
  }

  unlockPad(id: string): boolean {
    if (this.save.unlockedPads.includes(id)) return false;
    const pad = extraPadById(id);
    if (!pad) return false;
    if (this.save.score < pad.cost) return false;
    this.save.score -= pad.cost;
    this.save.unlockedPads = [...this.save.unlockedPads, id];
    this.persist();
    this.emit();
    return true;
  }

  resetProgress(): void {
    this.save = {
      version: 2,
      score: 0,
      bestStreak: 0,
      upgrades: {
        multiplier: 0,
        focus: 0,
        tempo: 0,
        combo: 0,
        warmup: 0,
      },
      minions: 0,
      unlockedPads: [],
    };
    this.streak = 0;
    this.lastResult = null;
    this.usedBeats.clear();
    this.warmupGranted = false;
    this.persist();
    this.emit();
  }

  snapshot(): GameSnapshot {
    const interval = intervalMs(this.save.upgrades.tempo);
    const now = performance.now();
    const phase = this.running
      ? ((now - this.origin) % interval) / interval
      : 0;

    const upgradeCosts = {} as Record<UpgradeId, number | null>;
    for (const id of Object.keys(UPGRADE_DEFS) as UpgradeId[]) {
      const def = UPGRADE_DEFS[id];
      const level = this.save.upgrades[id];
      upgradeCosts[id] = level >= def.maxLevel ? null : def.cost(level);
    }

    return {
      score: this.save.score,
      streak: this.streak,
      bestStreak: this.save.bestStreak,
      interval,
      phase,
      lastResult: this.lastResult,
      upgrades: { ...this.save.upgrades },
      upgradeCosts,
      running: this.running,
      minions: this.save.minions,
      unlockedPads: [...this.save.unlockedPads],
    };
  }

  private persist(): void {
    persistSave(this.save);
  }

  private emit(): void {
    const snap = this.snapshot();
    for (const listener of this.listeners) listener(snap);
  }
}
