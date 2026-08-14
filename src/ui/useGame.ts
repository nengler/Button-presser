import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Game } from "../game/Game.ts";
import type { GameSnapshot } from "../game/Game.ts";
import { MAIN_PAD } from "../game/pads.ts";
import type { UpgradeId } from "../game/types.ts";

export function useGame() {
  const game = useMemo(() => new Game(), []);
  const [snap, setSnap] = useState<GameSnapshot>(() => game.snapshot());
  const [pressFlashUntil, setPressFlashUntil] = useState(0);
  const flashTimer = useRef(0);

  useEffect(() => game.subscribe(setSnap), [game]);
  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const flashPress = useCallback(() => {
    window.clearTimeout(flashTimer.current);
    setPressFlashUntil(performance.now() + 120);
    flashTimer.current = window.setTimeout(() => setPressFlashUntil(0), 120);
  }, []);

  const pressMain = useCallback(() => {
    if (game.press(MAIN_PAD.id)) flashPress();
  }, [flashPress, game]);

  const toggleRun = useCallback(() => {
    if (game.snapshot().running) game.stop();
    else game.start();
  }, [game]);

  const buyUpgrade = useCallback((id: UpgradeId) => game.buyUpgrade(id), [game]);

  const reset = useCallback(() => {
    if (!confirm("Reset all progress?")) return;
    game.resetProgress();
    game.stop();
  }, [game]);

  return {
    game,
    snap,
    pressFlashUntil,
    pressMain,
    toggleRun,
    buyUpgrade,
    reset,
  };
}
