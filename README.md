# Button Presser

A TypeScript timing game for the **browser** and **Electron**.

The UI is a **320×180** pixel stage (16:9), scaled to fit the window with nearest-neighbor upscaling. Buttons and sparks draw on a 2D canvas (`requestAnimationFrame` + delta time). The HUD and upgrade tree are React, painted at 8px and scaled up so they stay chunky.

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

| Script             | What it does                             |
| ------------------ | ---------------------------------------- |
| `npm start`        | Vite dev server                          |
| `npm run build`    | Typecheck + Electron main + Vite `dist/` |
| `npm run electron` | Build + open Electron                    |
| `npm test`         | Game, save, and pointer checks           |
| `npm run preview`  | Serve the production build               |

## How to play

1. Click a ring or press Space on a beat. The first hit scores.
2. Keep hitting rings / Space on each beat.
3. Grades: perfect → great → good → ok → miss. A miss or a skipped beat breaks that button's streak. Other buttons keep theirs.
4. Open **TREE** to buy upgrades. Paths gate later nodes. Progress saves in `localStorage`.

EVERY is the root. Scoring goes EVERY → MULT → FOCUS → PERF → SNAP → GREAT. Side branches: EVERY also opens the 1.5s extra button; MULT opens COMBO → TWIN (double-tap) which forks to GAP (wider double-tap), CHAIN (longer streaks), and BTNS → STAR; FOCUS opens TEMPO (streaks speed the main beat) → PAIR (0.75s, two hits in a row). STAR opens PULSE and AIM; PULSE opens SHARE; AIM opens TIP (star payout) and CREW (more hire slots). Stars start slow and late — PULSE, AIM, SHARE, and TIP make them fire more often, closer to the beat, with a cut of your scoring upgrades, and with their own multiplier. BTNS makes extra buttons pay more.

## Layout

```
src/
  game/             # scoring, save, buttons
  ui/               # HUD, skill tree, canvas playfield
  App.tsx
  electron-main.ts
```

## Extending

- Upgrades: `src/game/upgrades.ts`
- Tree layout: `src/ui/UpgradeTree/index.ts`
- Buttons: `src/game/buttons.ts` (`EXTRA_BUTTONS` — stage-pixel `x`/`y`, timer, `kind`, tree slot, 8×8 `icon`)
- Scoring: `src/game/timing.ts`
- Playfield drawing: `src/ui/pixelDraw.ts` (stage pixels, Y down)
