# ARCANE CHESS — MASTER ARCHITECTURE

> **Product:** Arcane Chess — a cinematic 3D online chess platform.
> **Tagline:** *Every move leaves a mark.*
> **Status:** Living engineering constitution. Every future phase MUST conform to this document.

This document is the single source of architectural truth for the entire project.
It is derived from the PRINCIPAL ENGINEERING CONSTITUTION (Phase 0) and reflects the
**actual** state of the codebase as of the last audit.

---

## 1. Product Vision

Real online chess + real-time multiplayer + cinematic 3D gameplay + original fantasy
art direction + matchmaking + room codes + bot play + Elo + timers + tournaments +
spectator + replay + broadcast + social + premium game experience.

It must never look like a student project, a generic dashboard, or a chess clone.

## 2. Originality & Copyright

- Original fantasy world: **"Ancient Arcanic Stone Chess Realm."**
- **No** Harry Potter, Hogwarts, movie logos, characters, music, or ripped assets.
- All assets must have verifiable commercial-use rights.
- Maintain `docs/ASSET_LICENSE_AUDIT.md` (see `docs/ASSET_LICENSING.md`).

## 3. Core Technology (target stack, as implemented)

| Layer | Technology |
|-------|------------|
| Language | TypeScript (strict) |
| Frontend | React 19 + Next.js 16 (App Router) |
| 3D | Three.js + React Three Fiber + drei |
| State | Zustand (client state stores) |
| Styling | Tailwind CSS 4 |
| Backend | Next.js Route Handlers (API) |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Real-time | WebSocket (planned Phase 4–5) |
| Chess domain | In-house TS engine (Phase 2) |
| 3D authoring | Blender → GLB/GLTF |

> The existing Node.js/PostgreSQL/Drizzle backend is stable and therefore is **not** replaced.

## 4. High-Level Architecture

```
ARCANE CHESS
├── WEB CLIENT            (React/TS/UI/R3F/Audio/VFX)
├── API                   (auth, profiles, games, rooms, matchmaking, ...)
├── REAL-TIME SERVICE     (WebSocket, sessions, clock, sync — future)
├── CHESS DOMAIN          (legal moves, check, castling, en passant, draws)
├── BOT SYSTEM            (future)
├── COMPETITIVE           (Elo, matchmaking, tournaments — future)
├── OBSERVATION           (spectator, replay, broadcast — future)
├── SOCIAL                (friends, chat, notifications — future)
├── 3D ASSET SYSTEM       (Blender → GLB → R3F)
├── ADMIN                 (RBAC — future)
└── INFRASTRUCTURE        (PostgreSQL, deploy, monitoring)
```

## 5. Source of Truth

The server is authoritative. The client only requests actions and renders state.
A move is **never** validated by the animation system.

## 6. Chess Domain

Full standard rules (see `docs/CHESS_ENGINE.md`, Phase 2). No simplifications.

## 7–9. Game state, real-time events, reconnection

Authoritative, sequence-ordered event model. Specified for later phases; see
`docs/PHASE_04_MULTIPLAYER_ARCHITECTURE.md` when implemented.

## 10–15. Cinematic system, 3D, pieces, rendering, mobile, 2D fallback

See `docs/PHASE_02_3D_ARCHITECTURE.md` and Phase 3 cinematics.

## 16–18. Matchmaking, rooms, bots

Future phases. Room codes must not expose DB ids.

## 19–20. Elo & tournaments

Server-side atomic Elo. Advertise only implemented formats.

## 25. Security

Authn/z, input validation, rate limiting, XSS/CSRF/SQLi, WS auth, secret management
from phase 1 onward.

## 27–29. Database, transactions, idempotency

Domain boundary tables; atomic critical operations; idempotent repeated requests.

## 34–36. Environment and deployment

`.env` + `.env.example`; never commit secrets. Dev/test/staging/prod config separation.

## 40–44. Non-negotiables

No fake functionality, no placeholder "Coming Soon" for claimed features, no random
rewrites; every feature passes FUNCTIONAL/VISUAL/SECURITY/PERFORMANCE/ACCESSIBILITY/
INTEGRATION.

---

*See `docs/ARCHITECTURE_DECISIONS.md` for recorded ADRs and
`docs/IMPLEMENTATION_ROADMAP.md` for the phase plan.*
