import { useCallback, useEffect, useRef } from "react";
import type { Game } from "../game/Game.ts";
import { nearestBeatError, scorePress } from "../game/timing.ts";
import {
  MAIN_STATION_ID,
  minionsOnStation,
  padById,
} from "../game/toys.ts";

export type Burst = { nonce: number; x: number; y: number };

export type PadRuntime = {
  id: string;
  phase: number;
};

export function useFutureToys(game: Game, pressMain: () => void) {
  const padsRef = useRef<PadRuntime[]>([{ id: MAIN_STATION_ID, phase: 0 }]);
  const burstRef = useRef<Burst>({ nonce: 0, x: 0, y: 0 });
  const minionsRef = useRef(0);

  const origins = useRef<Record<string, number>>({});
  const used = useRef<Record<string, Set<number>>>({});
  const streaks = useRef<Record<string, number>>({});
  const minionBeat = useRef<Record<string, number>>({});

  const spark = useCallback((stationId: string) => {
    const pad = padById(stationId);
    burstRef.current = {
      nonce: burstRef.current.nonce + 1,
      x: pad.x,
      y: pad.y,
    };
  }, []);

  const pressMainAndSpark = useCallback(() => {
    pressMain();
    spark(MAIN_STATION_ID);
  }, [pressMain, spark]);

  const pressPad = useCallback(
    (id: string, now = performance.now()) => {
      if (id === MAIN_STATION_ID) {
        if (!game.snapshot().running) return;
        pressMainAndSpark();
        return;
      }
      if (!game.snapshot().running) return;
      if (!game.snapshot().unlockedPads.includes(id)) return;

      const pad = padById(id);
      const origin = origins.current[id] ?? now;
      const { errorMs, beatIndex } = nearestBeatError(now, origin, pad.interval);
      const seen = (used.current[id] ??= new Set());
      if (seen.has(beatIndex)) return;
      seen.add(beatIndex);

      const live = game.snapshot();
      const result = scorePress({
        errorMs,
        focusLevel: live.upgrades.focus,
        multiplierLevel: live.upgrades.multiplier,
        comboLevel: live.upgrades.combo,
        streakBefore: streaks.current[id] ?? 0,
        beatIndex,
      });
      streaks.current[id] = result.streak;
      game.addScore(result.points);
      spark(id);
    },
    [game, pressMainAndSpark, spark],
  );

  const hireMinion = useCallback(() => {
    game.hireMinion();
  }, [game]);

  const unlockPad = useCallback(
    (id: string) => {
      if (!game.unlockPad(id)) return;
      origins.current[id] = performance.now();
      used.current[id] = new Set();
      streaks.current[id] = 0;
    },
    [game],
  );

  const resetToys = useCallback(() => {
    origins.current = {};
    used.current = {};
    streaks.current = {};
    minionBeat.current = {};
    padsRef.current = [{ id: MAIN_STATION_ID, phase: 0 }];
    burstRef.current = { nonce: 0, x: 0, y: 0 };
    minionsRef.current = 0;
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const live = game.snapshot();
      const now = performance.now();
      const unlocked = live.unlockedPads;
      const minionCount = live.minions;
      minionsRef.current = minionCount;
      if (live.running) {
        for (const id of unlocked) {
          origins.current[id] ??= now;
        }
      }
      const stations = [MAIN_STATION_ID, ...unlocked];

      padsRef.current = stations.map((id) => {
        const pad = padById(id);
        const interval = id === MAIN_STATION_ID ? live.interval : pad.interval;
        const origin =
          id === MAIN_STATION_ID
            ? now - live.phase * interval
            : (origins.current[id] ?? now);
        const phase = live.running
          ? ((now - origin) % interval) / interval
          : (now / interval) % 1;
        return { id, phase };
      });

      if (live.running && minionCount > 0) {
        const n = stations.length;
        stations.forEach((id, i) => {
          if (minionsOnStation(minionCount, i, n) === 0) return;

          const pad = padById(id);
          const interval = id === MAIN_STATION_ID ? live.interval : pad.interval;
          const origin =
            id === MAIN_STATION_ID
              ? now - live.phase * interval
              : (origins.current[id] ?? now);
          const { errorMs, beatIndex } = nearestBeatError(now, origin, interval);
          if (Math.abs(errorMs) > 32) return;
          if (minionBeat.current[id] === beatIndex) return;

          if (id === MAIN_STATION_ID) {
            if (!game.canPress(now)) return;
            minionBeat.current[id] = beatIndex;
            pressMainAndSpark();
            return;
          }
          const seen = used.current[id];
          if (seen?.has(beatIndex)) return;
          minionBeat.current[id] = beatIndex;
          pressPad(id, now);
        });
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [game, pressMainAndSpark, pressPad]);

  return {
    padsRef,
    burstRef,
    minionsRef,
    hireMinion,
    unlockPad,
    pressPad,
    pressMainAndSpark,
    resetToys,
    spark,
  };
}
