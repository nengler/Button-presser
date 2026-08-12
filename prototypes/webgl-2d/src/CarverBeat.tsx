import { Actor, Game, World } from "@carverjs/core/components";
import { COLORS } from "../../../src/game/view.ts";

/**
 * Same beat visual, expressed as Carver `<Actor>` primitives.
 * Carver's `<Game mode="2d">` is an R3F canvas with an orthographic camera.
 */
export function CarverBeat({ phase }: { phase: number }) {
  const dist = Math.min(phase, 1 - phase);
  const near = 1 - dist * 2;
  const pulseR = 0.7 + near * 0.25;
  const pipR = 0.08 + near * 0.1;
  const sweep = Math.max(0.001, phase * Math.PI * 2);

  return (
    <Game
      mode="2d"
      dpr={1}
      gl={{ antialias: false, alpha: false }}
      style={{ background: COLORS.ink }}
    >
      <World cameraProps2D={{ position: [0, 0, 100], zoom: 70 }}>
        <Actor
          type="primitive"
          shape="circle"
          materialType="basic"
          color={COLORS.gold}
          geometryArgs={[pulseR, 48]}
          materialProps={{
            transparent: true,
            opacity: 0.08 + near * 0.22,
            depthWrite: false,
          }}
        />
        <Actor
          type="primitive"
          shape="ring"
          materialType="basic"
          color={COLORS.moss}
          geometryArgs={[0.88, 0.94, 64]}
        />
        <Actor
          type="primitive"
          shape="ring"
          materialType="basic"
          color={COLORS.gold}
          geometryArgs={[0.98, 1.06, 64, 1, -Math.PI / 2, sweep]}
        />
        <Actor
          type="primitive"
          shape="circle"
          materialType="basic"
          color={COLORS.goldHot}
          geometryArgs={[pipR, 24]}
        />
      </World>
    </Game>
  );
}
