import { defaultSave, loadSave, persistSave } from "./save.ts";
import { scorePress } from "./timing.ts";
import type { Burst, GameSave, GameSnapshot, PressResult, UpgradeId } from "./types.ts";
import {
  buttonById,
  buttonCenter,
  extraButtonById,
  MAIN_BUTTON,
  STAR_MAX,
  starCost,
  starsOnButton,
} from "./buttons.ts";
import { Button, type HitWorld } from "./Button.ts";
import { Star } from "./Star.ts";
import {
  bonusHitPayout,
  bonusHitPeriod,
  intervalMs,
  padPayFactor,
  starShareFactor,
  UPGRADE_DEFS,
} from "./upgrades.ts";

export type { Burst, GameSnapshot } from "./types.ts";

/** Session store: save, score, and the list of buttons/stars. Buttons and stars tick themselves. */
export class Game {
  burst: Burst = { nonce: 0, x: 0, y: 0 };

  private save: GameSave = loadSave();
  private lastResult: PressResult | null = null;
  private running = false;
  private hitCount = 0;
  private listeners = new Set<() => void>();
  private lastSnap: GameSnapshot | null = null;
  private buttonsList: Button[] = [];
  private starsList: Star[] = [];

  constructor() {
    this.rebuildButtons();
  }

  subscribe(onStoreChange: () => void): () => void {
    this.listeners.add(onStoreChange);
    const listeners = this.listeners;
    return () => {
      listeners.delete(onStoreChange);
    };
  }

  getSnapshot(): GameSnapshot {
    return this.lastSnap ?? (this.lastSnap = this.snapshot());
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastResult = null;
    for (const button of this.buttonsList) button.resetSession();
    this.emit();
  }

  stop(): void {
    this.running = false;
    this.emit();
  }

  tick(now = performance.now()): void {
    if (!this.running) return;
    const upgrades = this.save.upgrades;
    for (const button of this.buttonsList) {
      const expired = button.expirePending(now) ?? button.expireMissedBeats(now, upgrades);
      if (!expired) continue;
      this.ping(button.def.id);
      this.lastResult = expired;
      this.emit();
    }
    for (const star of this.starsList) star.tick(now, this);
  }

  /**
   * Hit a button. The first hit starts the session and still scores.
   * Returns false if the button is locked or that extra beat was already used.
   */
  press(id = MAIN_BUTTON.id, now = performance.now(), opts: { fromStar?: boolean } = {}): boolean {
    if (!this.running) this.start();
    const button = this.buttonsList.find(function (p) {
      return p.def.id === id;
    });
    if (!button) return false;
    const fromStar = opts.fromStar === true;
    const attempt = button.press({ now, fromStar, world: this.hitWorld() });
    if (!attempt.ok) return false;
    if (attempt.payoffs) this.applyPayoffs(attempt.result, fromStar);
    if (attempt.ping) this.ping(id);
    this.lastResult = attempt.result;
    if (attempt.result.points > 0) this.save.score += attempt.result.points;
    if (attempt.persist) persistSave(this.save);
    this.emit();
    return true;
  }

  get upgrades(): GameSave["upgrades"] {
    return this.save.upgrades;
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
    const cost = starCost(this.save.stars);
    if (this.save.score < cost) return false;
    this.save.score -= cost;
    this.save.stars += 1;
    this.parkStars();
    persistSave(this.save);
    this.emit();
    return true;
  }

  unlockButton(id: string): boolean {
    if (this.save.unlockedPads.includes(id)) return false;
    const def = extraButtonById(id);
    if (!def || this.save.score < def.cost) return false;
    this.save.score -= def.cost;
    this.save.unlockedPads = [...this.save.unlockedPads, id];
    this.buttonsList.push(new Button({ def, origin: performance.now() }));
    this.parkStars();
    persistSave(this.save);
    this.emit();
    return true;
  }

