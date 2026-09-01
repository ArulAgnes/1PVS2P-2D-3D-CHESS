# ARCANE CHESS — PHASE 1 ARCHITECTURE (3D FOUNDATION)

## Goal

Establish a production-grade 3D web rendering pipeline:
`Blender → GLB/GLTF → asset registry → R3F → Three.js → lighting → materials →
animation → VFX → cinematic chess` — such that later phases add gameplay without
rebuilding the 3D stack.

## Components delivered

- **Coordinate system** (`features/chess/board.ts`): deterministic square↔index↔world
  mapping with orientation flip (`white`/`black`). Fully unit-tested.
- **Asset registry + loader** (`three/assets/`): central URL map + `usePieceAsset` with
  caching, preload, HEAD-based presence detection, and honest procedural fallback.
- **Procedural stone assets** (TEMPORARY): lathe/extrude silhouettes for all six piece
  types × both colors + carved-stone board, PBR materials with displacement.
- **Scene** (`three/scene/ArcaneChessScene.tsx`): Canvas + board + hero pieces + camera +
  lighting + atmosphere; guarded for SSR hydration.
- **Lighting rig**: key/fill/rim/env + soft shadows (no bare ambient).
- **Camera rig**: damped orbit controls, readable default framing.
- **Atmosphere**: subtle dust motes + fog (quality-gated).
- **Settings store**: quality tiers (AUTO/LOW/MEDIUM/HIGH/ULTRA), reduced motion, sound.
- **Debug panel**: FPS + settings, dev-only.

## Honesty about assets

Blender **scripts** (`blender/scripts/`) are authored and ready to run, but Blender has
NOT been executed in this environment. Therefore the shipped pieces are clearly-marked
TEMPORARY procedural stone meshes, registered in `ASSET_LICENSE_AUDIT.md` with a clean
migration path to GLB. No claim of executed Blender generation is made.

## Decisions

See `docs/ARCHITECTURE_DECISIONS.md` ADR-005/006/007/008.
