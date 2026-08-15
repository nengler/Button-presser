import type { PressResult } from "../../game/types.ts";
import { windowMs } from "../../game/upgrades.ts";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  const AC = globalThis.AudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Unlock audio on the first user gesture. Call from pointer/key handlers. */
export function armSfx(): void {
  audio();
}

/** Higher pitch as the press lands closer to the beat. Misses stay low. */
export function playPress(result: PressResult, focusLevel: number): void {
  const ac = audio();
  if (!ac) return;
  if (ac.state === "suspended") {
    void ac.resume().then(function () {
      beep(ac, result, focusLevel);
    });
    return;
  }
  beep(ac, result, focusLevel);
}

function beep(ac: AudioContext, result: PressResult, focusLevel: number): void {
  const now = ac.currentTime;
  const miss = result.grade === "miss";
  const ratio = Math.min(1, Math.abs(result.errorMs) / windowMs(focusLevel));
  const closeness = miss ? 0 : 1 - ratio;
  const hz = 140 + closeness * closeness * 740;
  const dur = miss ? 0.11 : 0.055 + closeness * 0.04;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = miss ? "sawtooth" : "square";
  osc.frequency.setValueAtTime(hz, now);
  if (!miss && closeness > 0.85) {
    osc.frequency.exponentialRampToValueAtTime(hz * 1.12, now + dur);
  } else if (miss) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(60, hz * 0.55), now + dur);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(miss ? 0.05 : 0.07, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}
