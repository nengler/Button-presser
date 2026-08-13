import { UPGRADE_DEFS } from "../../../src/game/upgrades.ts";
import type { GameSnapshot } from "../../../src/game/Game.ts";
import type { UpgradeId } from "../../../src/game/types.ts";
import { COLORS } from "../../../src/game/view.ts";
import { EXTRA_PADS, MINION_COST, MINION_MAX } from "./futureShop.ts";
import type { PadRuntime } from "./useFutureToys.ts";

const UPGRADE_ORDER = Object.keys(UPGRADE_DEFS) as UpgradeId[];

const UPGRADE_SHORT: Record<UpgradeId, string> = {
  multiplier: "MULT",
  focus: "FOCUS",
  tempo: "TEMPO",
  combo: "COMBO",
  warmup: "WARM",
};

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
  pads,
  minions,
  onToggle,
  onPress,
  onBuy,
  onReset,
  onHireMinion,
  onUnlockPad,
}: {
  snap: GameSnapshot;
  pressFlashUntil: number;
  pads: PadRuntime[];
  minions: number;
  onToggle: () => void;
  onPress: () => void;
  onBuy: (id: UpgradeId) => void;
  onReset: () => void;
  onHireMinion: () => void;
  onUnlockPad: (id: string) => void;
}) {
  const flashing = snap.running && performance.now() < pressFlashUntil;
  const feedback = snap.lastResult
    ? snap.lastResult.grade === "miss"
      ? "MISS"
      : `+${snap.lastResult.points} ${snap.lastResult.grade.toUpperCase()}`
    : snap.running
      ? "…"
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
        <div className="tag">hit the beat · click a ring</div>
      </div>

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
        <div className="hint">SPACE = pad A</div>
      </div>

      <aside className="shop">
        <div className="shop-head">
          <span>SHOP</span>
          <button type="button" className="reset" onClick={onReset}>
            reset
          </button>
        </div>

        <div className="shop-label">upgrades</div>
        {UPGRADE_ORDER.map((id) => {
          const level = snap.upgrades[id];
          const cost = snap.upgradeCosts[id];
          const max = UPGRADE_DEFS[id].maxLevel;
          const maxed = cost === null;
          const canBuy = !maxed && snap.score >= (cost ?? Infinity);
          return (
            <div className="row" key={id}>
              <div>
                <div>{UPGRADE_SHORT[id]}</div>
                <div className="lvl">
                  {level}/{max}
                </div>
              </div>
              <button
                type="button"
                className="buy"
                disabled={!canBuy}
                onClick={() => onBuy(id)}
              >
                {maxed ? "MAX" : String(cost)}
              </button>
            </div>
          );
        })}

        <div className="shop-label">crew</div>
        <div className="row">
          <div>
            <div>MINION</div>
            <div className="lvl">
              {minions}/{MINION_MAX} auto-hit
            </div>
          </div>
          <button
            type="button"
            className="buy"
            disabled={minions >= MINION_MAX || snap.score < MINION_COST}
            onClick={onHireMinion}
          >
            {minions >= MINION_MAX ? "MAX" : String(MINION_COST)}
          </button>
        </div>

        <div className="shop-label">pads</div>
        {EXTRA_PADS.map((pad) => {
          const owned = pads.some((p) => p.id === pad.id);
          const hint = pads.find((p) => p.id === pad.id)?.lastLabel;
          return (
            <div className="row" key={pad.id}>
              <div>
                <div>{pad.name}</div>
                <div className="lvl">
                  {owned
                    ? `${(pad.interval / 1000).toFixed(1)}s ${hint ?? "click ring"}`
                    : `${(pad.interval / 1000).toFixed(1)}s timer`}
                </div>
              </div>
              <button
                type="button"
                className="buy"
                disabled={owned || snap.score < pad.cost}
                onClick={() => onUnlockPad(pad.id)}
              >
                {owned ? "OWN" : String(pad.cost)}
              </button>
            </div>
          );
        })}
      </aside>
    </div>
  );
}
