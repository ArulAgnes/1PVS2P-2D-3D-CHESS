# ARCANE CHESS — TECHNICAL DEBT REGISTER

Tracks known debt introduced or discovered. Each entry: severity, area, description,
and mitigation plan. Nothing here may be silently ignored.

| ID | Severity | Area | Description | Mitigation |
|----|----------|------|-------------|------------|
| TD-001 | Medium | Assets | Chess pieces are **procedural stone meshes** (temporary), not yet Blender-authored GLB. | Run `blender/scripts/generate_pawn.py` etc., export GLB, drop into `public/assets/chess/{white,black}/`. |
| TD-002 | Medium | 3D/Chess | Knight GLB clips (`Knight_Attack`, `Knight_Death`) are not yet produced. | Blender animation authoring + export (Phase 3). |
| TD-003 | Low | Infra | WebSocket game service does not exist (multiplayer is future). | Phase 4/5; plan already records potential dedicated service. |
| TD-004 | Low | Tests | No Vitest runner wired; engine correctness tests are not yet executable in CI. | Add `vitest` in Phase 2 before/with the chess engine. |
| TD-005 | Info | Observability | No structured logging / metrics beyond health endpoint. | Later phase; documented in roadmap. |
| TD-006 | Info | DB | Schema is empty; domain tables are planned but not created. | Create only when features require them (constitution §27). |

> This register is maintained honestly. "Complete" is only marked when verified.
