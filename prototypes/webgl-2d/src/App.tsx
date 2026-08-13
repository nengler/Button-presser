import { useEffect, useState } from "react";
import { HEIGHT, WIDTH } from "../../../src/game/view.ts";
import { CarverBeat } from "./CarverBeat.tsx";
import { Hud } from "./Hud.tsx";
import { R3FBeat } from "./R3FBeat.tsx";
import { useButtonPresser } from "./useButtonPresser.ts";
import { useFutureToys } from "./useFutureToys.ts";
import { usePixelScale } from "./usePixelScale.ts";
import "./styles.css";

type Mode = "r3f" | "carver";

export function App() {
  const [mode, setMode] = useState<Mode>("r3f");
  const scale = usePixelScale();
  const { game, snap, pressFlashUntil, press, toggleRun, buy, reset } =
    useButtonPresser();
  const toys = useFutureToys(game, press);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
  }, [game, toys.pressMainAndSpark]);

  return (
    <div className="page">
      <header className="bar">
        <strong>WebGL 2D prototype</strong>
        <span className="muted">
          React shop · scene-graph pads / minions / sparks
        </span>
        <div className="tabs">
          <button
            type="button"
            className={mode === "r3f" ? "on" : ""}
            onClick={() => setMode("r3f")}
          >
            R3F ortho
          </button>
          <button
            type="button"
            className={mode === "carver" ? "on" : ""}
            onClick={() => setMode("carver")}
          >
            CarverJS 2d
          </button>
        </div>
      </header>

      <p className="note">
        Shop is React, but laid out at 320×180 and integer-scaled like the
        canvas game so type and buttons stay chunky. Extra pads, minions, and
        sparks live in the 2D scene.
      </p>

      <div
        className="frame"
        style={{ width: WIDTH * scale, height: HEIGHT * scale }}
      >
        <div className="stage" style={{ transform: `scale(${scale})` }}>
          <div className="gl">
            {mode === "r3f" ? (
              <R3FBeat
                pads={toys.padUi}
                minions={toys.minions}
                burst={toys.burst}
                onPressPad={toys.pressPad}
              />
            ) : (
              <CarverBeat
                pads={toys.padUi}
                minions={toys.minions}
                burst={toys.burst}
                onPressPad={toys.pressPad}
              />
            )}
          </div>
          <Hud
            snap={snap}
            pressFlashUntil={pressFlashUntil}
            pads={toys.padUi}
            minions={toys.minions}
            onToggle={toggleRun}
            onPress={toys.pressMainAndSpark}
            onBuy={buy}
            onReset={() => {
              if (reset()) toys.resetToys();
            }}
            onHireMinion={toys.hireMinion}
            onUnlockPad={toys.unlockPad}
          />
        </div>
      </div>
    </div>
  );
}
