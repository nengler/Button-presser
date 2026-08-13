import { COLORS } from "../../../src/game/view.ts";

export const MAIN_STATION_ID = "main";

export const MINION_COST = 80;
export const MINION_MAX = 4;

export type PadDef = {
  id: string;
  name: string;
  interval: number;
  cost: number;
  x: number;
  y: number;
  color: string;
};

export const MAIN_PAD: PadDef = {
  id: MAIN_STATION_ID,
  name: "PAD A",
  interval: 1000,
  cost: 0,
  x: -1.55,
  y: 0.35,
  color: COLORS.gold,
};

export const EXTRA_PADS: PadDef[] = [
  {
    id: "pad-b",
    name: "PAD B",
    interval: 1400,
    cost: 120,
    x: 1.55,
    y: 1.15,
    color: "#7eb8c9",
  },
  {
    id: "pad-c",
    name: "PAD C",
    interval: 720,
    cost: 180,
    x: 1.55,
    y: -1.15,
    color: "#c98b7e",
  },
];

export function padById(id: string): PadDef {
  if (id === MAIN_STATION_ID) return MAIN_PAD;
  return EXTRA_PADS.find((p) => p.id === id) ?? MAIN_PAD;
}
