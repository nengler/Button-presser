import { useState } from "react";
import { HEIGHT, WIDTH } from "./game/view.ts";
import { Hud } from "./ui/Hud.tsx";
import { PixelCursor } from "./ui/PixelCursor.tsx";
import { Playfield } from "./ui/Playfield.tsx";
import { Sky } from "./ui/Sky/index.tsx";
import { UpgradeTree } from "./ui/UpgradeTree.tsx";
import { useGame } from "./ui/hooks/useGame.ts";
import { usePixelScale } from "./ui/hooks/usePixelScale.ts";
import "./ui/styles.css";

export function App() {
  const [treeOpen, setTreeOpen] = useState(false);
  const scale = usePixelScale();
  const { game, snap, pressMain, buyUpgrade, reset } = useGame();

  return (
    <div
      className="page"
      ref={function () {
        function onKey(e: KeyboardEvent) {
          if (e.code === "Escape") {
            setTreeOpen(false);
            return;
          }
          if (treeOpen) return;
          if (e.code !== "Space" && e.key !== " ") return;
          e.preventDefault();
          pressMain();
        }
        window.addEventListener("keydown", onKey);
        return function () {
          window.removeEventListener("keydown", onKey);
        };
      }}
    >
      <Sky />
      <div className="frame" style={{ width: WIDTH * scale, height: HEIGHT * scale }}>
        <div className="stage" style={{ transform: `scale(${scale})` }}>
          <Playfield game={game} />
          <Hud
            snap={snap}
            onTree={function () {
              setTreeOpen(true);
            }}
          />
          {treeOpen ? (
            <UpgradeTree
              snap={snap}
              onBack={function () {
                setTreeOpen(false);
              }}
              onBuyUpgrade={buyUpgrade}
              onHireStar={function () {
                game.hireStar();
              }}
              onUnlockButton={function (id) {
                game.unlockButton(id);
              }}
              onReset={reset}
            />
          ) : null}
        </div>
      </div>
      <PixelCursor game={game} scale={scale} />
    </div>
  );
}
