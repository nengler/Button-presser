import { useEffect, useRef, useState } from "react";
import { HEIGHT, WIDTH } from "./game/view.ts";
import { Hud } from "./ui/Hud/index.tsx";
import { PixelCursor } from "./ui/PixelCursor/index.tsx";
import { Playfield } from "./ui/Playfield/index.tsx";
import { Sky } from "./ui/Sky/index.tsx";
import { Shop, SHOP_IN_MS } from "./ui/UpgradeTree/index.tsx";
import { useGame } from "./ui/hooks/useGame.ts";
import { usePixelScale } from "./ui/hooks/usePixelScale.ts";
import "./ui/styles.css";

const FIELD_MS = 280;

type ShopMode = "off" | "out" | "on" | "leave" | "in";

export function App() {
  const [shop, setShop] = useState<ShopMode>("off");
  const outTimer = useRef(0);
  const scale = usePixelScale();
  const { game, snap, buyUpgrade, reset, debugCash } = useGame();

  function closeShop() {
    if (shop !== "on") return;
    window.clearTimeout(outTimer.current);
    setShop("leave");
    outTimer.current = window.setTimeout(function () {
      setShop("in");
      outTimer.current = window.setTimeout(function () {
        setShop("off");
      }, FIELD_MS);
    }, SHOP_IN_MS);
  }

  function openShop() {
    if (shop !== "off") return;
    setShop("out");
    window.clearTimeout(outTimer.current);
    outTimer.current = window.setTimeout(function () {
      setShop("on");
    }, FIELD_MS);
  }

  useEffect(
    function () {
      function onKey(e: KeyboardEvent) {
        if (e.code === "Escape") closeShop();
      }
      window.addEventListener("keydown", onKey);
      return function () {
        window.removeEventListener("keydown", onKey);
      };
    },
    [shop],
  );

  const shopOpen = shop === "on" || shop === "leave";
  const stageClass =
    shop === "out"
      ? " shop-out"
      : shopOpen
        ? " shop-on"
        : shop === "in"
          ? " shop-in"
          : "";

  return (
    <div className="page">
      <Sky />
      <div className="frame" style={{ width: WIDTH * scale, height: HEIGHT * scale }}>
        <div className={`stage${stageClass}`} style={{ transform: `scale(${scale})` }}>
          <Playfield game={game} />
          <Hud snap={snap} onShop={openShop} />
          {shopOpen ? (
            <Shop
              leaving={shop === "leave"}
              snap={snap}
              onBack={closeShop}
              onBuyUpgrade={buyUpgrade}
              onHireStar={function () {
                game.hireStar();
              }}
              onUnlockButton={function (id) {
                game.unlockButton(id);
              }}
              onReset={reset}
              onDebugCash={debugCash}
            />
          ) : null}
        </div>
      </div>
      <PixelCursor game={game} scale={scale} />
    </div>
  );
}
