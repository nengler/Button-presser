import { useMemo } from "react";
import { COLORS } from "../../../src/game/view.ts";

/** Shared beat-ring meshes. Works inside any R3F canvas (raw or Carver `<Game>`). */
export function BeatMeshes({ phase }: { phase: number }) {
  const dist = Math.min(phase, 1 - phase);
  const near = 1 - dist * 2;
  const pulseR = 0.7 + near * 0.25;
  const pipR = 0.08 + near * 0.1;
  const sweep = Math.max(0.001, phase * Math.PI * 2);
  const pulseOpacity = 0.08 + near * 0.22;

  const pulseColor = useMemo(() => COLORS.gold, []);

  return (
    <group>
      <mesh>
        <circleGeometry args={[pulseR, 48]} />
        <meshBasicMaterial
          color={pulseColor}
          transparent
          opacity={pulseOpacity}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <ringGeometry args={[0.88, 0.94, 64]} />
        <meshBasicMaterial color={COLORS.moss} />
      </mesh>
      <mesh rotation={[0, 0, 0]}>
        <ringGeometry args={[0.98, 1.06, 64, 1, -Math.PI / 2, sweep]} />
        <meshBasicMaterial color={COLORS.gold} />
      </mesh>
      <mesh>
        <circleGeometry args={[pipR, 24]} />
        <meshBasicMaterial color={COLORS.goldHot} />
      </mesh>
    </group>
  );
}
