# Button Presser

A small TypeScript timing game that runs in the **browser** and in **Electron**.

The whole game renders on a **320×180** canvas (16:9) and integer-scales up to fit the window.

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
  game/           # shared logic (timing, upgrades, save, view size)
  renderer.ts     # 320×180 canvas UI + input
  electron-main.ts
prototypes/webgl-2d/  # optional R3F / CarverJS 2D sketch (Vite)
scripts/serve.mjs # zero-dependency static server
index.html
styles.css
```

Dependencies are kept minimal: **typescript** and **electron** only (both `devDependencies`).

## WebGL 2D prototype (R3F / CarverJS)

The shipping game stays on a 320×180 canvas. A separate Vite app in `prototypes/webgl-2d` redraws the same `Game.ts` logic with:

- an **HTML HUD** (buttons, shop, stats — normal DOM)
- the beat ring in **WebGL**, either raw **R3F orthographic** or **CarverJS `mode="2d"`**

```bash
npm run proto          # → http://localhost:5174
```

For this title it is **not easier overall**. The interesting part (timing, scoring, upgrades) is already engine-agnostic. What changes is drawing:

| | Canvas 2D (current) | R3F 2D | CarverJS 2D |
|---|---|---|---|
| Beat ring | `arc()` | a few meshes | `<Actor shape="circle\|ring">` wrapping those meshes |
| HUD / shop | manual `fillRect` + hit tests | HTML/CSS | HTML/CSS (Carver’s own examples do this) |
| Text | `fillText` | painful in WebGL; HTML overlay is the real win | same |
| Extra deps | none | React, Three, R3F | those plus Carver, drei, zustand |
| Pixel integer scale | trivial | fighting WebGL filtering / DPR | same |

CarverJS helps when you want actors, collisions, tweens, and a scene graph. Button Presser is a HUD around one pulsing ring, so Carver is mostly an R3F canvas with extra engine services you do not use. The HTML overlay *is* easier than canvas hit-testing — you can add that without Three.js.

## Extending

- Add upgrades in `src/game/upgrades.ts` and wire effects in `Game.ts` / `timing.ts`.
- Tune scoring in `src/game/timing.ts` (`scorePress`).
- The same `index.html` + `dist/renderer.js` bundle is used in both targets.
