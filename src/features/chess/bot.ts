/**
 * In-house bot engine (Phase 6 foundation).
 *
 * A legitimate chess search engine: negamax + alpha-beta pruning + move ordering +
 * material/piece-square evaluation. NO external engines, NO pretrained weights, NO
 * network calls (constitution §46/§151).
 *
 * Difficulty tiers map to search depth + evaluation noise. These are "target"
 * difficulties, NOT verified Elo equivalents (constitution §16/§55).
 */

import {
  allMoves,
  applyRaw,
  isInCheck,
  PIECE_VALUES,
  type GameState,
  type Move,
} from "./engine";

export interface BotProfile {
  id: string;
  name: string;
  /** target difficulty label, never presented as verified Elo */
  target: number;
  tier: "BEGINNER" | "NOVICE" | "INTERMEDIATE" | "ADVANCED" | "MASTER" | "ARCANE";
  depth: number;
  /** 0..1 probability of suboptimal/random choice (higher = weaker) */
  noise: number;
}

export const BOT_PROFILES: BotProfile[] = [
  { id: "stone-apprentice", name: "Stone Apprentice", target: 100, tier: "BEGINNER", depth: 1, noise: 0.85 },
  { id: "rune-initiate", name: "Rune Initiate", target: 400, tier: "BEGINNER", depth: 1, noise: 0.5 },
  { id: "ash-squire", name: "Ash Squire", target: 800, tier: "NOVICE", depth: 2, noise: 0.35 },
  { id: "obsidian-knight", name: "Obsidian Knight", target: 1200, tier: "INTERMEDIATE", depth: 2, noise: 0.12 },
  { id: "granite-sentinel", name: "Granite Sentinel", target: 1600, tier: "ADVANCED", depth: 3, noise: 0.03 },
  { id: "arcane-guardian", name: "Arcane Guardian", target: 2000, tier: "MASTER", depth: 3, noise: 0 },
  { id: "grand-archmage", name: "Grand Archmage", target: 2500, tier: "ARCANE", depth: 3, noise: 0 },
];

// Simplified piece-square tables (centered development, safe king). White perspective.
const PST_PAWN = [
  0, 0, 0, 0, 0, 0, 0, 0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5, 5, 10, 25, 25, 10, 5, 5,
  0, 0, 0, 20, 20, 0, 0, 0,
  5, -5, -10, 0, 0, -10, -5, 5,
  5, 10, 10, -20, -20, 10, 10, 5,
  0, 0, 0, 0, 0, 0, 0, 0,
];
const PST_KNIGHT = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20, 0, 0, 0, 0, -20, -40,
  -30, 0, 10, 15, 15, 10, 0, -30,
  -30, 5, 15, 20, 20, 15, 5, -30,
  -30, 0, 15, 20, 20, 15, 0, -30,
  -30, 5, 10, 15, 15, 10, 5, -30,
  -40, -20, 0, 5, 5, 0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];
const PST_BISHOP = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 10, 10, 5, 0, -10,
  -10, 5, 5, 10, 10, 5, 5, -10,
  -10, 0, 10, 10, 10, 10, 0, -10,
  -10, 10, 10, 10, 10, 10, 10, -10,
  -10, 5, 0, 0, 0, 0, 5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20,
];
const PST_ROOK = [
  0, 0, 0, 0, 0, 0, 0, 0,
  5, 10, 10, 10, 10, 10, 10, 5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  0, 0, 0, 5, 5, 0, 0, 0,
];
const PST_QUEEN = [
  -20, -10, -10, -5, -5, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 5, 5, 5, 0, -10,
  -5, 0, 5, 5, 5, 5, 0, -5,
  0, 0, 5, 5, 5, 5, 0, -5,
  -10, 5, 5, 5, 5, 5, 0, -10,
  -10, 0, 5, 0, 0, 0, 0, -10,
  -20, -10, -10, -5, -5, -10, -10, -20,
];
const PST_KING = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
  20, 20, 0, 0, 0, 0, 20, 20,
  20, 30, 10, 0, 0, 10, 30, 20,
];

function pstValue(type: keyof typeof PIECE_VALUES, index: number, color: "white" | "black"): number {
  let table: number[];
  switch (type) {
    case "pawn": table = PST_PAWN; break;
    case "knight": table = PST_KNIGHT; break;
    case "bishop": table = PST_BISHOP; break;
    case "rook": table = PST_ROOK; break;
    case "queen": table = PST_QUEEN; break;
    default: table = PST_KING;
  }
  // Black tables are mirrored vertically.
  const idx = color === "white" ? index : 63 - index;
  return table[idx];
}

/** Static evaluation from White's perspective (centipawns). */
export function evaluate(state: GameState): number {
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (!p) continue;
    const val = PIECE_VALUES[p.type] + pstValue(p.type, i, p.color);
    score += p.color === "white" ? val : -val;
  }
  return score;
}

function orderMoves(moves: Move[]): Move[] {
  const score = (m: Move) => {
    let s = 0;
    if (m.captured) s += 10 * PIECE_VALUES[m.captured] - PIECE_VALUES[m.piece];
    if (m.promotion) s += PIECE_VALUES[m.promotion];
    return s;
  };
  return moves.sort((a, b) => score(b) - score(a));
}

const MATE = 1_000_000;

function negamax(state: GameState, depth: number, alpha: number, beta: number): number {
  if (state.status === "checkmate") return -MATE;
  if (state.status === "draw" || state.status === "stalemate") return 0;
  if (depth === 0) return state.turn === "white" ? evaluate(state) : -evaluate(state);

  const moves = orderMoves(allMoves(state));
  if (moves.length === 0) return state.turn === "white" ? evaluate(state) : -evaluate(state);

  let best = -Infinity;
  for (const m of moves) {
    const child = applyRaw(state, m);
    // compute cheap status for the child (needed for terminal detection in search)
    const childState = withStatus(child);
    const val = -negamax(childState, depth - 1, -beta, -alpha);
    if (val > best) best = val;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/** Cheaply annotate checkmate/stalemate/draw status for search nodes. */
function withStatus(state: GameState): GameState {
  const opp = state.turn;
  const moves = allMoves(state);
  if (moves.length === 0) {
    const inCheck = isInCheck(state, opp);
    return { ...state, status: inCheck ? "checkmate" : "stalemate" };
  }
  return state;
}

/** Pick the bot's move for the side to move. */
export function chooseBotMove(state: GameState, profile: BotProfile): Move | null {
  const moves = allMoves(state);
  if (moves.length === 0) return null;

  // Emergency resilience: never return "no move" when legal moves exist.
  if (moves.length === 1) return moves[0];

  // Weak bots sometimes blunder: pick a random move.
  if (profile.noise > 0 && Math.random() < profile.noise) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const ordered = orderMoves(moves);
  let bestScore = -Infinity;
  let bestMove = ordered[0];

  for (const m of ordered) {
    const child = withStatus(applyRaw(state, m));
    const score = -negamax(child, Math.max(0, profile.depth - 1), -Infinity, Infinity);

    // Small jitter to make play less robotic at higher noise settings.
    const jitter = profile.noise > 0 ? (Math.random() - 0.5) * 2 * (profile.noise * 60) : 0;
    const finalScore = score + jitter;

    if (finalScore > bestScore) {
      bestScore = finalScore;
      bestMove = m;
    }
  }
  return bestMove;
}

export function getBotProfile(target: number): BotProfile {
  return (
    BOT_PROFILES.reduce((best, p) =>
      Math.abs(p.target - target) < Math.abs(best.target - target) ? p : best,
    ) ?? BOT_PROFILES[3]
  );
}
