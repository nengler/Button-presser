import type { Button } from "./Button.ts";
import { starAimErrorMs, starAttemptEvery } from "./upgrades.ts";
import type { GameSave } from "./types.ts";

const STAR_HIT_SLOP_MS = 20;

export type StarHost = {
  upgrades: GameSave["upgrades"];
  press(id: string, now: number, opts: { fromStar: boolean }): boolean;
};

/** One hired star, parked on a button. Only the first star on a button auto-taps. */
export class Star {
  constructor(readonly button: Button) {}

  tick(now: number, host: StarHost): void {
    if (this.button.stars[0] !== this) return;

    if (this.button.pendingReadyForStar(now)) {
      host.press(this.button.def.id, now, { fromStar: true });
      return;
    }

    const aim = starAimErrorMs(host.upgrades.starAim);
    const { errorMs, beatIndex } = this.button.nearest(now, host.upgrades);
    if (Math.abs(errorMs - aim) > STAR_HIT_SLOP_MS) return;

    const period = starAttemptEvery(host.upgrades.starRate);
    if (!this.button.noteStarBeat(beatIndex, period)) return;
    host.press(this.button.def.id, now, { fromStar: true });
  }
}
