import { useCallback, useEffect, useRef, useState } from "react";
import type { Game } from "../game/Game.ts";
import { nearestBeatError, scorePress } from "../game/timing.ts";
import {
  MAIN_STATION_ID,
  padById,
} from "../game/toys.ts";

export type Burst = { nonce: number; x: number; y: number };

export type PadRuntime = {
  id: string;
  phase: number;
  lastLabel: string | null;
};

export function useFutureToys(game: Game, pressMain: () => void) {
  const [burst, setBurst] = useState<Burst>({ nonce: 0, x: 0, y: 0 });
  const [padUi, setPadUi] = useState<PadRuntime[]>([
    { id: MAIN_STATION_ID, phase: 0, lastLabel: null },
  ]);

  const origins = useRef<Record<string, number>>({});
  const used = useRef<Record<string, Set<number>>>({});
  const streaks = useRef<Record<string, number>>({});
  const minionBeat = useRef<Record<string, number>>({});

  const spark = useCallback((stationId: string) => {
    const pad = padById(stationId);
    setBurst((b) => ({ nonce: b.nonce + 1, x: pad.x, y: pad.y }));
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
      const key = id;
      const seen = (used.current[key] ??= new Set());
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
      setPadUi((rows) =>
        rows.map((row) =>
          row.id === id
            ? {
                ...row,
                lastLabel:
                  result.grade === "miss"
                    ? "MISS"
                    : `+${result.points} ${result.grade.toUpperCase()}`,
              }
            : row,
        ),
      );
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
    setPadUi([{ id: MAIN_STATION_ID, phase: 0, lastLabel: null }]);
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const live = game.snapshot();
      const now = performance.now();
      const unlocked = live.unlockedPads;
      const minionCount = live.minions;
      if (live.running) {
        for (const id of unlocked) {
          origins.current[id] ??= now;
        }
      }
      const stations = [MAIN_STATION_ID, ...unlocked];

      const nextUi: PadRuntime[] = stations.map((id) => {
        const pad = padById(id);
        const interval = id === MAIN_STATION_ID ? live.interval : pad.interval;
        const origin =
          id === MAIN_STATION_ID
            ? now - live.phase * interval
            : (origins.current[id] ?? now);
        const phase = live.running
          ? ((now - origin) % interval) / interval
          : (now / interval) % 1;
        return {
          id,
          phase,
          lastLabel: null,
        };
      });
      setPadUi((prev) =>
        nextUi.map((row) => ({
          ...row,
          lastLabel: prev.find((p) => p.id === row.id)?.lastLabel ?? null,
        })),
      );

      if (live.running && minionCount > 0) {
        stations.forEach((id, i) => {
          const assigned = [...Array(minionCount).keys()].filter(
            (m) => m % stations.length === i,
          );
          if (assigned.length === 0) return;

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
    burst,
    padUi,
    hireMinion,
    unlockPad,
    pressPad,
    pressMainAndSpark,
    resetToys,
    spark,
  };
}
