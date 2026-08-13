import { Game, World } from "@carverjs/core/components";
import { COLORS } from "../../../src/game/view.ts";
import { Playfield } from "./Playfield.tsx";
import type { Burst, PadRuntime } from "./useFutureToys.ts";

/** Carver `<Game mode="2d">` is an R3F canvas; the playfield is the same scene graph. */
export function CarverBeat({
  pads,
  minions,
  burst,
  onPressPad,
}: {
  pads: PadRuntime[];
  minions: number;
  burst: Burst;
  onPressPad: (id: string) => void;
}) {
  return (
    <Game
      mode="2d"
      dpr={1}
      gl={{ antialias: false, alpha: false }}
      style={{ background: COLORS.ink }}
    >
      <World cameraProps2D={{ position: [0, 0, 100], zoom: 70 }}>
        <Playfield
          pads={pads}
          minions={minions}
          burst={burst}
          onPressPad={onPressPad}
        />
      </World>
    </Game>
  );
}
