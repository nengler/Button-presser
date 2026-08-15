import { useCallback, useEffect, useRef, useState } from "react";
import type { GameSnapshot } from "../game/Game.ts";
import { COLORS } from "../game/view.ts";

const FLY_MS = 480;
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

function FlyChip({
  chip,
  onLand,
}: {
  chip: Chip;
  onLand: (id: number, pts: number) => void;
}) {
  const [u, setU] = useState(0);

  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    let landed = false;
    const tick = (now: number) => {
      const next = Math.min(1, (now - t0) / FLY_MS);
      setU(next);
      if (next < 1) raf = requestAnimationFrame(tick);
      else if (!landed) {
        landed = true;
        onLand(chip.id, chip.pts);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [chip.id, chip.pts, onLand]);

  const e = 1 - (1 - u) ** 3;
  return (
    <div
      className="score-chip"
      style={{
        left: chip.x0 + (SCORE_X - chip.x0) * e,
        top: chip.y0 + (SCORE_Y - chip.y0) * e,
        color: chip.color,
        opacity: 1 - e * 0.2,
      }}
    >
      +{chip.pts}
    </div>
  );
}

export function Hud({
  snap,
  onTree,
}: {
  snap: GameSnapshot;
  onTree: () => void;
}) {
  const [shown, setShown] = useState(() => Math.floor(snap.score));
  const [pop, setPop] = useState(false);
  const [chips, setChips] = useState<Chip[]>([]);
  const shownRef = useRef(shown);
  const pendingRef = useRef(0);
  const hitNonceRef = useRef(snap.hitNonce);
  const chipAlive = useRef(new Set<number>());
  const nextId = useRef(1);
  shownRef.current = shown;

  useEffect(() => {
    const total = Math.floor(snap.score);
    const tracked = shownRef.current + pendingRef.current;
    if (total < tracked) {
      pendingRef.current = 0;
      chipAlive.current.clear();
      setChips([]);
      shownRef.current = total;
      setShown(total);
      return;
    }
    const delta = total - tracked;
    if (delta <= 0) return;
    pendingRef.current += delta;
    const fromHit = snap.hitNonce !== hitNonceRef.current;
    hitNonceRef.current = snap.hitNonce;
    if (!fromHit) {
      pendingRef.current -= delta;
      shownRef.current += delta;
      setShown(shownRef.current);
      return;
    }
    const color =
      snap.lastResult && snap.lastResult.points === delta
        ? gradeColor(snap.lastResult.grade)
        : COLORS.goldHot;
    const id = nextId.current++;
    chipAlive.current.add(id);
    setChips((list) => [
      ...list,
      {
        id,
        pts: delta,
        color,
        x0: snap.hitX - 8,
        y0: snap.hitY - 4,
      },
    ]);
  }, [snap.score, snap.hitNonce, snap.hitX, snap.hitY, snap.lastResult]);

  const onLand = useCallback((id: number, pts: number) => {
    if (!chipAlive.current.delete(id)) return;
    pendingRef.current = Math.max(0, pendingRef.current - pts);
    shownRef.current += pts;
    setShown(shownRef.current);
    setChips((list) => list.filter((c) => c.id !== id));
    setPop(true);
    window.setTimeout(() => setPop(false), 140);
  }, []);

  return (
    <>
      <button type="button" className="tree-open" onClick={onTree}>
        TREE
      </button>

      <div className="stats">
        <span className={`gold${pop ? " pop" : ""}`}>SCR {shown}</span>
        <span>STR {snap.streak}</span>
        <span className="sage">BEST {snap.bestStreak}</span>
      </div>

      {chips.map((chip) => (
        <FlyChip key={chip.id} chip={chip} onLand={onLand} />
      ))}
    </>
  );
}
