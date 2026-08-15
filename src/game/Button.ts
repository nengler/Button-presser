import { type ButtonDef, MAIN_BUTTON } from "./buttons.ts";
import { nearestBeatError, pairCompletes, withinDoubleGap } from "./timing.ts";
import type { ButtonView, GameSave, PressResult } from "./types.ts";
import { doubleGapMs, intervalMs, starShareFactor, windowMs } from "./upgrades.ts";
import type { Star } from "./Star.ts";

export type HitWorld = {
  upgrades: GameSave["upgrades"];
  evaluateHit(args: {
    errorMs: number;
    streakBefore: number;
    beatIndex: number;
    fromStar: boolean;
    extraButton: boolean;
  }): PressResult;
};

export type PressAttempt =
  | { ok: false }
  | { ok: true; result: PressResult; ping: boolean; persist: boolean; payoffs: boolean };

function trimUsed(used: Set<number>, beatIndex: number): void {
  if (used.size <= 64) return;
  const min = beatIndex - 32;
  for (const b of used) {
    if (b < min) used.delete(b);
  }
}

export class Button {
  readonly def: ButtonDef;
  readonly isMain: boolean;
  origin: number;
  streak = 0;
  stars: Star[] = [];
  /** Shared by every star on this button. Survives stars being reassigned. */
  starBeat = -1;
  starSkip = 0;

  private used = new Set<number>();
  private pendingTapAt: number | null = null;
  private pendingBeat = -1;
  private pendingErrorMs = 0;
  private lastSuccessBeat = -1;
  /** Last beat the player actually hit. Stars and idle time do not advance this. */
  private lastHitBeat = -1;

  constructor(args: { def: ButtonDef; origin: number }) {
    this.def = args.def;
    this.isMain = args.def.id === MAIN_BUTTON.id;
    this.origin = args.origin;
  }

  interval(upgrades: GameSave["upgrades"]): number {
    return this.isMain ? intervalMs(upgrades.tempo) : this.def.interval;
  }

  nearest(now: number, upgrades: GameSave["upgrades"]): { errorMs: number; beatIndex: number } {
    return nearestBeatError(now, this.origin, this.interval(upgrades));
  }

  canAcceptBeat(now: number, upgrades: GameSave["upgrades"]): boolean {
    const { beatIndex } = this.nearest(now, upgrades);
    return !this.used.has(beatIndex);
  }

  view(now: number, running: boolean, upgrades: GameSave["upgrades"]): ButtonView {
    const interval = this.interval(upgrades);
    const phase = running ? ((now - this.origin) % interval) / interval : (now / interval) % 1;
    let mark: 0 | 1 | 2 = 0;
    if (this.def.kind === "double" && this.pendingTapAt !== null) mark = 2;
    else if (this.def.kind === "pair" && this.lastSuccessBeat >= 0) mark = 1;
    return { id: this.def.id, phase, mark };
  }

  resetSession(): void {
    this.streak = 0;
    this.used.clear();
    this.pendingTapAt = null;
    this.pendingBeat = -1;
    this.pendingErrorMs = 0;
    this.lastSuccessBeat = -1;
    this.lastHitBeat = -1;
  }

  /** Timed-out double-tap. Caller treats this as a player miss. */
  expirePending(now: number, upgrades: GameSave["upgrades"]): PressResult | null {
    if (this.pendingTapAt === null) return null;
    if (now - this.pendingTapAt <= doubleGapMs(upgrades.twinGap)) return null;
    const beatIndex = this.pendingBeat;
    this.pendingTapAt = null;
    this.pendingBeat = -1;
    this.used.add(beatIndex);
    this.noteMiss(false);
    return {
      errorMs: doubleGapMs(upgrades.twinGap),
      points: 0,
      grade: "miss",
      streak: this.streak,
      beatIndex,
    };
  }

  pendingReadyForStar(now: number, upgrades: GameSave["upgrades"]): boolean {
    if (this.def.kind !== "double" || this.pendingTapAt === null) return false;
    const dt = now - this.pendingTapAt;
    return dt >= 70 && dt <= doubleGapMs(upgrades.twinGap);
  }

  /**
   * If the next beat after the player's last hit can no longer score, the cycle was missed.
   */
  expireMissedBeats(now: number, upgrades: GameSave["upgrades"]): PressResult | null {
    if (this.pendingTapAt !== null) return null;
    if (this.streak <= 0 || this.lastHitBeat < 0) return null;
    const interval = this.interval(upgrades);
    const window = windowMs(upgrades.focus);
    const nextBeat = this.lastHitBeat + 1;
    const deadline = this.origin + nextBeat * interval + window;
    if (now <= deadline) return null;
    this.streak = 0;
    this.lastSuccessBeat = -1;
    return {
      errorMs: window,
      points: 0,
      grade: "miss",
      streak: 0,
      beatIndex: nextBeat,
    };
  }

