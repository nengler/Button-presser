import { useState } from "react";
import { CarverBeat } from "./CarverBeat.tsx";
import { Hud } from "./Hud.tsx";
import { R3FBeat } from "./R3FBeat.tsx";
import { useButtonPresser } from "./useButtonPresser.ts";
import "./styles.css";

type Mode = "r3f" | "carver";

export function App() {
  const [mode, setMode] = useState<Mode>("r3f");
  const { snap, phase, pressFlashUntil, press, toggleRun, buy, reset } =
    useButtonPresser();

  return (
    <div className="page">
      <header className="bar">
        <strong>WebGL 2D prototype</strong>
        <span className="muted">same Game.ts — HTML HUD + beat ring in WebGL</span>
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
        {mode === "r3f"
          ? "R3F: one orthographic Canvas and four meshes. Hover/click on the HUD is normal DOM — no hit-testing math."
          : "CarverJS: <Game mode=\"2d\"> wraps the same R3F canvas. Actors are typed primitives; the shop is still HTML (Carver’s own examples do this too)."}
      </p>

      <div className="frame">
        <div className="stage">
          <div className="gl">
            {mode === "r3f" ? (
              <R3FBeat phase={phase} />
            ) : (
              <CarverBeat phase={phase} />
            )}
          </div>
          <Hud
            snap={snap}
            pressFlashUntil={pressFlashUntil}
            onToggle={toggleRun}
            onPress={press}
            onBuy={buy}
            onReset={reset}
          />
        </div>
      </div>
    </div>
  );
}
