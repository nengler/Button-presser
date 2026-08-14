# Button Presser

A TypeScript timing game for the **browser** and **Electron**.

The UI is a **320×180** pixel stage (16:9), integer-scaled to the window. Pads and sparks draw on a 2D canvas (`requestAnimationFrame` + delta time). The HUD and upgrade tree are React, painted at 8px and scaled up so they stay chunky.

Press on every beat (about once per second). The closer you are to the exact beat, the more points you earn. Spend points on a skill tree as you go.

## Quick start

```bash
npm install
npm start          # browser → http://localhost:5173
npm run electron   # desktop window (production build)
```

| Script | What it does |
|--------|----------------|
| `npm start` | Vite dev server |
| `npm run build` | Typecheck + Electron main + Vite `dist/` |
| `npm run electron` | Build + open Electron |
| `npm run smoke` | Timing/scoring checks |
| `npm run preview` | Serve the production build |

## How to play

1. Click **Start** (or press Space).
2. Click **Press** / Space / a ring on each beat.
3. Grades: perfect → great → good → ok → miss. Misses break your streak.
4. Open **TREE** to buy upgrades. Paths gate later nodes. Progress saves in `localStorage`.

WARM unlocks MULT and FOCUS. Those merge into MINION (helpers that hit leftover beats). Minions unlock extra pads with their own timers.

## Layout

```
src/
  game/             # timing, upgrades, save, pads/minions
  ui/               # pixel HUD, skill tree, canvas playfield
  App.tsx
  electron-main.ts
index.html
```

## Extending

- Add leveled upgrades in `src/game/upgrades.ts`.
- Add tree nodes in `src/ui/upgradeTree.ts`.
- Add a pad in `src/game/toys.ts` (`EXTRA_PADS`): stage-pixel `x`/`y`, color, timer, plus `treeX`/`treeY`, blurb, and an 8×8 `icon`. The playfield and skill tree pick it up.
- Tune scoring in `src/game/timing.ts`.
- Draw new playfield art with `fillDisc` / `fillRing` / `stampGlyph` in `src/ui/pixelDraw.ts` (coordinates are stage pixels, Y down).
