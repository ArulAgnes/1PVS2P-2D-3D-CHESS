# ARCANE CHESS — IMPLEMENTATION ROADMAP

10-phase plan conforming to the engineering constitution. Each phase integrates into the
same platform; later phases never rebuild earlier systems without a justified ADR.

| Phase | Focus | Key deliverables | Status |
|-------|-------|------------------|--------|
| **0** | Foundation | Master architecture, ADRs, debt register, roadmap, license policy, repo audit | ✅ In progress |
| **1** | 3D foundation | Blender/GLB pipeline docs + scripts, asset registry, R3F scene (board, procedural stone knight), lighting rig, camera, coordinates, quality tiers, debug panel | ✅ In progress |
| **2** | Chess gameplay | Full in-house engine (rules/SAN/FEN/PGN/hash), six piece variants, selection/highlights, movement animation, local 2P, promotion UI, full test suite | ⬜ Later |
| **3** | Cinematic combat | Capture state machine, piece-specific attacks, stone fracture/debris/dust/VFX, camera shake, audio hooks, pooling | ⬜ Later |
| **4** | Multiplayer | WebSocket game service, sessions, clocks, reconnection, event ordering | ⬜ Later |
| **5** | Matchmaking + rooms | Queue, time controls, room codes, bots | ⬜ Later |
| **6** | Cinematics polish | Full capture/VFX/check/checkmate presentations | ⬜ Later |
| **7** | Esports | Elo, tournaments, leaderboards, seasons, spectator/replay/broadcast | ⬜ Later |
| **8** | Social | Profiles, friends, chat, notifications, moderation | ⬜ Later |
| **9** | Infrastructure | Redis, scaling, CDN, monitoring, logging, deployment | ⬜ Later |
| **10** | Release | Hardening, security audit, performance report, launch | ⬜ Later |

## Phase contract

Every phase: READ master architecture → read previous docs → audit code → write phase
architecture → implement → test → integrate → build → verify → document.

## Non-goals for the current phase

Social, payments, tournaments, matchmaking, Elo, chat, clans. Build the 3D foundation
correctly first.
