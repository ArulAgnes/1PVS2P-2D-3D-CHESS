# ARCANE CHESS — KNOWN LIMITATIONS

Honest register of what is and is not present in the current build. Nothing here is
hidden; future phases address each item explicitly.

## Implemented & tested

| Area | Status |
|------|--------|
| 3D foundation (R3F/Three.js, lighting, camera, atmosphere, quality tiers) | ✅ |
| Chess coordinate system + tests | ✅ |
| Asset registry + GLB loader + procedural fallback | ✅ |
| Complete standards-compliant chess engine (rules/SAN/FEN/PGN/hash/draws) | ✅ 32 tests |
| Playable 3D chess (selection, highlights, movement/capture animation, promotion) | ✅ |
| 2D fallback board | ✅ |
| In-house bot engine (negamax/alpha-beta) | ✅ 5 tests |
| Local 2-player hotseat | ✅ |

## Not yet implemented (future phases — NOT faked)

| Feature | Phase | Notes |
|---------|-------|-------|
| Online multiplayer (WebSocket, server-authoritative clocks/state) | 4 | Requires dedicated WS game service; not present |
| Private rooms + room codes + lobby + rematch | 5 | Not present |
| Matchmaking + Elo/rating | 6 | Not present |
| Tournament engine (Swiss/elimination) | 8 | Not present |
| Spectator + broadcast + director camera + chat | 9 | Not present |
| Accounts/auth, profiles, friends, presence, leaderboards, achievements, notifications, replay | 7 | Not present |
| Payments/cosmetics/monetization | 10 | Not present |

## Known technical limitations

1. **Blender GLBs not yet exported.** Pieces/board are honest procedural TEMPORARY
   assets (PBR stone meshes). The Blender scripts (`blender/scripts/`) are authored and
   ready; run them and drop exports into `public/assets/chess/{white,black}/` to swap
   to GLB with zero scene changes.
2. **Bot strength is a *target*, not verified Elo.** The UI labels difficulties, never
   claims FIDE/objective equivalence (constitution §16/§55).
3. **No persistence.** Games are in-memory for the browser session; there is no
   database model yet for games/moves/ratings. (PostgreSQL/Drizzle are wired and ready.)
4. **Single-process architecture.** No horizontal scaling / Redis / CDN yet; documented
   as future infrastructure work.
5. **No authentication.** The identity/auth layer (Phase 7) is not yet implemented.

## Deliberately out of scope now

- Real-money payments, video streaming (RTMP/HLS/WebRTC), and external AI engines.
