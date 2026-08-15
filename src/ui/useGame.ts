import { useCallback, useEffect, useMemo, useState } from "react";
import { Game } from "../game/Game.ts";
import type { GameSnapshot } from "../game/Game.ts";
import { MAIN_PAD } from "../game/pads.ts";
import type { UpgradeId } from "../game/types.ts";

export function useGame() {
  const game = useMemo(() => new Game(), []);
  const [snap, setSnap] = useState<GameSnapshot>(() => game.snapshot());

  useEffect(() => game.subscribe(setSnap), [game]);

  const pressMain = useCallback(() => {
    game.press(MAIN_PAD.id);
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
    pressMain,
    buyUpgrade,
    reset,
  };
}
