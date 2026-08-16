import { CSSProperties } from "react";
import { Chip } from "./types";

type Props = {
  chip: Chip;
  onDone: (id: string) => void;
};

export default function ScoreChip({ chip, onDone }: Props) {
  const style: CSSProperties & { "--delay": string } = {
    color: chip.color,
    left: chip.x0,
    top: chip.y0,
    "--delay": `${chip.delay}ms`,
  };
  return (
    <div
      className={chip.label ? "score-chip named" : "score-chip"}
      style={style}
      onAnimationEnd={function (e) {
        if (e.animationName !== "score-chip") return;
        onDone(chip.id);
      }}
    >
      {chip.label ? `+${chip.pts} ${chip.label}` : `+${chip.pts}`}
    </div>
  );
}
