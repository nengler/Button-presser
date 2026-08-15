import { useEffect, useState } from "react";
import { HEIGHT, WIDTH } from "./game/view.ts";
import { Hud } from "./ui/Hud.tsx";
import { Playfield } from "./ui/Playfield.tsx";
import { Sky } from "./ui/Sky.tsx";
import { UpgradeTree } from "./ui/UpgradeTree.tsx";
import { useGame } from "./ui/useGame.ts";
import { usePixelScale } from "./ui/usePixelScale.ts";
import "./ui/styles.css";

export function App() {
  const [treeOpen, setTreeOpen] = useState(false);
  const scale = usePixelScale();
  const { game, snap, pressMain, buyUpgrade, reset } = useGame();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        setTreeOpen(false);
        return;
      }
      if (treeOpen) return;
      if (e.code !== "Space" && e.key !== " ") return;
      e.preventDefault();
      pressMain();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pressMain, treeOpen]);

  return (
    <div className="page">
      <Sky scale={scale} />
      <div className="frame" style={{ width: WIDTH * scale, height: HEIGHT * scale }}>
        <div className="stage" style={{ transform: `scale(${scale})` }}>
          <Playfield game={game} />
          <Hud snap={snap} onTree={() => setTreeOpen(true)} />
          {treeOpen ? (
            <UpgradeTree
              snap={snap}
              onBack={() => setTreeOpen(false)}
              onBuyUpgrade={buyUpgrade}
              onHireStar={() => game.hireStar()}
              onUnlockPad={(id) => game.unlockPad(id)}
              onReset={reset}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
