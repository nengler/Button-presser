import { useState, type CSSProperties } from "react";
import type { GameSnapshot } from "../game/Game.ts";
import { COLORS } from "../game/view.ts";
import { useLerpedScore } from "./hooks/useLerpedScore.ts";

const SCORE_X = 10;
const SCORE_Y = 6;

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

type Chip = {
  id: number;
  pts: number;
  color: string;
  x0: number;
  y0: number;
};

type Puff = {
  id: number;
  label: string;
  color: string;
  x: number;
  y: number;
};

function FlyChip({ chip, onLand }: { chip: Chip; onLand: (id: number) => void }) {
  const style: CSSProperties & { "--x0": string; "--y0": string; "--x1": string; "--y1": string } =
    {
      color: chip.color,
      "--x0": `${chip.x0}px`,
      "--y0": `${chip.y0}px`,
      "--x1": `${SCORE_X}px`,
      "--y1": `${SCORE_Y}px`,
    };
  return (
    <div
      className="score-chip"
      style={style}
      onAnimationEnd={function () {
        onLand(chip.id);
      }}
    >
      +{chip.pts}
    </div>
  );
}

function GradePuff({ puff, onDone }: { puff: Puff; onDone: (id: number) => void }) {
  return (
    <div
      className="grade-puff"
      style={{ left: puff.x, top: puff.y, color: puff.color }}
      onAnimationEnd={function () {
        onDone(puff.id);
      }}
    >
      {puff.label}
    </div>
  );
}

export function Hud({ snap, onTree }: { snap: GameSnapshot; onTree: () => void }) {
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
      <button type="button" className="tree-open" onClick={onTree}>
        TREE
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
        <span key={snap.streak} className="stat nudge">
          STR {snap.streak}
        </span>
        {snap.stars > 0 ? <span className="stat">STAR {snap.stars}</span> : null}
      </div>

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
