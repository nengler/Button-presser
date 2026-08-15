import { useState } from "react";
import type { GameSnapshot } from "../game/Game.ts";
import type { UpgradeId } from "../game/types.ts";
import {
  ICONS,
  NODE,
  NODE_TINT,
  TREE_NODES,
  TREE_STARS,
  nodeProgress,
  parentsOwned,
} from "./upgradeTree.ts";
import type { TreeNodeId } from "./upgradeTree.ts";
import { isExtraPadId } from "../game/pads.ts";
import { COLORS } from "../game/view.ts";
import { useLerpedScore } from "./useLerpedScore.ts";

const LOCK = COLORS.moss;
const SELECT = COLORS.foam;

function PixelIcon({ id, color }: { id: string; color: string }) {
  const rows = ICONS[id];
  if (!rows) return null;
  return (
    <div className="pix">
      {rows.map((row, y) =>
        row.split("").map((ch, x) =>
          ch === "X" ? (
            <i
              key={`${x}-${y}`}
              style={{ left: x, top: y, background: color }}
            />
          ) : null,
        ),
      )}
    </div>
  );
}

function elbow(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): { x: number; y: number; w: number; h: number; axis: "h" | "v" }[] {
  const thick = 3;
  const hx = Math.min(ax, bx);
  const hw = Math.abs(bx - ax) + thick;
  const vy = Math.min(ay, by);
  const vh = Math.abs(by - ay) + thick;
  return [
    { x: hx, y: ay - 1, w: hw, h: thick, axis: "h" },
    { x: bx - 1, y: vy, w: thick, h: vh, axis: "v" },
  ];
}

function tintOf(id: string): string {
  return NODE_TINT[id] ?? COLORS.gold;
}

export function UpgradeTree({
  snap,
  onBack,
  onBuyUpgrade,
  onHireStar,
  onUnlockPad,
  onReset,
}: {
  snap: GameSnapshot;
  onBack: () => void;
  onBuyUpgrade: (id: UpgradeId) => void;
  onHireStar: () => void;
  onUnlockPad: (id: string) => void;
  onReset: () => void;
}) {
  const progress = Object.fromEntries(
    TREE_NODES.map((n) => [
      n.id,
      nodeProgress(n.id, snap.upgrades, snap.stars, snap.unlockedPads),
    ]),
  ) as Record<TreeNodeId, ReturnType<typeof nodeProgress>>;

  const [selected, setSelected] = useState<TreeNodeId>("warmup");
  const node = TREE_NODES.find((n) => n.id === selected)!;
  const prog = progress[selected];
  const pathOpen = parentsOwned(node, progress);
  const canBuy =
    pathOpen && !prog.maxed && prog.cost !== null && snap.score >= prog.cost;
  const scoreText = useLerpedScore(snap.score);

  const buy = () => {
    if (!canBuy) return;
    if (selected === "star") onHireStar();
    else if (isExtraPadId(selected)) onUnlockPad(selected);
    else onBuyUpgrade(selected);
  };

  const segs = TREE_NODES.flatMap((n) => {
    const childOpen = parentsOwned(n, progress);
    return n.parents.flatMap((pid) => {
      const p = TREE_NODES.find((x) => x.id === pid)!;
      const half = NODE / 2;
      const ready = Boolean(progress[pid]?.owned);
      const lit = ready && (progress[n.id]?.owned || childOpen);
      const tint = tintOf(n.id);
      return elbow(p.x + half, p.y + half, n.x + half, n.y + half).map(
        (box, i) => ({
          ...box,
          key: `${pid}-${n.id}-${i}`,
          lit,
          tint,
        }),
      );
    });
  });

  return (
    <div className="tree">
      <div className="tree-head">
        <span className="tree-brand">TREE</span>
        <span className="gold">SCR {scoreText}</span>
        <button type="button" className="reset" onClick={onReset}>
          reset
        </button>
        <button type="button" className="btn tree-back" onClick={onBack}>
          BACK
        </button>
      </div>

      <div className="tree-map">
        {TREE_STARS.map((s, i) => (
          <i
            key={`st-${i}`}
            className={`tree-star d${s.d}`}
            style={{ left: s.x, top: s.y, background: s.c }}
          />
        ))}
        {segs.map((s) => (
          <div
            key={s.key}
            className={`tree-wire ${s.axis}${s.lit ? " lit" : ""}`}
            style={{
              left: s.x,
              top: s.y,
              width: s.w,
              height: s.h,
              background: s.lit ? s.tint : LOCK,
            }}
          >
            {s.lit ? (
              <>
                <span
                  className="tree-wire-core"
                  style={{
                    background: SELECT,
                    left: s.axis === "h" ? 1 : 1,
                    top: s.axis === "h" ? 1 : 1,
                    width: s.axis === "h" ? Math.max(0, s.w - 2) : 1,
                    height: s.axis === "v" ? Math.max(0, s.h - 2) : 1,
                  }}
                />
                <span className="tree-spark" />
              </>
            ) : null}
          </div>
        ))}
        {TREE_NODES.map((n) => {
          const p = progress[n.id];
          const open = parentsOwned(n, progress);
          const isSel = selected === n.id;
          const tint = tintOf(n.id);
          const buyable =
            open &&
            !p.maxed &&
            p.cost !== null &&
            snap.score >= p.cost;
          let border: string = LOCK;
          let fill: string = COLORS.ink;
          let icon: string = LOCK;
          if (p.owned) {
            border = tint;
            fill = tint;
            icon = COLORS.ink;
          } else if (open) {
            border = tint;
            fill = COLORS.ink2;
            icon = tint;
          }
          if (isSel) border = SELECT;
          const cls = [
            "tree-node",
            p.owned ? "owned" : "",
            open && !p.owned ? "open" : "",
            isSel ? "sel" : "",
            buyable ? "buyable" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              type="button"
              key={n.id}
              className={cls}
              style={{
                left: n.x,
                top: n.y,
                borderColor: border,
                background: fill,
                color: tint,
              }}
              onClick={() => setSelected(n.id)}
            >
              {isSel ? <span className="tree-sel-ring" /> : null}
              <PixelIcon id={n.id} color={icon} />
            </button>
          );
        })}
      </div>

      <div className={`tree-inspect${canBuy ? " hot" : ""}`}>
        <div>
          <div className="tree-title">
            {node.title}{" "}
            <span className="lvl">
              {prog.level}/{prog.max}
            </span>
          </div>
          <div className="tree-blurb">
            {!pathOpen ? "locked — buy the path first" : node.blurb}
          </div>
        </div>
        <button
          type="button"
          className="btn press tree-buy"
          disabled={!canBuy}
          onClick={buy}
        >
          {prog.maxed ? "MAX" : `BUY ${prog.cost}`}
        </button>
      </div>
    </div>
  );
}
