import { useEffect, useState } from "react";
import { CarverBeat } from "./CarverBeat.tsx";
import { Hud } from "./Hud.tsx";
import { R3FBeat } from "./R3FBeat.tsx";
import { useButtonPresser } from "./useButtonPresser.ts";
import { useFutureToys } from "./useFutureToys.ts";
import "./styles.css";

type Mode = "r3f" | "carver";

export function App() {
  const [mode, setMode] = useState<Mode>("r3f");
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
        Shop items are React buttons. The world is a 2D scene: extra pads are
        just more rings with their own timers, minions orbit and hit leftover
        beats, sparks fire on a press. Same playfield in R3F or Carver — Carver
        is the canvas wrapper.
      </p>

      <div className="frame">
        <div className="stage">
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
