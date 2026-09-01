# ARCANE CHESS — PHASE 1 REPORT (3D FOUNDATION)

## 1. Current architecture
Next.js 16 (App Router) + React 19 + TypeScript (strict) + Three.js/R3F/drei + Zustand +
Tailwind. Backend (Drizzle/PostgreSQL) retained unchanged. See `docs/ARCHITECTURE.md`.

## 2. Technologies
three, @react-three/fiber, @react-three/drei, zustand, vitest (test runner).

## 3. Files created
- `src/features/chess/board.ts` + `board.test.ts`
- `src/features/chess/types.ts`
- `src/three/assets/registry.ts` + `registry.test.ts`
- `src/three/assets/usePieceAsset.ts`
- `src/three/pieces/procedural.ts`
- `src/three/pieces/ChessPiece.tsx`
- `src/three/board/Board.tsx` + `proceduralBoard.ts`
- `src/three/lighting/LightingRig.tsx`
- `src/three/camera/CameraRig.tsx`
- `src/three/environment/Atmosphere.tsx`
- `src/three/scene/ArcaneChessScene.tsx`
- `src/three/performance/{FpsMeter,DebugPanel,useDevice}.tsx`
- `src/stores/useSettings.ts`
- `src/components/{Landing,Nav,SettingsOverlay}.tsx`
- `blender/scripts/*` (9 generator/export scripts + shared `arcaneforge` module)
- `docs/*` (architecture, ADRs, debt, roadmap, licensing, pipeline docs, this report)
- `vitest.config.ts`, `.env.example`

## 4. Files modified
- `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`
- `src/db/schema.ts`, `src/db/index.ts` (read-only; unchanged)

## 5. Blender pipeline
Authored and documented (`docs/BLENDER_PIPELINE.md`). Scripts present, NOT executed
(Blender not run in-environment). Per-feature generators + shared material/export helpers.

## 6. GLB pipeline
Documented (`docs/GLB_PIPELINE.md`). Loader supports GLB/GLTF, caching, preload,
presence detection, disposal discipline, procedural fallback.

## 7. Asset registry
`src/three/assets/registry.ts` — 12 piece keys + board, URL-canonical, tested.

## 8–9. Three.js / R3F architecture
Declarative scene graph (Canvas → lights → camera → board → pieces → atmosphere);
procedural geometry builders separated from React components; per-frame animation via
R3F `useFrame`, no React state in the render loop.

## 10. Lighting system
Cinematic rig (key+fill+rim+env) with soft shadows, quality-scaled shadow-map size.

## 11. Camera system
Damped orbit controls; board-centered readable defaults; distortion-free framing.

## 12. Animation system
Foundation: selection lift/hover reaction + procedural (visual-only) transforms on
`ChessPiece`. Full move/capture state machines arrive in Phase 2/3.

## 13. VFX architecture
Planned under `three/effects/`; not yet implemented (Phase 3). Atmosphere dust present.

## 14. Performance system
Quality tiers → concrete budgets (shadow size, DPR, particles). FPS dev meter. `useIsMobile`.

## 15. Testing results
16/16 unit tests passing (coordinates + registry). `vitest run` green.

## 16. Production build result
`next build` passes (typegen + tsc + production build all green).

## 17. Known issues
- Blender GLBs not yet produced (procedural TEMPORARY assets active).
- Orbit controls are prototype; gameplay-stable camera arrives with Phase 2.

## 18. Assets requiring Blender execution
All six piece GLBs × two colors + board GLB. Run `blender/scripts/generate_all_pieces.py`,
then copy exports into `public/assets/chess/{white,black}/` and `public/assets/board/`.

## 19. Recommended next phase
**Phase 2 — Complete local chess gameplay**: in-house chess engine (rules, SAN, FEN, PGN,
hash, draws), connect authoritative state to the renderer via an event layer, selection +
legal-move highlights + movement animation + promotion + local 2P. Do NOT add multiplayer yet.
