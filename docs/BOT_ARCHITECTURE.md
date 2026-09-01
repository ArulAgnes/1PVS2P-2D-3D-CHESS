# ARCANE CHESS — BOT ARCHITECTURE

In-house chess AI (`src/features/chess/bot.ts`). No external engines (no Stockfish /
LC0), no pretrained weights, no network calls (constitution §46/§151).

## Search

- **Negamax** with **alpha-beta pruning**.
- **Move ordering**: captures first (MVV-LVA) to improve pruning.
- Terminal nodes use engine `status` (checkmate / stalemate / draw).

## Evaluation

- Material values: pawn 100, knight 320, bishop 330, rook 500, queen 900.
- Piece-square tables for all six piece types (development/center/king-safety heuristics),
  mirrored for black.
- Returns centipawns from White's perspective.

## Difficulty (target, not verified Elo)

| Profile | Target | Depth | Noise |
|---------|--------|-------|-------|
| Stone Apprentice | 100 | 1 | 0.85 |
| Rune Initiate | 400 | 1 | 0.50 |
| Ash Squire | 800 | 2 | 0.35 |
| Obsidian Knight | 1200 | 2 | 0.12 |
| Granite Sentinel | 1600 | 3 | 0.03 |
| Arcane Guardian | 2000 | 3 | 0 |
| Grand Archmage | 2500 | 3 | 0 |

- **Noise** = probability of a random legal move (blunder) — higher = weaker.
- **Depth** = negamax depth.
- The UI labels these as *target* difficulties and **never** claims objective Elo
  equivalence (constitution §16/§55).

## Safety

- `chooseBotMove` always returns a legal move when one exists (never "no move").
- Bot computation runs on the client in this build (no server game loop yet); it is
  time-boxed by search depth and fast enough for interactive play.
- The bot's clock usage is currently cosmetic (no server clock yet); documented.

## Testing

`src/features/chess/bot.test.ts` — 5 tests: legality, 30 consecutive legal moves,
mate-in-1 finding, material evaluation, profile mapping.