  resetProgress(): void {
    this.save = defaultSave();
    this.lastResult = null;
    this.hitCount = 0;
    this.burst = { nonce: 0, x: 0, y: 0 };
    this.rebuildButtons();
    persistSave(this.save);
    this.emit();
  }

  /** Debug: dump a pile of score so the shop can be exercised. */
  debugGrantCash(amount = 1_000_000): void {
    this.save.score += amount;
    persistSave(this.save);
    this.emit();
  }

  buttons(now = performance.now()) {
    const running = this.running;
    const upgrades = this.save.upgrades;
    return this.buttonsList.map(function (button) {
      return button.view(now, running, upgrades);
    });
  }

  get stars(): number {
    return this.save.stars;
  }

  snapshot(): GameSnapshot {
    const interval = intervalMs(this.save.upgrades.tempo);
    const now = performance.now();
    const main = this.mainButton;
    return {
      score: this.save.score,
      buttonStreaks: this.buttonsList.map(function (button) {
        return { id: button.def.id, streak: button.streak };
      }),
      interval,
      phase: this.running ? ((now - main.origin) % interval) / interval : 0,
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

  private get mainButton(): Button {
    return this.buttonsList[0]!;
  }

  private rebuildButtons(): void {
    this.buttonsList = [new Button({ def: MAIN_BUTTON, origin: 0 })];
    const now = performance.now();
    for (const id of this.save.unlockedPads) {
      this.buttonsList.push(new Button({ def: buttonById(id), origin: now }));
    }
    this.parkStars();
  }

  /** Sprinkle hired stars across buttons the same way the playfield does. */
  private parkStars(): void {
    for (const button of this.buttonsList) button.stars = [];
    this.starsList = [];
    const n = this.buttonsList.length;
    const count = this.save.stars;
    for (let i = 0; i < n; i++) {
      const button = this.buttonsList[i]!;
      const here = starsOnButton(count, i, n);
      for (let s = 0; s < here; s++) {
        const star = new Star(button);
        button.stars.push(star);
        this.starsList.push(star);
      }
    }
  }

  private hitWorld(): HitWorld {
    return {
      upgrades: this.save.upgrades,
      evaluateHit: this.evaluateHit.bind(this),
    };
  }

  private evaluateHit(args: {
    errorMs: number;
    streakBefore: number;
    beatIndex: number;
    fromStar: boolean;
    extraButton: boolean;
  }): PressResult {
    const u = this.save.upgrades;
    const share = args.fromStar ? starShareFactor(u.starSkill) : 1;
    const result = scorePress({
      errorMs: args.errorMs,
      focusLevel: Math.round(u.focus * share),
      multiplierLevel: Math.round(u.multiplier * share),
      comboLevel: Math.round(u.combo * share),
      perfectLevel: Math.round(u.perfectPay * share),
      streakBefore: args.fromStar ? 0 : args.streakBefore,
      beatIndex: args.beatIndex,
    });

    if (result.grade === "miss") return result;

    if (args.extraButton && u.padPay > 0) {
      result.points = Math.round(result.points * padPayFactor(u.padPay));
    }

    return result;
  }

  private applyPayoffs(result: PressResult, fromStar: boolean): void {
    if (result.grade === "miss" || result.grade === "set" || result.points <= 0) return;
    const u = this.save.upgrades;
    if (!fromStar && u.bonusHits > 0) {
      this.hitCount += 1;
      const period = bonusHitPeriod(u.bonusHits);
      if (period > 0 && this.hitCount % period === 0) {
        result.points += bonusHitPayout(u.bonusHits);
      }
    }
  }

  private ping(id: string): void {
    const i = this.buttonsList.findIndex(function (button) {
      return button.def.id === id;
    });
    const pos = buttonCenter(Math.max(0, i), this.buttonsList.length);
    this.burst = { nonce: this.burst.nonce + 1, x: pos.x, y: pos.y };
  }

  private emit(): void {
    this.lastSnap = this.snapshot();
    for (const listener of this.listeners) listener();
  }
}
