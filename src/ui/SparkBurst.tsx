import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { COLORS } from "../game/view.ts";
import type { Burst } from "./useFutureToys.ts";

const POOL = 40;

type Speck = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
};

export function SparkBurst({ burst }: { burst: Burst }) {
  const meshRefs = useRef<(Mesh | null)[]>(Array.from({ length: POOL }, () => null));
  const specks = useRef<Speck[]>([]);

  useEffect(() => {
    if (burst.nonce === 0) return;
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 1.2 + Math.random() * 3.4;
      specks.current.push({
        x: burst.x,
        y: burst.y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 1,
        max: 0.45 + Math.random() * 0.35,
      });
    }
    if (specks.current.length > POOL) {
      specks.current.splice(0, specks.current.length - POOL);
    }
  }, [burst]);

  useFrame((_, dt) => {
    const list = specks.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i]!;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt / p.max;
      if (p.life <= 0) list.splice(i, 1);
    }
    for (let i = 0; i < POOL; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      const p = list[i];
      if (!p) {
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      mesh.position.set(p.x, p.y, 0.2);
      const s = 0.04 + p.life * 0.08;
      mesh.scale.setScalar(s);
    }
  });

  return (
    <group>
      {Array.from({ length: POOL }, (_, i) => (
        <mesh
          key={i}
          ref={(node) => {
            meshRefs.current[i] = node;
          }}
          visible={false}
        >
          <circleGeometry args={[1, 8]} />
          <meshBasicMaterial color={COLORS.goldHot} />
        </mesh>
      ))}
    </group>
  );
}
