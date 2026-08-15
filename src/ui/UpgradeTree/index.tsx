import { useState } from "react";
import type { GameSnapshot, UpgradeId } from "../../game/types.ts";
import { UPGRADE_DEFS } from "../../game/upgrades.ts";
import {
  ICONS,
  NODE,
  NODE_TINT,
  nodeProgress,
  parentsOwned,
  TREE_NODES,
  TreeNodeId,
} from "./index.ts";
import { isExtraButtonId } from "../../game/buttons.ts";
import { COLORS, HEIGHT, WIDTH } from "../../game/view.ts";
import { useLerpedScore } from "../hooks/useLerpedScore.ts";
import { drawSparks, spawnSparks, type Speck, stepSparks } from "../sparks.ts";
import "./index.css";

const LOCK = COLORS.moss;
const PATH = COLORS.gold;
const SELECT = COLORS.foam;

const NODE_DEPTH = {} as Record<TreeNodeId, number>;
let MAX_DEPTH = 0;
for (const n of TREE_NODES) {
  let d = 0;
  for (const pid of n.parents) {
    const pd = NODE_DEPTH[pid] ?? 0;
    if (pd + 1 > d) d = pd + 1;
  }
  NODE_DEPTH[n.id] = d;
  if (d > MAX_DEPTH) MAX_DEPTH = d;
}

/** Longest shop enter: last node delay + node duration. */
export const SHOP_IN_MS = MAX_DEPTH * 70 + 370;
const HALF = NODE / 2;
const MAP_H = HEIGHT - 50;

type Props = {
  leaving: boolean;
  onBack: () => void;
  onBuyUpgrade: (id: UpgradeId) => void;
  onHireStar: () => void;
  onReset: () => void;
  onDebugCash: () => void;
  onUnlockButton: (id: string) => void;
  snap: GameSnapshot;
};

export function Shop({
  leaving,
  onBack,
  onBuyUpgrade,
  onHireStar,
  onReset,
  onDebugCash,
  onUnlockButton,
  snap,
}: Props) {
  const progress = Object.fromEntries(
    TREE_NODES.map(function (n) {
      return [n.id, nodeProgress(n.id, snap.upgrades, snap.stars, snap.unlockedPads)];
    }),
  ) as Record<TreeNodeId, ReturnType<typeof nodeProgress>>;

  const [selected, setSelected] = useState<TreeNodeId>("bonusHits");
  const [shine, setShine] = useState<Partial<Record<TreeNodeId, "buy" | "open">>>({});
  const node = TREE_NODES.find(function (n) {
    return n.id === selected;
  })!;
  const prog = progress[selected];
  const pathOpen = parentsOwned(node, progress);
  const canBuy = pathOpen && !prog.maxed && prog.cost !== null && snap.score >= prog.cost;
  const scoreText = useLerpedScore(snap.score);

  function buy() {
    if (!canBuy) return;
    const nextProgress = {
      ...progress,
      [selected]: { ...prog, level: prog.level + 1, owned: true },
    };
    const lit: Partial<Record<TreeNodeId, "buy" | "open">> = { [selected]: "buy" };
    for (const n of TREE_NODES) {
      if (n.id === selected) continue;
      if (parentsOwned(n, nextProgress) && !parentsOwned(n, progress)) lit[n.id] = "open";
    }
    setShine(lit);
    for (const n of TREE_NODES) {
      const kind = lit[n.id];
      if (!kind) continue;
      shopFx?.burst(n.x + HALF, n.y + HALF, kind === "buy");
    }
    if (selected === "star") onHireStar();
    else if (isExtraButtonId(selected)) onUnlockButton(selected);
    else onBuyUpgrade(selected);
  }

  const wires = TREE_NODES.flatMap(function (n) {
    const childOpen = parentsOwned(n, progress);
    return n.parents.map(function (pid) {
      const p = TREE_NODES.find(function (x) {
        return x.id === pid;
      })!;
      const ready = Boolean(progress[pid]?.owned);
      return {
        depth: NODE_DEPTH[n.id] ?? 0,
        key: `${pid}-${n.id}`,
        lit: ready && (progress[n.id]?.owned || childOpen),
        path: wirePath(p, n),
      };
    });
  });

  return (
    <div className={`shop${leaving ? " leave" : ""}`} style={{ ["--maxd" as string]: MAX_DEPTH }}>
      <div className="shop-head">
        <span className="shop-brand">SHOP</span>
        <span className="gold">SCR {scoreText}</span>
        <button className="reset" onClick={onReset} type="button">
          reset
        </button>
        {import.meta.env.DEV ? (
          <button className="reset" onClick={onDebugCash} type="button">
            cash
          </button>
        ) : null}
        <button className="shop-back" onClick={onBack} type="button">
          BACK
        </button>
      </div>

      <div className="shop-map">
        <svg aria-hidden="true" className="shop-wires">
          {wires.map(function (w) {
            return (
              <g key={w.key} style={{ ["--d" as string]: w.depth }}>
                <path className="shop-wire-ink" d={w.path} pathLength={1} />
                <path
                  className="shop-wire-fill"
                  d={w.path}
                  pathLength={1}
                  stroke={w.lit ? PATH : LOCK}
                />
                {w.lit ? <path className="shop-wire-core" d={w.path} pathLength={1} /> : null}
              </g>
            );
          })}
        </svg>
        {wires.map(function (w) {
          if (!w.lit) return null;
          return (
            <span
              className="shop-spark"
              key={`${w.key}-spark`}
              style={{
                offsetPath: `path("${w.path}")`,
                ["--d" as string]: w.depth,
              }}
            />
          );
        })}
        {TREE_NODES.map(function (n) {
          const p = progress[n.id];
          const open = parentsOwned(n, progress);
          const isSel = selected === n.id;
          const tint = tintOf(n.id);
          const buyable = open && !p.maxed && p.cost !== null && snap.score >= p.cost;
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
            "shop-node",
            p.owned ? "owned" : "",
            open && !p.owned ? "open" : "",
            isSel ? "sel" : "",
            buyable ? "buyable" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              className={cls}
              key={n.id}
              onClick={function () {
                setSelected(n.id);
              }}
              style={{
                background: fill,
                borderColor: border,
                color: tint,
                left: n.x,
                top: n.y,
                ["--d" as string]: NODE_DEPTH[n.id],
              }}
              type="button"
            >
              {isSel ? <span className="shop-sel-ring" /> : null}
              {shine[n.id] ? (
                <span
                  className={`shop-shine ${shine[n.id]}`}
                  onAnimationEnd={function (e) {
                    if (e.animationName !== "shop-shine") return;
                    setShine(function (cur) {
                      if (!cur[n.id]) return cur;
                      const next = { ...cur };
                      delete next[n.id];
                      return next;
                    });
                  }}
                />
              ) : null}
              <PixelIcon color={icon} id={n.id} />
            </button>
          );
        })}
        <canvas className="shop-fx" height={MAP_H} ref={bindShopFx} width={WIDTH} />
      </div>

      <div className={`shop-inspect${canBuy ? " hot" : ""}`}>
        <div>
          <div className="shop-title">
            {node.title}{" "}
            <span className="lvl">
              {prog.level}/{prog.max}
            </span>
          </div>
          <div className="shop-blurb">
            {!pathOpen
              ? "locked — buy the path first"
              : selected in UPGRADE_DEFS
                ? UPGRADE_DEFS[selected as UpgradeId].effect(prog.level)
                : node.blurb}
          </div>
        </div>
        <button className="shop-buy" disabled={!canBuy} onClick={buy} type="button">
          {prog.maxed ? "MAX" : `BUY ${prog.cost}`}
        </button>
      </div>
    </div>
  );
}

