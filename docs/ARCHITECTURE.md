# ARCANE CHESS — ARCHITECTURE (code-level)

Concrete code-level architecture of the current codebase. Complements
`MASTER_ARCHITECTURE.md` (constitution) and `ARCHITECTURE_DECISIONS.md` (ADRs).

## Directory layout

```
src/
  app/                  Next.js routes + layout (dark theme)
  components/           Landing, Nav, SettingsOverlay (client UI)
  features/chess/       board coordinates (board.ts), piece types (types.ts)
  three/
    scene/              ArcaneChessScene (composition root)
    board/              Board.tsx + proceduralBoard.ts (TEMPORARY stone board)
    pieces/             ChessPiece.tsx + procedural.ts (TEMPORARY stone pieces)
    assets/             registry.ts + usePieceAsset.ts (GLB loader/fallback/preload)
    camera/             CameraRig.tsx
    lighting/           LightingRig.tsx
    environment/        Atmosphere.tsx
    performance/        FpsMeter, DebugPanel, useDevice
  stores/               useSettings.ts (Zustand)
public/assets/chess/    (GLB destination; procedural fallback active until Blender runs)
blender/scripts/        generator + export scripts (authored, pending execution)
docs/                   all architecture/status/licensing docs
```

## Key architectural boundaries

- **Chess state vs presentation state:** kept in separate modules; the 3D layer only
  *presents* what authoritative state dictates (enforced more strongly in Phase 2+).
- **Coordinates:** `features/chess/board.ts` is the single deterministic mapping
  (square ↔ index ↔ world), fully unit-tested.
- **Assets:** `three/assets/registry.ts` centralizes URLs; `usePieceAsset` is the only
  loader, with HEAD-based presence check + procedural TEMPORARY fallback.
- **Rendering settings:** `stores/useSettings.ts` + `resolveRenderSettings` translate a
  quality tier into concrete shadow/particle/pixel-ratio budgets.
- **Camera/light/atmosphere:** isolated, swappable components; no cross-coupling.

## Relationship to future phases

Phase 2 introduces the chess engine (server-authoritative model) and connects it to the
renderer through an event layer; the renderer's `ChessPiece`/`Board` already only
reflect position/rotation props, so engine state can drive them without rewriting the
3D stack.
