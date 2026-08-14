import { useEffect, useState } from "react";
import { HEIGHT, WIDTH } from "./game/view.ts";
import { Hud } from "./ui/Hud.tsx";
import { Playfield } from "./ui/Playfield.tsx";
import { UpgradeTree } from "./ui/UpgradeTree.tsx";
import { useButtonPresser } from "./ui/useButtonPresser.ts";
import { useFutureToys } from "./ui/useFutureToys.ts";
import { usePixelScale } from "./ui/usePixelScale.ts";
import "./ui/styles.css";

export function App() {
  const [treeOpen, setTreeOpen] = useState(false);
  const scale = usePixelScale();
  const { game, snap, pressFlashUntil, press, toggleRun, buy, reset } =
    useButtonPresser();
  const toys = useFutureToys(game, press);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        setTreeOpen(false);
        return;
      }
      if (treeOpen) return;
      if (e.code !== "Space" && e.key !== " ") return;
      e.preventDefault();
      if (!game.snapshot().running) {
        game.start();
        return;
      }
      toys.pressMainAndSpark();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game, toys.pressMainAndSpark, treeOpen]);

  return (
    <div className="page">
      <div
        className="frame"
        style={{ width: WIDTH * scale, height: HEIGHT * scale }}
      >
        <div className="stage" style={{ transform: `scale(${scale})` }}>
          <div className="gl">
            <Playfield
              pads={toys.padUi}
              minions={snap.minions}
              burst={toys.burst}
              onPressPad={toys.pressPad}
            />
          </div>
          <Hud
            snap={snap}
            pressFlashUntil={pressFlashUntil}
            onToggle={toggleRun}
            onPress={toys.pressMainAndSpark}
            onTree={() => setTreeOpen(true)}
          />
          {treeOpen ? (
            <UpgradeTree
              snap={snap}
              minions={snap.minions}
              unlockedPads={snap.unlockedPads}
              onBack={() => setTreeOpen(false)}
              onBuyUpgrade={buy}
              onHireMinion={toys.hireMinion}
              onUnlockPad={toys.unlockPad}
              onReset={() => {
                if (reset()) toys.resetToys();
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
