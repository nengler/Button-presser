import { COLORS } from "../game/view.ts";

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
      return COLORS.sage;
  }
}

export function Hud({
  snap,
  pressFlashUntil,
  onToggle,
  onPress,
  onTree,
}: {
  snap: {
    score: number;
    streak: number;
    bestStreak: number;
    running: boolean;
    lastResult: {
      grade: string;
      points: number;
      errorMs: number;
    } | null;
  };
  pressFlashUntil: number;
  onToggle: () => void;
  onPress: () => void;
  onTree: () => void;
}) {
  const flashing = snap.running && performance.now() < pressFlashUntil;
  const feedback = snap.lastResult
    ? snap.lastResult.grade === "miss"
      ? "MISS"
      : `+${snap.lastResult.points} ${snap.lastResult.grade.toUpperCase()}`
    : snap.running
      ? "..."
      : "ready";
  const feedbackColor = snap.lastResult
    ? gradeColor(snap.lastResult.grade)
    : COLORS.sage;
  const err = snap.lastResult
    ? `${snap.lastResult.errorMs > 0 ? "+" : ""}${snap.lastResult.errorMs.toFixed(0)}ms`
    : null;

  return (
    <div className="hud">
      <div className="brand">
        <div className="title">BUTTON PRESSER</div>
        <div className="tag">hit the beat</div>
      </div>

      <button type="button" className="tree-open" onClick={onTree}>
        TREE
      </button>

      <div className="stats">
        <span className="gold">SCR {Math.floor(snap.score)}</span>
        <span>STR {snap.streak}</span>
        <span className="sage">BEST {snap.bestStreak}</span>
      </div>

      <div className="feedback">
        <div style={{ color: feedbackColor }}>{feedback}</div>
        {err ? <div className="err">{err}</div> : null}
      </div>

      <div className="controls">
        <button type="button" className="btn" onClick={onToggle}>
          {snap.running ? "PAUSE" : "START"}
        </button>
        <button
          type="button"
          className={`btn press${flashing ? " flash" : ""}`}
          disabled={!snap.running}
          onClick={onPress}
        >
          PRESS
        </button>
        <div className="hint">SPACE / click ring</div>
      </div>
    </div>
  );
}
