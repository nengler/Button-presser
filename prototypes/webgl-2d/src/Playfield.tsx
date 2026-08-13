import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { COLORS } from "../../../src/game/view.ts";
import { BeatMeshes } from "./BeatMeshes.tsx";
import { SparkBurst } from "./SparkBurst.tsx";
import { padById } from "./futureShop.ts";
import type { Burst, PadRuntime } from "./useFutureToys.ts";

function Minions({
  stationId,
  count,
}: {
  stationId: string;
  count: number;
}) {
  const group = useRef<Group>(null);
  const pad = padById(stationId);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < g.children.length; i++) {
      const child = g.children[i];
      if (!child) continue;
      const angle = (count === 0 ? 0 : (i / count) * Math.PI * 2) + t * 0.85;
      const r = 1.38;
      child.position.set(pad.x + Math.cos(angle) * r, pad.y + Math.sin(angle) * r, 0.15);
    }
  });

  return (
    <group ref={group}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i}>
          <circleGeometry args={[0.11, 10]} />
          <meshBasicMaterial color={COLORS.foam} />
        </mesh>
      ))}
    </group>
  );
}

export function Playfield({
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
  const stations = pads.map((p) => p.id);
  const n = Math.max(stations.length, 1);

  return (
    <group>
      {pads.map((pad) => {
        const def = padById(pad.id);
        return (
          <group key={pad.id} position={[def.x, def.y, 0]}>
            <BeatMeshes phase={pad.phase} color={def.color} />
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onPressPad(pad.id);
              }}
              onPointerOver={() => {
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "default";
              }}
            >
              <circleGeometry args={[1.2, 24]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
      {stations.map((id, i) => {
        const assigned = [...Array(minions).keys()].filter((m) => m % n === i).length;
        if (assigned === 0) return null;
        return <Minions key={id} stationId={id} count={assigned} />;
      })}
      <SparkBurst burst={burst} />
    </group>
  );
}
