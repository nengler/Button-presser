import { defaultSave, loadSave, persistSave } from "./save.ts";
import {
  nearestBeatError,
  pairCompletes,
  scorePress,
  withinDoubleGap,
} from "./timing.ts";
import type { GameSave, PressResult, UpgradeId } from "./types.ts";
import {
  DOUBLE_GAP_MS,
  MAIN_PAD,
  STAR_COST,
  STAR_MAX,
  extraPadById,
  padById,
  starsOnStation,
} from "./pads.ts";
import {
  UPGRADE_DEFS,
  intervalMs,
  starAimErrorMs,
  starAttemptEvery,
  warmupBonus,
} from "./upgrades.ts";

const STAR_HIT_SLOP_MS = 20;

type ExtraClock = {
  origin: number;
  used: Set<number>;
  streak: number;
  starBeat: number;
  skip: number;
  pendingTapAt: number | null;
  pendingBeat: number;
  pendingErrorMs: number;
  lastSuccessBeat: number;
};

export type Burst = { nonce: number; x: number; y: number };
export type PadView = { id: string; phase: number; mark: 0 | 1 | 2 };

export type GameSnapshot = {
  score: number;
  streak: number;
  bestStreak: number;
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

export class Game {
  /** Last pad hit — playfield reads this from its rAF loop. */
  burst: Burst = { nonce: 0, x: 0, y: 0 };

  private save: GameSave = loadSave();
  private origin = 0;
  private streak = 0;
  private lastResult: PressResult | null = null;
  private usedBeats = new Set<number>();
  private starBeatMain = -1;
  private starSkipMain = 0;
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
    // Keep origin at 0 so the first hit is judged against the idle ring sweep.
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

  /** Drive star auto-hits. Call once per animation frame. */
  tick(now = performance.now()): void {
    if (!this.running) return;
    this.expireDoubles(now);
    if (this.save.stars <= 0) return;
    const stations = this.stationIds();
    const n = stations.length;
    const period = starAttemptEvery(this.save.upgrades.starRate);
    const aim = starAimErrorMs(this.save.upgrades.starAim);
    for (let i = 0; i < n; i++) {
      const id = stations[i]!;
      if (starsOnStation(this.save.stars, i, n) === 0) continue;
      const pad = padById(id);
      const { origin, interval } = this.timeline(id, now);
      const { errorMs, beatIndex } = nearestBeatError(now, origin, interval);

      if (pad.kind === "double") {
        const clock = this.ensureExtra(id, now);
        if (
          clock.pendingTapAt !== null &&
          now - clock.pendingTapAt >= 70 &&
          now - clock.pendingTapAt <= DOUBLE_GAP_MS
        ) {
          this.press(id, now, { fromStar: true });
          continue;
        }
      }

      if (Math.abs(errorMs - aim) > STAR_HIT_SLOP_MS) continue;

      if (id === MAIN_PAD.id) {
        if (this.starBeatMain === beatIndex || !this.canPress(now)) continue;
        this.starSkipMain += 1;
        if (this.starSkipMain < period) continue;
        this.starSkipMain = 0;
        this.starBeatMain = beatIndex;
        this.press(id, now, { fromStar: true });
        continue;
      }

      const clock = this.ensureExtra(id, now);
      if (clock.starBeat === beatIndex || clock.used.has(beatIndex)) continue;
      if (clock.pendingTapAt !== null) continue;
      clock.skip += 1;
      if (clock.skip < period) continue;
      clock.skip = 0;
      clock.starBeat = beatIndex;
      this.press(id, now, { fromStar: true });
    }
  }

  /**
   * Hit a pad. The first hit starts the session and still scores.
   * Main pad updates HUD streak/grade; extra pads only add score.
   * Returns false if the pad is locked or that extra beat was already used.
   */
  press(
    id = MAIN_PAD.id,
    now = performance.now(),
    opts: { fromStar?: boolean } = {},
  ): boolean {
    if (!this.running) this.start();
    if (id === MAIN_PAD.id) {
      this.ping(id);
      this.pressMain(now, opts.fromStar === true);
      return true;
    }
    if (!this.save.unlockedPads.includes(id)) return false;
    if (!this.pressExtra(id, now, opts.fromStar === true)) return false;
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

  hireStar(): boolean {
    if (this.save.stars >= STAR_MAX) return false;
    if (this.save.score < STAR_COST) return false;
    this.save.score -= STAR_COST;
    this.save.stars += 1;
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
    this.starBeatMain = -1;
    this.starSkipMain = 0;
    this.extra.clear();
    this.warmupGranted = false;
    this.burst = { nonce: 0, x: 0, y: 0 };
    persistSave(this.save);
    this.emit();
  }

  pads(now = performance.now()): PadView[] {
    return this.stationIds().map((id) => {
      let mark: 0 | 1 | 2 = 0;
      if (id !== MAIN_PAD.id) {
        const clock = this.extra.get(id);
        const pad = padById(id);
        if (clock && pad.kind === "double" && clock.pendingTapAt !== null) mark = 2;
        else if (clock && pad.kind === "pair" && clock.lastSuccessBeat >= 0) mark = 1;
      }
      return { id, phase: this.phaseOf(id, now), mark };
    });
  }

  get stars(): number {
    return this.save.stars;
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
      stars: this.save.stars,
      unlockedPads: [...this.save.unlockedPads],
      hitNonce: this.burst.nonce,
      hitX: this.burst.x,
      hitY: this.burst.y,
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
      clock = {
        origin: now,
        used: new Set(),
        streak: 0,
        starBeat: -1,
        skip: 0,
        pendingTapAt: null,
        pendingBeat: -1,
        pendingErrorMs: 0,
        lastSuccessBeat: -1,
      };
      this.extra.set(id, clock);
    }
    return clock;
  }

  private expireDoubles(now: number): void {
    for (const [id, clock] of this.extra) {
      if (clock.pendingTapAt === null) continue;
      if (now - clock.pendingTapAt <= DOUBLE_GAP_MS) continue;
      const beatIndex = clock.pendingBeat;
      clock.pendingTapAt = null;
      clock.pendingBeat = -1;
      clock.used.add(beatIndex);
      clock.streak = 0;
      this.lastResult = {
        errorMs: DOUBLE_GAP_MS,
        points: 0,
        grade: "miss",
        streak: 0,
        beatIndex,
      };
      this.ping(id);
      this.emit();
    }
  }

  private pressMain(now: number, fromStar: boolean): void {
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

    const result = this.scoreHit(errorMs, this.streak, beatIndex, fromStar);
    this.streak = result.streak;
    if (result.streak > this.save.bestStreak) this.save.bestStreak = result.streak;
    this.save.score += result.points;
    this.lastResult = result;
    persistSave(this.save);
    this.emit();
  }

  private pressExtra(id: string, now: number, fromStar: boolean): boolean {
    const pad = padById(id);
    const clock = this.ensureExtra(id, now);
    const { errorMs, beatIndex } = nearestBeatError(now, clock.origin, pad.interval);

    if (pad.kind === "double") {
      return this.pressDouble(id, clock, errorMs, beatIndex, now, fromStar);
    }

    if (clock.used.has(beatIndex)) return false;
    clock.used.add(beatIndex);
    this.trimUsed(clock.used, beatIndex);
    this.ping(id);

    const result = this.scoreHit(errorMs, clock.streak, beatIndex, fromStar);
    if (pad.kind === "pair") {
      this.applyPair(clock, result);
    } else {
      clock.streak = result.streak;
    }
    this.lastResult = result;
    if (result.points > 0) {
      this.save.score += result.points;
      persistSave(this.save);
    }
    this.emit();
    return true;
  }

  private pressDouble(
    id: string,
    clock: ExtraClock,
    errorMs: number,
    beatIndex: number,
    now: number,
    fromStar: boolean,
  ): boolean {
    if (clock.pendingTapAt !== null) {
      const heldBeat = clock.pendingBeat;
      const heldError = clock.pendingErrorMs;
      if (withinDoubleGap(clock.pendingTapAt, now, DOUBLE_GAP_MS)) {
        clock.pendingTapAt = null;
        clock.pendingBeat = -1;
        clock.used.add(heldBeat);
        this.trimUsed(clock.used, heldBeat);
        this.ping(id);
        const result = this.scoreHit(heldError, clock.streak, heldBeat, fromStar);
        clock.streak = result.streak;
        this.lastResult = result;
        if (result.points > 0) {
          this.save.score += result.points;
          persistSave(this.save);
        }
        this.emit();
        return true;
      }
      clock.pendingTapAt = null;
      clock.pendingBeat = -1;
      clock.used.add(heldBeat >= 0 ? heldBeat : beatIndex);
      clock.streak = 0;
      this.lastResult = {
        errorMs,
        points: 0,
        grade: "miss",
        streak: 0,
        beatIndex: heldBeat >= 0 ? heldBeat : beatIndex,
      };
      this.ping(id);
      this.emit();
      return true;
    }

    if (clock.used.has(beatIndex)) return false;

    const probe = this.scoreHit(errorMs, 0, beatIndex, fromStar);
    if (probe.grade === "miss") {
      clock.used.add(beatIndex);
      this.trimUsed(clock.used, beatIndex);
      clock.streak = 0;
      this.lastResult = probe;
      this.ping(id);
      this.emit();
      return true;
    }

    clock.pendingTapAt = now;
    clock.pendingBeat = beatIndex;
    clock.pendingErrorMs = errorMs;
    this.lastResult = {
      errorMs,
      points: 0,
      grade: "set",
      streak: clock.streak,
      beatIndex,
    };
    this.ping(id);
    this.emit();
    return true;
  }

  private applyPair(clock: ExtraClock, result: PressResult): void {
    if (result.grade === "miss") {
      clock.streak = 0;
      clock.lastSuccessBeat = -1;
      return;
    }
    if (pairCompletes(clock.lastSuccessBeat, result.beatIndex)) {
      clock.streak = result.streak;
      clock.lastSuccessBeat = -1;
      return;
    }
    clock.lastSuccessBeat = result.beatIndex;
    clock.streak = result.streak;
    result.points = 0;
    result.grade = "set";
  }

  private scoreHit(
    errorMs: number,
    streakBefore: number,
    beatIndex: number,
    fromStar: boolean,
  ): PressResult {
    if (fromStar) {
      return scorePress({
        errorMs,
        focusLevel: 0,
        multiplierLevel: 0,
        comboLevel: 0,
        streakBefore: 0,
        beatIndex,
      });
    }
    return scorePress({
      errorMs,
      focusLevel: this.save.upgrades.focus,
      multiplierLevel: this.save.upgrades.multiplier,
      comboLevel: this.save.upgrades.combo,
      streakBefore,
      beatIndex,
    });
  }

  private trimUsed(used: Set<number>, beatIndex: number): void {
    if (used.size <= 64) return;
    const min = beatIndex - 32;
    for (const b of [...used]) {
      if (b < min) used.delete(b);
    }
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
