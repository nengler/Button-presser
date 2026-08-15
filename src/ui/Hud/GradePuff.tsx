import { Puff } from "./types";

type Props = {
  puff: Puff;
  onDone: (id: number) => void;
};

export default function GradePuff({ puff, onDone }: Props) {
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
