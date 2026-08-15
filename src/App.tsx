import { useEffect, useState } from "react";
import { HEIGHT, WIDTH } from "./game/view.ts";
import { Hud } from "./ui/Hud.tsx";
import { Playfield } from "./ui/Playfield.tsx";
import { UpgradeTree } from "./ui/UpgradeTree.tsx";
import { useGame } from "./ui/useGame.ts";
import { usePixelScale } from "./ui/usePixelScale.ts";
import "./ui/styles.css";

export function App() {
  const [treeOpen, setTreeOpen] = useState(false);
  const scale = usePixelScale();
  const { game, snap, pressFlashUntil, pressMain, toggleRun, buyUpgrade, reset } =
    useGame();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        setTreeOpen(false);
        return;
      }
      if (treeOpen) return;
      if (e.code !== "Space" && e.key !== " ") return;
      e.preventDefault();
      if (!game.snapshot().running) game.start();
      else pressMain();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game, pressMain, treeOpen]);

  return (
    <div className="page">
      <div className="frame" style={{ width: WIDTH * scale, height: HEIGHT * scale }}>
        <div className="stage" style={{ transform: `scale(${scale})` }}>
          <Playfield game={game} />
          <Hud
            snap={snap}
            pressFlashUntil={pressFlashUntil}
            onToggle={toggleRun}
            onPress={pressMain}
            onTree={() => setTreeOpen(true)}
          />
          {treeOpen ? (
            <UpgradeTree
              snap={snap}
              onBack={() => setTreeOpen(false)}
              onBuyUpgrade={buyUpgrade}
              onHireMinion={() => game.hireMinion()}
              onUnlockPad={(id) => game.unlockPad(id)}
              onReset={reset}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
