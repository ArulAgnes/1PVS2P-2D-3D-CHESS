# ARCANE CHESS — CHESS ENGINE

The in-house chess engine (`src/features/chess/engine.ts`) is the single source of truth
for chess rules and will back the future server-authoritative multiplayer layer. It is
pure and deterministic: the same move sequence always yields the same position.

## Representation

- Board: 64-cell array, index `0 == a1 … 63 == h8` (`file + rank*8`).
- `GameState`: `board`, `turn`, `castling`, `enPassant`, `halfmove`, `fullmove`,
  `history`, `status`, `result`, `counts` (position occurrence map for threefold).
- `Move`: `from`, `to`, `piece`, `color`, `captured?`, `promotion?`, `isCastle?`,
  `isEnPassant?`, `isCheck?`, `isCheckmate?`, `san`.

## Rules implemented

- Pawn: single/double push, diagonal capture, en passant, promotion (Q/R/B/N).
- Knight, bishop, rook, queen, king.
- Castling: kingside & queenside with all restrictions (unmoved king/rook, empty path,
  not in check, does not move through/into attacked squares).
- Check / checkmate / stalemate.
- Draws: threefold repetition (position key), fifty-move rule, insufficient material
  (K vs K, K+minor vs K, same-colored bishops).
- Resignation (explicit action).

## API (exports)

- `initialState()`, `fromFen(fen)`, `toFen(state)`, `toPgn(state)`, `positionKey(state)`
- `movesFor(state, from)` — legal moves (self-check filtered)
- `allMoves(state)` — all legal moves for side to move
- `applyMove(state, move)` — full apply (SAN, status, draws, history)
- `applyRaw(state, move)` — fast apply (used by bot search)
- `undoMove(state)`, `resign(state, color)`
- `isInCheck(state, color)`, `isSquareAttacked(state, sq, by)`, `findKing(state, color)`

## Design notes

- `applyMove` is immutable; `history` entries carry undo metadata (prior castling /
  en passant / halfmove / fullmove / counts).
- SAN disambiguation follows the standard file/rank/both rule.
- Position hashing uses the FEN board+turn+castling+en passant fields (not a random
  hash) — safe for threefold and future desync detection.

## Testing

`src/features/chess/engine.test.ts` — 32 tests covering pawn/knight/bishop/rook/queen/king
movement, castling (incl. attacked-square), check/checkmate (fool's mate), stalemate,
threefold, insufficient material, SAN, promotion, FEN round-trips, undo, determinism.
