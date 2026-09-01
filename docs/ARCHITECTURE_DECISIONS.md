# ARCANE CHESS — ARCHITECTURE DECISION RECORDS (ADR)

Format per decision: Decision / Context / Options / Chosen / Reason / Tradeoffs.

---

## ADR-001: Keep Next.js App Router + Drizzle + PostgreSQL backend

- **Decision:** Retain the existing Next.js 16 App Router + Drizzle + PostgreSQL stack
  as the application backend rather than introducing FastAPI or a separate Node service.
- **Context:** The repository ships a stable Next.js + Drizzle + PostgreSQL template
  with a health endpoint. The constitution forbids replacing stable systems without
  justification.
- **Options:** (a) keep Next.js full-stack; (b) split into separate API (FastAPI);
  (c) separate Node WebSocket service.
- **Chosen:** (a), with (c) permitted as a later horizontally-scaled game service if
  WebSocket scaling demands it.
- **Reason:** Single deployable, TypeScript end-to-end, minimal friction, no orphaned
  backend.
- **Tradeoffs:** Next.js is not ideal for long-lived WebSockets; mitigated by planning
  a dedicated game service in the multiplayer phase if needed.

## ADR-002: React Three Fiber + drei + Three.js for 3D

- **Decision:** Use R3F/drei on top of Three.js for all 3D rendering.
- **Context:** Constitution requires React, Three.js, R3F, drei.
- **Chosen:** R3F + drei. Declarative scene graph, React reconciliation, GLB support via
  `useGLTF`, built-in controls/loading helpers.
- **Tradeoffs:** R3F overhead vs. raw Three.js; acceptable given maintainability.

## ADR-003: In-house TypeScript chess engine (no external chess lib)

- **Decision:** Build a standards-compliant chess engine in-house for Phase 2.
- **Context:** Full control over authoritative serializable state, SAN/FEN/PGN, moves,
  hashing for threefold repetition, and future server-authoritative validation.
- **Options:** (a) in-house; (b) `chess.js`; (c) WASM engine (Stockfish) for analysis.
- **Chosen:** (a) for the authoritative game core; (c) optionally later for analysis/bots.
- **Tradeoffs:** More code and testing burden; but gives a single source of truth that
  runs identically client- and server-side.

## ADR-004: Zustand for client state (separate stores)

- **Decision:** Use Zustand for client state, split into Chess / UI / Presentation stores.
- **Reason:** Must not put the Three.js scene or per-frame animation into React state.
- **Tradeoffs:** None material for this scope.

## ADR-005: GLB-first asset pipeline (Blender → GLB → R3F)

- **Decision:** Prefer self-contained `.glb`; support `.gltf`; author in Blender with
  procedural generation scripts; registry-driven loading with caching + preload.
- **Tradeoffs:** GLB binary is larger but self-contained; acceptable.

## ADR-006: Procedural stone assets as honest temporary art

- **Decision:** Until Blender-authored art is exported, generate **procedural stone**
  meshes in Three.js (lathe + Extrude + displacement) as **clearly-marked TEMPORARY
  assets**, behind the same asset registry/loader abstraction as final GLBs.
- **Reason:** The constitution forbids presenting primitive shapes as final art but also
  forbids *pretending* Blender executed. Procedural stone meshes are a legitimate
  interim that swaps cleanly for GLB later.
- **Tradeoffs:** Visual fidelity below final sculpted art; architecture unchanged on swap.

## ADR-007: Code-driven board positioning, not animation-root-motion

- **Decision:** Authoritative world position of a piece is computed deterministically from
  its square via `squareToWorld`. Animations only *present* movement and never own the
  final position.
- **Reason:** Ensures server-authoritative multiplayer can set final positions by event
  alone (constitution §44 root motion).

## ADR-008: Client/UI split into quality tiers and reduced-motion now

- **Decision:** Implement `AUTO/LOW/MEDIUM/HIGH/ULTRA` quality + reduced-motion controls
  in the 3D foundation, not retrofit later.
- **Reason:** Performance and accessibility are constitutional, not optional.

---

*Add new ADRs here for every major future decision (multiplayer transport, WS scaling,
Elo mechanics, tournament format, bot strength labeling, etc.).*
