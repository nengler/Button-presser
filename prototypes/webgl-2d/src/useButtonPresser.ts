import { useCallback, useEffect, useMemo, useState } from "react";
import { Game } from "../../../src/game/Game.ts";
import type { GameSnapshot } from "../../../src/game/Game.ts";
import type { UpgradeId } from "../../../src/game/types.ts";

export function useButtonPresser() {
  const game = useMemo(() => new Game(), []);
  const [snap, setSnap] = useState<GameSnapshot>(() => game.snapshot());
  const [phase, setPhase] = useState(0);
  const [pressFlashUntil, setPressFlashUntil] = useState(0);

  useEffect(() => game.subscribe(setSnap), [game]);

  useEffect(() => {
    let id = 0;
    const tick = () => {
      const live = game.snapshot();
      setSnap(live);
      setPhase(
        live.running ? live.phase : (performance.now() / live.interval) % 1,
      );
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [game]);

  const press = useCallback(() => {
    if (!game.snapshot().running) return;
    game.press();
    setPressFlashUntil(performance.now() + 120);
  }, [game]);

  const toggleRun = useCallback(() => {
    if (game.snapshot().running) game.stop();
    else game.start();
  }, [game]);

  const buy = useCallback(
    (id: UpgradeId) => {
      game.buyUpgrade(id);
    },
    [game],
  );

  const reset = useCallback(() => {
    if (confirm("Reset all progress?")) {
      game.resetProgress();
      game.stop();
    }
  }, [game]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      e.preventDefault();
      if (!game.snapshot().running) {
        game.start();
        return;
      }
      game.press();
      setPressFlashUntil(performance.now() + 120);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game]);

  return { game, snap, phase, pressFlashUntil, press, toggleRun, buy, reset };
}
