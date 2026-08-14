import { useState } from "react";
import type { GameSnapshot } from "../game/Game.ts";
import type { UpgradeId } from "../game/types.ts";
import {
  ICONS,
  NODE,
  TREE_NODES,
  nodeProgress,
  parentsOwned,
} from "./upgradeTree.ts";
import type { TreeNodeId } from "./upgradeTree.ts";
import { isExtraPadId } from "../game/pads.ts";

const LINE = "#3dff4a";
const LOCK = "#6b5340";
const SELECT = "#7ec8ff";
const FACE = "#d8d8d8";
const FACE_DIM = "#7a6a58";

function PixelIcon({ id, dim }: { id: string; dim: boolean }) {
  const rows = ICONS[id];
  if (!rows) return null;
  const color = dim ? FACE_DIM : FACE;
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
): { x: number; y: number; w: number; h: number }[] {
  const thick = 3;
  const hx = Math.min(ax, bx);
  const hw = Math.abs(bx - ax) + thick;
  const vy = Math.min(ay, by);
  const vh = Math.abs(by - ay) + thick;
  return [
    { x: hx, y: ay - 1, w: hw, h: thick },
    { x: bx - 1, y: vy, w: thick, h: vh },
  ];
}

export function UpgradeTree({
  snap,
  onBack,
  onBuyUpgrade,
  onHireMinion,
  onUnlockPad,
  onReset,
}: {
  snap: GameSnapshot;
  onBack: () => void;
  onBuyUpgrade: (id: UpgradeId) => void;
  onHireMinion: () => void;
  onUnlockPad: (id: string) => void;
  onReset: () => void;
}) {
  const progress = Object.fromEntries(
    TREE_NODES.map((n) => [
      n.id,
      nodeProgress(n.id, snap.upgrades, snap.minions, snap.unlockedPads),
    ]),
  ) as Record<TreeNodeId, ReturnType<typeof nodeProgress>>;

  const [selected, setSelected] = useState<TreeNodeId>("warmup");
  const node = TREE_NODES.find((n) => n.id === selected)!;
  const prog = progress[selected];
  const pathOpen = parentsOwned(node, progress);
  const canBuy =
    pathOpen && !prog.maxed && prog.cost !== null && snap.score >= prog.cost;

  const buy = () => {
    if (!canBuy) return;
    if (selected === "minion") onHireMinion();
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
      return elbow(p.x + half, p.y + half, n.x + half, n.y + half).map(
        (box, i) => ({
          ...box,
          key: `${pid}-${n.id}-${i}`,
          lit,
        }),
      );
    });
  });

  return (
    <div className="tree">
      <div className="tree-head">
        <span>TREE</span>
        <span className="gold">SCR {Math.floor(snap.score)}</span>
        <button type="button" className="reset" onClick={onReset}>
          reset
        </button>
        <button type="button" className="btn tree-back" onClick={onBack}>
          BACK
        </button>
      </div>

      <div className="tree-map">
        {segs.map((s) => (
          <div
            key={s.key}
            className="tree-wire"
            style={{
              left: s.x,
              top: s.y,
              width: s.w,
              height: s.h,
              background: s.lit ? LINE : LOCK,
            }}
          />
        ))}
        {TREE_NODES.map((n) => {
          const p = progress[n.id];
          const open = parentsOwned(n, progress);
          const isSel = selected === n.id;
          let border = LOCK;
          if (isSel) border = SELECT;
          else if (p.owned || open) border = LINE;
          return (
            <button
              type="button"
              key={n.id}
              className="tree-node"
              style={{
                left: n.x,
                top: n.y,
                borderColor: border,
                background: p.owned ? "#101810" : "#050505",
              }}
              onClick={() => setSelected(n.id)}
            >
              <PixelIcon id={n.id} dim={!open && !p.owned} />
            </button>
          );
        })}
      </div>

      <div className="tree-inspect">
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
