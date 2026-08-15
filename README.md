# Button Presser

A TypeScript timing game for the **browser** and **Electron**.

The UI is a **320×180** pixel stage (16:9), integer-scaled to the window. Pads and sparks draw on a 2D canvas (`requestAnimationFrame` + delta time). The HUD and upgrade tree are React, painted at 8px and scaled up so they stay chunky.

Press on every beat (about once per second). The closer you are to the exact beat, the more points you earn. Spend points on a skill tree as you go.

## Play on your phone (GitHub Pages)

After this is merged to `main`, GitHub Actions builds `dist/` and publishes it.

1. In the GitHub repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Wait for the **Deploy GitHub Pages** workflow on `main` (Actions tab). You can also run it with **Run workflow**.
3. Open **https://nengler.github.io/Button-presser/** on your phone.

The site is public. Progress still saves in the browser (`localStorage`), so it stays on that device.

If the workflow fails with a Pages permission error, the repo may be private — GitHub Pages on private repos needs GitHub Pro/Team, or make the repo public.

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

EVERY is the root: bonus points every few successful hits (more often and bigger as you rank it up). That unlocks MULT, FOCUS, and PERF. SHIELD ignores a miss without breaking streak. CLUTCH pays extra on the hit after a miss. MULT and FOCUS merge into STAR (helpers that tap leftover beats you miss). Stars start slow and late — buy PULSE, AIM, and SHARE so they fire more often, closer to the beat, and with a cut of your scoring upgrades. PADS makes extra pads worth more. Extra pads: a 1.5s timer, a 3s double-tap, and a 0.75s pad that only scores every two hits in a row.

## Layout

```
src/
  game/             # scoring, save, pads
  ui/               # HUD, skill tree, canvas playfield
  App.tsx
  electron-main.ts
```

## Extending

- Upgrades: `src/game/upgrades.ts`
- Tree layout: `src/ui/upgradeTree.ts`
- Pads: `src/game/pads.ts` (`EXTRA_PADS` — stage-pixel `x`/`y`, timer, `kind`, tree slot, 8×8 `icon`)
- Scoring: `src/game/timing.ts`
- Playfield drawing: `src/ui/pixelDraw.ts` (stage pixels, Y down)
