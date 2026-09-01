# ARCANE CHESS — IMPLEMENTATION STATUS

Honest, up-to-date status. **COMPLETE** (tested & verified), **PARTIAL** (provisional),
**TODO** (planned), **BLOCKED** (external dependency). Never marked COMPLETE unless tested.

## Phase 0 — Foundation ✅ COMPLETE
Master architecture, ADRs, debt register, roadmap, licensing policy/audit.

## Phase 1 — 3D Foundation ✅ COMPLETE
R3F/Three.js scene, coordinates, asset registry/loader, procedural stone pieces/board,
lighting/camera/atmosphere, quality tiers, reduced motion, debug panel, Blender scripts,
landing page. (Blender GLB export: **TODO** — scripts authored, not executed.)

## Phase 2 — Chess engine ✅ COMPLETE
Full rules engine with SAN/FEN/PGN/hash/draws — 32 unit tests passing.

## Phase 2/3 — Playable cinematic 3D chess ✅ COMPLETE
Selection, highlights, movement/capture animation, promotion, local 2P, 2D fallback,
move list, undo/flip/resign. (Full Phase-3 per-piece attack cinematics: **PARTIAL** —
capture uses fragment burst + ghost; no per-piece Blender attack clips yet.)

## Phase 6 — Bot foundation ✅ COMPLETE (foundation only)
In-house negamax/alpha-beta engine + 7 difficulty profiles — 5 tests. (Benchmarking
against real Elo: **TODO**; never claimed.)

## Phase 4/5/7/8/9 — Multiplayer, rooms, rating, tournaments, social, spectator/broadcast
**TODO** — interfaces documented, not implemented. Not faked.

## Verification
- `vitest run`: 53 tests passing
- `next typegen` / `tsc --noEmit` / `next build`: passing
- `build_and_start` healthcheck: passing