  /** Count a leftover beat toward this button's star cadence. True when the star should press. */
  noteStarBeat(beatIndex: number, period: number): boolean {
    if (this.starBeat === beatIndex || this.used.has(beatIndex)) return false;
    if (this.pendingTapAt !== null) return false;
    this.starSkip += 1;
    if (this.starSkip < period) return false;
    this.starSkip = 0;
    this.starBeat = beatIndex;
    return true;
  }

  press(args: { now: number; fromStar: boolean; world: HitWorld }): PressAttempt {
    const { now, fromStar, world } = args;
    this.expireMissedBeats(now, world.upgrades);
    const { errorMs, beatIndex } = this.nearest(now, world.upgrades);

    if (this.def.kind === "double" && !this.isMain) {
      return this.pressDouble({ now, fromStar, world, errorMs, beatIndex });
    }

    if (this.used.has(beatIndex)) {
      if (!this.isMain) return { ok: false };
      this.noteMiss(fromStar);
      return {
        ok: true,
        ping: true,
        persist: false,
        payoffs: false,
        result: {
          errorMs,
          points: 0,
          grade: "miss",
          streak: this.streak,
          beatIndex,
        },
      };
    }

    this.used.add(beatIndex);
    trimUsed(this.used, beatIndex);

    const result = world.evaluateHit({
      errorMs,
      streakBefore: fromStar ? 0 : this.streak,
      beatIndex,
      fromStar,
      extraButton: !this.isMain,
    });
    this.takeHit(result, fromStar);

    return {
      ok: true,
      ping: true,
      persist: this.isMain || result.points > 0,
      payoffs: true,
      result,
    };
  }

  private pressDouble(args: {
    now: number;
    fromStar: boolean;
    world: HitWorld;
    errorMs: number;
    beatIndex: number;
  }): PressAttempt {
    const { now, fromStar, world, errorMs, beatIndex } = args;

    if (this.pendingTapAt !== null) {
      const heldBeat = this.pendingBeat;
      const heldError = this.pendingErrorMs;
      if (withinDoubleGap(this.pendingTapAt, now, doubleGapMs(world.upgrades.twinGap))) {
        this.pendingTapAt = null;
        this.pendingBeat = -1;
        this.used.add(heldBeat);
        trimUsed(this.used, heldBeat);
        const result = world.evaluateHit({
          errorMs: heldError,
          streakBefore: fromStar ? 0 : this.streak,
          beatIndex: heldBeat,
          fromStar,
          extraButton: true,
        });
        this.takeHit(result, fromStar);
        return {
          ok: true,
          ping: true,
          persist: result.points > 0,
          payoffs: true,
          result,
        };
      }
      this.pendingTapAt = null;
      this.pendingBeat = -1;
      this.used.add(heldBeat >= 0 ? heldBeat : beatIndex);
      this.noteMiss(fromStar);
      return {
        ok: true,
        ping: true,
        persist: false,
        payoffs: false,
        result: {
          errorMs,
          points: 0,
          grade: "miss",
          streak: this.streak,
          beatIndex: heldBeat >= 0 ? heldBeat : beatIndex,
        },
      };
    }

    if (this.used.has(beatIndex)) return { ok: false };

    const share = fromStar ? starShareFactor(world.upgrades.starSkill) : 1;
    const focus = Math.round(world.upgrades.focus * share);
    if (Math.abs(errorMs) >= windowMs(focus)) {
      this.used.add(beatIndex);
      trimUsed(this.used, beatIndex);
      this.noteMiss(fromStar);
      return {
        ok: true,
        ping: true,
        persist: false,
        payoffs: false,
        result: {
          errorMs,
          points: 0,
          grade: "miss",
          streak: this.streak,
          beatIndex,
        },
      };
    }

    this.pendingTapAt = now;
    this.pendingBeat = beatIndex;
    this.pendingErrorMs = errorMs;
    if (!fromStar) this.lastHitBeat = beatIndex;
    return {
      ok: true,
      ping: true,
      persist: false,
      payoffs: false,
      result: {
        errorMs,
        points: 0,
        grade: "set",
        streak: this.streak,
        beatIndex,
      },
    };
  }

  private takeHit(result: PressResult, fromStar: boolean): void {
    if (this.def.kind === "pair") this.applyPair(result, fromStar);
    else if (!fromStar) this.streak = result.grade === "miss" ? 0 : result.streak;
    else result.streak = this.streak;
    if (!fromStar && result.grade !== "miss") this.lastHitBeat = result.beatIndex;
  }

  private noteMiss(fromStar: boolean): void {
    if (fromStar) return;
    this.streak = 0;
  }

  private applyPair(result: PressResult, fromStar: boolean): void {
    if (result.grade === "miss") {
      this.lastSuccessBeat = -1;
      if (!fromStar) this.streak = 0;
      result.streak = this.streak;
      return;
    }
    if (!fromStar) this.streak = result.streak;
    else result.streak = this.streak;
    if (pairCompletes(this.lastSuccessBeat, result.beatIndex)) {
      this.lastSuccessBeat = -1;
      return;
    }
    this.lastSuccessBeat = result.beatIndex;
    result.points = 0;
    result.grade = "set";
  }
}
