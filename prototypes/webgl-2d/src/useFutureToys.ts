import { useCallback, useEffect, useRef, useState } from "react";
import type { Game } from "../../../src/game/Game.ts";
import { nearestBeatError, scorePress } from "../../../src/game/timing.ts";
import {
  EXTRA_PADS,
  MAIN_STATION_ID,
  MINION_COST,
  MINION_MAX,
  padById,
} from "./futureShop.ts";

export type Burst = { nonce: number; x: number; y: number };

export type PadRuntime = {
  id: string;
  phase: number;
  lastLabel: string | null;
};

export function useFutureToys(game: Game, pressMain: () => void) {
  const [minions, setMinions] = useState(0);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [burst, setBurst] = useState<Burst>({ nonce: 0, x: 0, y: 0 });
  const [padUi, setPadUi] = useState<PadRuntime[]>([
    { id: MAIN_STATION_ID, phase: 0, lastLabel: null },
  ]);

  const unlockedRef = useRef(unlocked);
  unlockedRef.current = unlocked;
  const minionsRef = useRef(minions);
  minionsRef.current = minions;

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
      if (!unlockedRef.current.includes(id)) return;

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
    if (minionsRef.current >= MINION_MAX) return;
    if (!game.spendScore(MINION_COST)) return;
    setMinions((n) => n + 1);
  }, [game]);

  const unlockPad = useCallback(
    (id: string) => {
      if (unlockedRef.current.includes(id)) return;
      const pad = EXTRA_PADS.find((p) => p.id === id);
      if (!pad) return;
      if (!game.spendScore(pad.cost)) return;
      origins.current[id] = performance.now();
      used.current[id] = new Set();
      streaks.current[id] = 0;
      setUnlocked((ids) => [...ids, id]);
    },
    [game],
  );

  const resetToys = useCallback(() => {
    setMinions(0);
    setUnlocked([]);
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
      if (live.running) {
        for (const id of unlockedRef.current) {
          origins.current[id] ??= now;
        }
      }
      const stations = [MAIN_STATION_ID, ...unlockedRef.current];

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

      if (live.running && minionsRef.current > 0) {
        stations.forEach((id, i) => {
          const assigned = [...Array(minionsRef.current).keys()].filter(
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
    minions,
    unlocked,
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
