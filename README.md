# Button Presser

A small TypeScript timing game that runs in the **browser** and in **Electron**.

Press on every beat (about once per second). The closer you are to the exact beat, the more points you earn. Spend points on upgrades as you go.

## Quick start

```bash
npm install
npm start          # browser → http://localhost:5173
npm run electron   # desktop window
```

| Script | What it does |
|--------|----------------|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Build + serve static files |
| `npm run electron` | Build + open Electron |
| `npm run smoke` | Build + run timing smoke checks |
| `npm run watch` | Rebuild on change |

## How to play

1. Click **Start** (or press Space).
2. Click **Press** / Space on each beat — watch the ring and center pulse.
3. Grades: perfect → great → good → ok → miss. Misses break your streak.
4. Buy upgrades in the side panel. Progress saves in `localStorage`.

## Layout

```
src/
  game/           # shared logic (timing, upgrades, save)
  renderer.ts     # UI / input (browser + Electron)
  electron-main.ts
scripts/serve.mjs # zero-dependency static server
index.html
styles.css
```

Dependencies are kept minimal: **typescript** and **electron** only (both `devDependencies`).

## Extending

- Add upgrades in `src/game/upgrades.ts` and wire effects in `Game.ts` / `timing.ts`.
- Tune scoring in `src/game/timing.ts` (`scorePress`).
- The same `index.html` + `dist/renderer.js` bundle is used in both targets.
