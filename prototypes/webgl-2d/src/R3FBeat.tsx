import { Canvas } from "@react-three/fiber";
import { COLORS } from "../../../src/game/view.ts";
import { BeatMeshes } from "./BeatMeshes.tsx";

export function R3FBeat({ phase }: { phase: number }) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 10], zoom: 70 }}
      gl={{ antialias: false, alpha: false }}
      dpr={1}
    >
      <color attach="background" args={[COLORS.ink]} />
      <BeatMeshes phase={phase} />
    </Canvas>
  );
}
