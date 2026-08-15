import { useState, useSyncExternalStore } from "react";
import { Game } from "../../game/Game.ts";
import { MAIN_BUTTON } from "../../game/buttons.ts";
import type { UpgradeId } from "../../game/types.ts";
import { armSfx, playPress } from "../sfx.ts";

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

  function pressMain() {
    armSfx();
    if (!game.press(MAIN_BUTTON.id)) return;
    const snap = game.snapshot();
    if (snap.lastResult) playPress(snap.lastResult, snap.upgrades.focus);
  }

  function buyUpgrade(id: UpgradeId) {
    return game.buyUpgrade(id);
  }

  function reset() {
    if (!confirm("Reset all progress?")) return;
    game.resetProgress();
    game.stop();
  }

  return {
    game,
    snap,
    pressMain,
    buyUpgrade,
    reset,
  };
}
