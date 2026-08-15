import type { GameSnapshot } from "../game/Game.ts";
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
  snap: GameSnapshot;
  pressFlashUntil: number;
  onToggle: () => void;
  onPress: () => void;
  onTree: () => void;
}) {
  const flashing = snap.running && performance.now() < pressFlashUntil;
  const result = snap.lastResult;
  const feedback = result
    ? result.grade === "miss"
      ? "MISS"
      : `+${result.points} ${result.grade.toUpperCase()}`
    : snap.running
      ? "..."
      : "ready";

  return (
    <>
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
        <div style={{ color: result ? gradeColor(result.grade) : COLORS.sage }}>
          {feedback}
        </div>
        {result ? (
          <div className="err">
            {result.errorMs > 0 ? "+" : ""}
            {result.errorMs.toFixed(0)}ms
          </div>
        ) : null}
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
    </>
  );
}
