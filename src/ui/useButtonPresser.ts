import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Game } from "../game/Game.ts";
import type { GameSnapshot } from "../game/Game.ts";
import type { UpgradeId } from "../game/types.ts";

export function useButtonPresser() {
  const game = useMemo(() => new Game(), []);
  const [snap, setSnap] = useState<GameSnapshot>(() => game.snapshot());
  const [pressFlashUntil, setPressFlashUntil] = useState(0);
  const flashTimer = useRef(0);

  useEffect(() => game.subscribe(setSnap), [game]);
  useEffect(
    () => () => {
      window.clearTimeout(flashTimer.current);
    },
    [],
  );

  const press = useCallback(() => {
    if (!game.snapshot().running) return;
    game.press();
    window.clearTimeout(flashTimer.current);
    setPressFlashUntil(performance.now() + 120);
    flashTimer.current = window.setTimeout(() => setPressFlashUntil(0), 120);
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
      return true;
    }
    return false;
  }, [game]);

  return { game, snap, pressFlashUntil, press, toggleRun, buy, reset };
}
