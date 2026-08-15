import { useState, useSyncExternalStore } from "react";
import { Game } from "../../game/Game.ts";
import type { UpgradeId } from "../../game/types.ts";

export function useGame() {
  const [game] = useState(function () {
    return new Game();
  });
  const snap = useSyncExternalStore(
    function (onStoreChange) {
      return game.subscribe(onStoreChange);
    },
    function () {
      return game.getSnapshot();
    },
  );

  function buyUpgrade(id: UpgradeId) {
    return game.buyUpgrade(id);
  }

  function reset() {
    if (!confirm("Reset all progress?")) return;
    game.resetProgress();
    game.stop();
  }

  function debugCash() {
    game.debugGrantCash();
  }

  return {
    game,
    snap,
    buyUpgrade,
    reset,
    debugCash,
  };
}
