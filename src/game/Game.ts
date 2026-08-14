import { defaultSave, loadSave, persistSave } from "./save.ts";
import { nearestBeatError, scorePress } from "./timing.ts";
import type { GameSave, PressResult, UpgradeId } from "./types.ts";
import {
  MAIN_PAD,
  MINION_COST,
  MINION_MAX,
  extraPadById,
  minionsOnStation,
  padById,
} from "./pads.ts";
import { UPGRADE_DEFS, intervalMs, warmupBonus } from "./upgrades.ts";

const MINION_HIT_MS = 32;

type ExtraClock = {
  origin: number;
  used: Set<number>;
  streak: number;
  minionBeat: number;
};

export type Burst = { nonce: number; x: number; y: number };
export type PadView = { id: string; phase: number };

export type GameSnapshot = {
  score: number;
  streak: number;
  bestStreak: number;
  interval: number;
  phase: number;
  lastResult: PressResult | null;
  upgrades: GameSave["upgrades"];
  running: boolean;
  minions: number;
  unlockedPads: string[];
};

export class Game {
  /** Last pad hit — playfield reads this from its rAF loop. */
  burst: Burst = { nonce: 0, x: 0, y: 0 };

  private save: GameSave = loadSave();
  private origin = 0;
  private streak = 0;
  private lastResult: PressResult | null = null;
  private usedBeats = new Set<number>();
  private minionBeatMain = -1;
  private extra = new Map<string, ExtraClock>();
  private running = false;
  private warmupGranted = false;
  private listeners = new Set<(snap: GameSnapshot) => void>();

