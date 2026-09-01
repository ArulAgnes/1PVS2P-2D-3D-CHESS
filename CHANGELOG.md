# Arcane Chess — Changelog

## Phase 1 — 3D Foundation (3D rendering pipeline)
- Next.js + React + TypeScript + Three.js/R3F/drei + Zustand stack
- Deterministic chess coordinate system (`squareToWorld`/`worldToSquare`)
- Asset registry + GLB loader with caching/preload/procedural fallback
- Procedural stone board + 6 stone piece families (TEMPORARY assets)
- Cinematic lighting rig, camera rig, atmosphere (dust/fog)
- Quality tiers (AUTO/LOW/MEDIUM/HIGH/ULTRA) + reduced motion + dev debug panel
- Blender generation/export scripts (authored, not yet executed)
- Cinematic landing page with 3D hero

## Phase 2 — Complete chess engine
- Full standards-compliant engine: pawn (single/double/en passant/promotion),
  knight/bishop/rook/queen/king, castling (both sides, all restrictions)
- Check, checkmate, stalemate, threefold repetition, fifty-move rule,
  insufficient material, resignation
- SAN (with disambiguation), FEN import/export, PGN export, deterministic position hashing
- 32 unit tests

## Phase 2/3 integration — Playable cinematic 3D chess
- Real playable 3D board: selection, legal-move highlights, capture highlights,
  last-move highlights
- Smooth piece movement animation (eased lerp + lift arc; knight arcs higher)
- Capture presentation: stone-fragment burst + shrinking captured-piece ghost
- Promotion chooser (Queen/Rook/Bishop/Knight)
- Local 2-player (hotseat) mode
- 2D fallback board (same engine state)
- Move list, FEN/PGN inspector, undo, board flip, resign, result overlay

## Phase 6 foundation — In-house bot engine
- Negamax + alpha-beta pruning + move ordering + material/piece-square evaluation
- No external engines / pretrained models / network calls
- 7 difficulty profiles (target 100–2500), clearly labeled as *target*, not verified Elo
- 5 unit tests (legality, mate finding, evaluation)

## Phase 10 (partial) — Documentation & honesty
- IMPLEMENTATION_STATUS.md, CHANGELOG.md, KNOWN_LIMITATIONS.md, final reports
- Honest status: multiplayer/matchmaking/rating/rooms/tournaments/spectator/broadcast
  are documented as future phases, NOT implemented in this build.
