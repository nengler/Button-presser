import { CSSProperties } from "react";
import { Chip } from "./types";

const SCORE_X = 10;
const SCORE_Y = 6;

type Props = {
  chip: Chip;
  onLand: (id: string) => void;
};

export default function FlyChip({ chip, onLand }: Props) {
  const style: CSSProperties & {
    "--x0": string;
    "--y0": string;
    "--x1": string;
    "--y1": string;
    "--delay": string;
  } = {
    color: chip.color,
    "--x0": `${chip.x0}px`,
    "--y0": `${chip.y0}px`,
    "--x1": `${SCORE_X}px`,
    "--y1": `${SCORE_Y}px`,
    "--delay": `${chip.delay}ms`,
  };
  return (
    <div
      className={chip.label ? "score-chip named" : "score-chip"}
      style={style}
      onAnimationEnd={function () {
        onLand(chip.id);
      }}
    >
      {chip.label ? `+${chip.pts} ${chip.label}` : `+${chip.pts}`}
    </div>
  );
}
