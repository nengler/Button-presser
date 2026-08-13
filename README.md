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

The shipping game stays on a 320×180 canvas. A separate Vite app in `prototypes/webgl-2d` redraws the same `Game.ts` logic with a **pixel skill tree** (incremental-style gated nodes) and a **2D scene graph** for the world.

```bash
npm run proto          # → http://localhost:5174
```

That split starts to pay off once the world is more than one ring:

- **Tree** — full-screen pixel upgrade graph (neon paths, locked/owned/selected). WARM unlocks MULT/FOCUS; those merge into MINION; minion unlocks extra pads. Repeatable nodes keep their levels.
- **Particles** — burst on press (gold specks at the pad).
- **Minions** — hire from the shop; they orbit a pad and hit leftover beats.
- **Extra pads** — unlock PAD B / PAD C with their own timers; click the ring in the scene.

R3F and CarverJS share the same `Playfield`. Carver is `mode="2d"` around that playfield (actors/particles/tweens are there when you want them). The canvas renderer does not include these toys yet.

`Game.spendScore` / `Game.addScore` / `Game.canPress` exist so the prototype shop and minions can share the real score.

## Extending

- Add upgrades in `src/game/upgrades.ts` and wire effects in `Game.ts` / `timing.ts`.
- Tune scoring in `src/game/timing.ts` (`scorePress`).
- The same `index.html` + `dist/renderer.js` bundle is used in both targets.
