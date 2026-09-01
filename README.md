# ARCANE CHESS

**Every move leaves a mark.**

A cinematic 3D chess platform with an original "ancient arcane stone chess realm"
identity. Real 3D (Three.js / React Three Fiber), a complete standards-compliant chess
engine, cinematic capture presentation, and an in-house bot engine.

> This is a real product foundation, not a demo. Unimplemented features (online
> multiplayer, matchmaking, ratings, tournaments, spectator/broadcast, accounts) are
> documented honestly in `docs/KNOWN_LIMITATIONS.md` — never faked.

## Features (current build)

- **Complete chess engine** — all standard rules: castling (both sides), en passant,
  promotion, check/checkmate/stalemate, threefold repetition, fifty-move rule,
  insufficient material, SAN (with disambiguation), FEN import/export, PGN export,
  deterministic position hashing.
- **Cinematic 3D board** — procedural stone board + 6 stone piece families, cinematic
  lighting rig, atmosphere, smooth movement animation, capture presentation
  (stone-fragment burst + shrinking ghost).
- **Playable modes** — local 2-player (hotseat) and **Play vs Bot**.
- **In-house bot** — negamax + alpha-beta pruning + move ordering + evaluation.
  No external engines, no pretrained models, no network calls. Difficulty is a *target*
  (never presented as verified Elo).
- **2D fallback board** (same engine state).
- **Quality tiers** (AUTO/LOW/MEDIUM/HIGH/ULTRA), reduced motion, dev debug panel.

## Tech stack

- **Frontend:** React 19, Next.js 16 (App Router), TypeScript (strict), Tailwind CSS 4
- **3D:** Three.js, React Three Fiber, drei (GLB/GLTF loader)
- **State:** Zustand
- **Backend/database:** Next.js Route Handlers + PostgreSQL + Drizzle ORM (wired and
  health-checked; game persistence is a future phase)
- **Tests:** Vitest

## Local setup

```bash
npm install
cp .env.example .env      # set DATABASE_URL
npm run dev               # http://localhost:3000
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Production build (typegen + tsc + next build) |
| `npm run start` | Run production server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npx vitest run` | Run unit tests |

## 3D assets & Blender

`blender/scripts/` contains procedural Blender generators (`generate_knight.py`, etc.)
and a shared export helper. The app currently uses honest **TEMPORARY** procedural stone
meshes (in-repo original work); run the scripts and drop exports into
`public/assets/chess/{white,black}/` to swap to GLB with zero scene changes. See
`docs/BLENDER_PIPELINE.md` and `docs/GLB_PIPELINE.md`.

## Architecture

- `src/features/chess/` — engine + bot + coordinates (the source of truth)
- `src/three/` — scene, board, pieces, assets, lighting, camera, environment, game
- `src/stores/` — Zustand stores (game state, settings)
- `src/components/` — UI (landing, game screen, 2D board)
- `docs/` — architecture, decisions, roadmap, licensing, reports

See `docs/MASTER_ARCHITECTURE.md`, `docs/ARCHITECTURE_DECISIONS.md`, and
`docs/IMPLEMENTATION_ROADMAP.md` for the full engineering constitution.

## Documentation index

`docs/MASTER_ARCHITECTURE.md`, `docs/ARCHITECTURE_DECISIONS.md`,
`docs/TECHNICAL_DEBT.md`, `docs/IMPLEMENTATION_ROADMAP.md`, `docs/CHESS_ENGINE.md`,
`docs/BOT_ARCHITECTURE.md`, `docs/BLENDER_PIPELINE.md`, `docs/GLB_PIPELINE.md`,
`docs/ASSET_LICENSING.md`, `docs/ASSET_LICENSE_AUDIT.md`,
`docs/IMPLEMENTATION_STATUS.md`, `docs/KNOWN_LIMITATIONS.md`, `CHANGELOG.md`.

## License

Original code and assets. See `docs/ASSET_LICENSING.md` for the binding licensing policy.