function wirePath(
  parent: { x: number; y: number },
  child: { x: number; y: number },
): string {
  const px = parent.x + HALF;
  const py = parent.y + HALF;
  const cx = child.x + HALF;
  const cy = child.y + HALF;
  if (parent.x === child.x) {
    const y0 = child.y < parent.y ? parent.y : parent.y + NODE;
    const y1 = child.y < parent.y ? child.y + NODE : child.y;
    return `M ${px} ${y0} L ${cx} ${y1}`;
  }
  const x0 = child.x > parent.x ? parent.x + NODE : parent.x;
  const x1 = child.x > parent.x ? child.x : child.x + NODE;
  return `M ${x0} ${py} L ${x1} ${cy}`;
}

function PixelIcon({ color, id }: { color: string; id: string }) {
  const rows = ICONS[id];
  if (!rows) return null;
  return (
    <div className="pix">
      {rows.map(function (row, y) {
        return row.split("").map(function (ch, x) {
          return ch === "X" ? (
            <i key={`${x}-${y}`} style={{ background: color, left: x, top: y }} />
          ) : null;
        });
      })}
    </div>
  );
}

function tintOf(id: string): string {
  return NODE_TINT[id] ?? COLORS.gold;
}

const MAX_DT = 0.05;

type BurstFx = {
  burst: (x: number, y: number, heavy: boolean) => void;
  destroy: () => void;
};

function createBurstFx(canvas: HTMLCanvasElement): BurstFx {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (ctx) ctx.imageSmoothingEnabled = false;
  const specks: Speck[] = [];
  let raf = 0;
  let last = 0;

  function burst(x: number, y: number, heavy: boolean) {
    if (!ctx) return;
    spawnSparks(specks, x, y, heavy ? 18 : 8);
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }

  function tick(now: number) {
    if (!ctx) return;
    const dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
    last = now;
    stepSparks(specks, dt);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSparks(ctx, specks);
    if (specks.length) raf = requestAnimationFrame(tick);
    else raf = 0;
  }

  function destroy() {
    cancelAnimationFrame(raf);
    raf = 0;
    specks.length = 0;
  }

  return { burst, destroy };
}

let shopFx: BurstFx | null = null;

function bindShopFx(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const api = createBurstFx(canvas);
  shopFx = api;
  return function () {
    api.destroy();
    if (shopFx === api) shopFx = null;
  };
}
