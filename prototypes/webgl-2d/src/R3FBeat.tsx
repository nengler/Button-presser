import { Canvas } from "@react-three/fiber";
import { COLORS } from "../../../src/game/view.ts";
import { Playfield } from "./Playfield.tsx";
import type { Burst, PadRuntime } from "./useFutureToys.ts";

export function R3FBeat({
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
    <Canvas
      orthographic
      camera={{ position: [0, 0, 10], zoom: 23 }}
      gl={{ antialias: false, alpha: false }}
      dpr={1}
      flat
      onCreated={({ gl }) => {
        gl.domElement.style.imageRendering = "pixelated";
      }}
    >
      <color attach="background" args={[COLORS.ink]} />
      <Playfield
        pads={pads}
        minions={minions}
        burst={burst}
        onPressPad={onPressPad}
      />
    </Canvas>
  );
}