  subscribe(listener: (snap: GameSnapshot) => void): () => void {
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
      persistSave(this.save);
    }
    this.emit();
  }

  stop(): void {
    this.running = false;
    this.emit();
  }

  /** Drive minion auto-hits. Call once per animation frame. */
  tick(now = performance.now()): void {
    if (!this.running || this.save.minions <= 0) return;
    const stations = this.stationIds();
    const n = stations.length;
    for (let i = 0; i < n; i++) {
      const id = stations[i]!;
      if (minionsOnStation(this.save.minions, i, n) === 0) continue;
      const { origin, interval } = this.timeline(id, now);
      const { errorMs, beatIndex } = nearestBeatError(now, origin, interval);
      if (Math.abs(errorMs) > MINION_HIT_MS) continue;
      if (id === MAIN_PAD.id) {
        if (this.minionBeatMain === beatIndex || !this.canPress(now)) continue;
        this.minionBeatMain = beatIndex;
        this.press(id, now);
        continue;
      }
      const clock = this.ensureExtra(id, now);
      if (clock.minionBeat === beatIndex || clock.used.has(beatIndex)) continue;
      clock.minionBeat = beatIndex;
      this.press(id, now);
    }
  }

  /**
   * Hit a pad. Main pad updates HUD streak/grade; extra pads only add score.
   * Returns false if the game is paused, the pad is locked, or that extra beat
   * was already used.
   */
  press(id = MAIN_PAD.id, now = performance.now()): boolean {
    if (!this.running) return false;
    if (id === MAIN_PAD.id) {
      this.pressMain(now);
      this.ping(id);
      return true;
    }
    if (!this.save.unlockedPads.includes(id)) return false;
    if (!this.pressExtra(id, now)) return false;
    this.ping(id);
    return true;
  }

  canPress(now = performance.now()): boolean {
    if (!this.running) return false;
    const { beatIndex } = nearestBeatError(
      now,
      this.origin,
      intervalMs(this.save.upgrades.tempo),
    );
    return !this.usedBeats.has(beatIndex);
  }

  buyUpgrade(id: UpgradeId): boolean {
    const def = UPGRADE_DEFS[id];
    const level = this.save.upgrades[id];
    if (level >= def.maxLevel) return false;
    const cost = def.cost(level);
    if (this.save.score < cost) return false;
    this.save.score -= cost;
    this.save.upgrades[id] = level + 1;
    persistSave(this.save);
    this.emit();
    return true;
  }

  hireMinion(): boolean {
    if (this.save.minions >= MINION_MAX) return false;
    if (this.save.score < MINION_COST) return false;
    this.save.score -= MINION_COST;
    this.save.minions += 1;
    persistSave(this.save);
    this.emit();
    return true;
  }

  unlockPad(id: string): boolean {
    if (this.save.unlockedPads.includes(id)) return false;
    const pad = extraPadById(id);
    if (!pad || this.save.score < pad.cost) return false;
    this.save.score -= pad.cost;
    this.save.unlockedPads = [...this.save.unlockedPads, id];
    this.ensureExtra(id, performance.now());
    persistSave(this.save);
    this.emit();
    return true;
  }

  resetProgress(): void {
    this.save = defaultSave();
    this.streak = 0;
    this.lastResult = null;
    this.usedBeats.clear();
    this.minionBeatMain = -1;
    this.extra.clear();
    this.warmupGranted = false;
    this.burst = { nonce: 0, x: 0, y: 0 };
    persistSave(this.save);
    this.emit();
  }

  pads(now = performance.now()): PadView[] {
    return this.stationIds().map((id) => ({ id, phase: this.phaseOf(id, now) }));
  }

  get minions(): number {
    return this.save.minions;
  }

  snapshot(): GameSnapshot {
    const interval = intervalMs(this.save.upgrades.tempo);
    const now = performance.now();
    return {
      score: this.save.score,
      streak: this.streak,
      bestStreak: this.save.bestStreak,
      interval,
      phase: this.running ? ((now - this.origin) % interval) / interval : 0,
      lastResult: this.lastResult,
      upgrades: { ...this.save.upgrades },
      running: this.running,
      minions: this.save.minions,
      unlockedPads: [...this.save.unlockedPads],
    };
  }

  private stationIds(): string[] {
    return [MAIN_PAD.id, ...this.save.unlockedPads];
  }

  private phaseOf(id: string, now: number): number {
    const { origin, interval } = this.timeline(id, now);
    if (!this.running) return (now / interval) % 1;
    return ((now - origin) % interval) / interval;
  }

  private timeline(id: string, now: number): { origin: number; interval: number } {
    if (id === MAIN_PAD.id) {
      return { origin: this.origin, interval: intervalMs(this.save.upgrades.tempo) };
    }
    return { origin: this.ensureExtra(id, now).origin, interval: padById(id).interval };
  }

  private ensureExtra(id: string, now: number): ExtraClock {
    let clock = this.extra.get(id);
    if (!clock) {
      clock = { origin: now, used: new Set(), streak: 0, minionBeat: -1 };
      this.extra.set(id, clock);
    }
    return clock;
  }

  private pressMain(now: number): void {
    const interval = intervalMs(this.save.upgrades.tempo);
    const { errorMs, beatIndex } = nearestBeatError(now, this.origin, interval);

    if (this.usedBeats.has(beatIndex)) {
      this.streak = 0;
      this.lastResult = { errorMs, points: 0, grade: "miss", streak: 0, beatIndex };
      this.emit();
      return;
    }

    this.usedBeats.add(beatIndex);
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
    if (result.streak > this.save.bestStreak) this.save.bestStreak = result.streak;
    this.save.score += result.points;
    this.lastResult = result;
    persistSave(this.save);
    this.emit();
  }

  private pressExtra(id: string, now: number): boolean {
    const pad = padById(id);
    const clock = this.ensureExtra(id, now);
    const { errorMs, beatIndex } = nearestBeatError(now, clock.origin, pad.interval);
    if (clock.used.has(beatIndex)) return false;
    clock.used.add(beatIndex);
    const result = scorePress({
      errorMs,
      focusLevel: this.save.upgrades.focus,
      multiplierLevel: this.save.upgrades.multiplier,
      comboLevel: this.save.upgrades.combo,
      streakBefore: clock.streak,
      beatIndex,
    });
    clock.streak = result.streak;
    if (result.points > 0) {
      this.save.score += result.points;
      persistSave(this.save);
      this.emit();
    }
    return true;
  }

  private ping(id: string): void {
    const { x, y } = padById(id);
    this.burst = { nonce: this.burst.nonce + 1, x, y };
  }

  private emit(): void {
    const snap = this.snapshot();
    for (const listener of this.listeners) listener(snap);
  }
}
