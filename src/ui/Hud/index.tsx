import { useState } from "react";
import type { GameSnapshot } from "../../game/Game.ts";
import { buttonCenter } from "../../game/buttons.ts";
import { COLORS } from "../../game/view.ts";
import { useLerpedScore } from "../hooks/useLerpedScore.ts";
import "./index.css";
import GradePuff from "./GradePuff.tsx";
import { Chip, Puff } from "./types.ts";
import FlyChip from "./Chip.tsx";

function gradeColor(grade: string): string {
  switch (grade) {
    case "perfect":
      return COLORS.perfect;
    case "great":
      return COLORS.great;
    case "good":
      return COLORS.good;
    case "ok":
      return COLORS.ok;
    case "miss":
      return COLORS.miss;
    case "set":
      return COLORS.sage;
    default:
      return COLORS.goldHot;
  }
}

export function Hud({ snap, onShop }: { snap: GameSnapshot; onShop: () => void }) {
  const [chips, setChips] = useState<Chip[]>([]);
  const [puffs, setPuffs] = useState<Puff[]>([]);
  const [pop, setPop] = useState(false);
  const [seenNonce, setSeenNonce] = useState(snap.hitNonce);
  const [seenScore, setSeenScore] = useState(function () {
    return Math.floor(snap.score);
  });

  const total = Math.floor(snap.score);
  let pending = chips.reduce(function (sum, chip) {
    return sum + chip.pts;
  }, 0);

  if (total < seenScore) {
    pending = 0;
    setSeenScore(total);
    setSeenNonce(snap.hitNonce);
    setChips([]);
  } else if (snap.hitNonce !== seenNonce) {
    const delta = total - seenScore;
    setSeenNonce(snap.hitNonce);
    setSeenScore(total);
    const result = snap.lastResult;
    if (result) {
      setPuffs(function (list) {
        if (
          list.some(function (p) {
            return p.id === snap.hitNonce;
          })
        ) {
          return list;
        }
        return [
          ...list,
          {
            id: snap.hitNonce,
            label: result.grade.toUpperCase(),
            color: gradeColor(result.grade),
            x: snap.hitX - 18,
            y: snap.hitY - 16,
          },
        ];
      });
    }
    if (delta > 0) {
      pending += delta;
      setChips(function (list) {
        if (
          list.some(function (c) {
            return c.id === snap.hitNonce;
          })
        ) {
          return list;
        }
        return [
          ...list,
          {
            id: snap.hitNonce,
            pts: delta,
            color: result && result.points === delta ? gradeColor(result.grade) : COLORS.goldHot,
            x0: snap.hitX - 8,
            y0: snap.hitY - 4,
          },
        ];
      });
    }
  } else if (total !== seenScore) {
    setSeenScore(total);
  }

  const scoreText = useLerpedScore(total - pending);

  return (
    <>
      <button type="button" className="open-shop" onClick={onShop}>
        SHOP
      </button>

      <div className="stats">
        <span
          className={`stat gold${pop ? " pop" : ""}`}
          onAnimationEnd={function (e) {
            if (e.animationName === "stat-nudge") setPop(false);
          }}
        >
          SCR {scoreText}
        </span>
        {snap.stars > 0 ? <span className="stat">STAR {snap.stars}</span> : null}
      </div>

      {snap.buttonStreaks.map(function (button, i) {
        if (button.streak <= 0) return null;
        const pos = buttonCenter(i, snap.buttonStreaks.length);
        return (
          <span key={button.id} className="btn-streak" style={{ left: pos.x, top: pos.y + 36 }}>
            {button.streak}
          </span>
        );
      })}

      {puffs.map(function (puff) {
        return (
          <GradePuff
            key={puff.id}
            puff={puff}
            onDone={function (id) {
              setPuffs(function (list) {
                return list.filter(function (p) {
                  return p.id !== id;
                });
              });
            }}
          />
        );
      })}
      {chips.map(function (chip) {
        return (
          <FlyChip
            key={chip.id}
            chip={chip}
            onLand={function (id) {
              setChips(function (list) {
                return list.filter(function (c) {
                  return c.id !== id;
                });
              });
              setPop(true);
            }}
          />
        );
      })}
    </>
  );
}
