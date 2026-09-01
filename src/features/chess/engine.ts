/**
 * Arcane Chess — complete standards-compliant chess engine.
 *
 * This module is the single source of truth for chess rules and will later back the
 * server-authoritative multiplayer layer. It is pure and deterministic: the same move
 * sequence always produces the same position (critical for future synchronization).
 *
 * Rules implemented:
 *   pawn (single/double/capture/en passant/promotion)
 *   knight, bishop, rook, queen, king
 *   castling (both sides, all restrictions)
 *   check / checkmate / stalemate
 *   threefold repetition, fifty-move rule, insufficient material
 *   FEN import/export, PGN export, SAN with disambiguation
 */

import {
  indexToSquare,
  squareToIndex,
  isValidSquare,
  type Square,
} from "./board";
import type { PieceColor, PieceType } from "./types";
import { oppositeColor } from "./types";

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface CastlingRights {
  wK: boolean;
  wQ: boolean;
  bK: boolean;
  bQ: boolean;
}

export type MoveKind = "normal" | "capture" | "castle" | "enpassant" | "promotion";

export interface Move {
  from: number;
  to: number;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PieceType;
  isCastle?: "kingside" | "queenside";
  isEnPassant?: boolean;
  isCheck?: boolean;
  isCheckmate?: boolean;
  /** Standard algebraic notation (filled on apply). */
  san: string;
}

export type GameStatus = "active" | "checkmate" | "stalemate" | "draw";

export type TerminationReason =
  | "checkmate"
  | "stalemate"
  | "threefold"
  | "fifty-move"
  | "insufficient-material"
  | "resignation";

export interface GameResult {
  outcome: "white" | "black" | "draw";
  reason: TerminationReason;
}

export interface HistoryEntry {
  move: Move;
  prevCastling: CastlingRights;
  prevEnPassant: number | null;
  prevHalfmove: number;
  prevFullmove: number;
  prevCounts: Record<string, number>;
}

export interface GameState {
  board: (Piece | null)[];
  turn: PieceColor;
  castling: CastlingRights;
  enPassant: number | null;
  halfmove: number;
  fullmove: number;
  history: HistoryEntry[];
  status: GameStatus;
  result: GameResult | null;
  /** position key -> occurrence count (threefold repetition). */
  counts: Record<string, number>;
}

export const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000,
};

export const START_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const FILES = "abcdefgh";

// ---------------------------------------------------------------------------
// Index helpers (index 0 == a1, 63 == h8)
// ---------------------------------------------------------------------------
const fileOf = (i: number) => i % 8;
const rankOf = (i: number) => (i / 8) | 0;
const idx = (f: number, r: number) => f + r * 8;
const inBounds = (f: number, r: number) => f >= 0 && f < 8 && r >= 0 && r < 8;

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
const BACK_RANK: PieceType[] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];

export function initialState(): GameState {
  const board: (Piece | null)[] = new Array(64).fill(null);
  for (let f = 0; f < 8; f++) {
    board[idx(f, 0)] = { type: BACK_RANK[f], color: "white" };
    board[idx(f, 1)] = { type: "pawn", color: "white" };
    board[idx(f, 6)] = { type: "pawn", color: "black" };
    board[idx(f, 7)] = { type: BACK_RANK[f], color: "black" };
  }
  const state: GameState = {
    board,
    turn: "white",
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    enPassant: null,
    halfmove: 0,
    fullmove: 1,
    history: [],
    status: "active",
    result: null,
    counts: {},
  };
  state.counts[positionKey(state)] = 1;
  return state;
}

// ---------------------------------------------------------------------------
// Attack / check detection
// ---------------------------------------------------------------------------
export function isSquareAttacked(state: GameState, sq: number, by: PieceColor): boolean {
  const f = fileOf(sq);
  const r = rankOf(sq);
  const b = state.board;

  // Pawns
  const pdr = by === "white" ? -1 : 1; // row of attacking pawn relative to square
  for (const df of [-1, 1]) {
    const nf = f + df;
    const nr = r + pdr;
    if (inBounds(nf, nr)) {
      const p = b[idx(nf, nr)];
      if (p && p.color === by && p.type === "pawn") return true;
    }
  }

  // Knights
  const knightOffsets = [
    [1, 2], [2, 1], [-1, 2], [-2, 1],
    [1, -2], [2, -1], [-1, -2], [-2, -1],
  ];
  for (const [df, dr] of knightOffsets) {
    const nf = f + df;
    const nr = r + dr;
    if (inBounds(nf, nr)) {
      const p = b[idx(nf, nr)];
      if (p && p.color === by && p.type === "knight") return true;
    }
  }

  // King
  for (const df of [-1, 0, 1]) {
    for (const dr of [-1, 0, 1]) {
      if (df === 0 && dr === 0) continue;
      const nf = f + df;
      const nr = r + dr;
      if (inBounds(nf, nr)) {
        const p = b[idx(nf, nr)];
        if (p && p.color === by && p.type === "king") return true;
      }
    }
  }

  // Sliding pieces
  const rookDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const bishopDirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

  for (const [df, dr] of rookDirs) {
    let nf = f + df;
    let nr = r + dr;
    while (inBounds(nf, nr)) {
      const p = b[idx(nf, nr)];
      if (p) {
        if (p.color === by && (p.type === "rook" || p.type === "queen")) return true;
        break;
      }
      nf += df;
      nr += dr;
    }
  }
  for (const [df, dr] of bishopDirs) {
    let nf = f + df;
    let nr = r + dr;
    while (inBounds(nf, nr)) {
      const p = b[idx(nf, nr)];
      if (p) {
        if (p.color === by && (p.type === "bishop" || p.type === "queen")) return true;
        break;
      }
      nf += df;
      nr += dr;
    }
  }

  return false;
}

export function findKing(state: GameState, color: PieceColor): number {
  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (p && p.type === "king" && p.color === color) return i;
  }
  return -1;
}

export function isInCheck(state: GameState, color: PieceColor): boolean {
  const k = findKing(state, color);
  if (k < 0) return false;
  return isSquareAttacked(state, k, oppositeColor(color));
}

// ---------------------------------------------------------------------------
// Raw move generation (pseudo-legal then self-check filtered, no SAN)
// ---------------------------------------------------------------------------
function rawMoves(state: GameState, from: number): Move[] {
  const piece = state.board[from];
  if (!piece) return [];
  const color = piece.color;
  const f = fileOf(from);
  const r = rankOf(from);
  const out: Move[] = [];
  const push = (to: number, extra: Partial<Move> = {}) =>
    out.push({ from, to, piece: piece.type, color, san: "", ...extra });

  const dir = color === "white" ? 1 : -1;
  const startRank = color === "white" ? 1 : 6;
  const promoRank = color === "white" ? 7 : 0;

  const pushPromotions = (to: number, extra: Partial<Move> = {}) => {
    for (const promotion of ["queen", "rook", "bishop", "knight"] as PieceType[]) {
      push(to, { ...extra, promotion });
    }
  };

  if (piece.type === "pawn") {
    const one = r + dir;
    if (inBounds(f, one)) {
      const target = state.board[idx(f, one)];
      if (!target) {
        if (one === promoRank) pushPromotions(idx(f, one));
        else {
          push(idx(f, one));
          if (r === startRank) {
            const two = r + 2 * dir;
            if (!state.board[idx(f, two)]) push(idx(f, two));
          }
        }
      }
    }
    // captures
    for (const df of [-1, 1]) {
      const nf = f + df;
      const nr = r + dir;
      if (!inBounds(nf, nr)) continue;
      const target = state.board[idx(nf, nr)];
      if (target && target.color !== color) {
        if (nr === promoRank) pushPromotions(idx(nf, nr), { captured: target.type });
        else push(idx(nf, nr), { captured: target.type });
      } else if (!target && state.enPassant === idx(nf, nr)) {
        const epPawn = state.board[idx(nf, r)];
        if (epPawn && epPawn.color !== color && epPawn.type === "pawn") {
          push(idx(nf, nr), { captured: "pawn", isEnPassant: true });
        }
      }
    }
    return out;
  }

  if (piece.type === "knight") {
    const offs = [
      [1, 2], [2, 1], [-1, 2], [-2, 1],
      [1, -2], [2, -1], [-1, -2], [-2, -1],
    ];
    for (const [df, dr] of offs) {
      const nf = f + df;
      const nr = r + dr;
      if (!inBounds(nf, nr)) continue;
      const target = state.board[idx(nf, nr)];
      if (!target) push(idx(nf, nr));
      else if (target.color !== color) push(idx(nf, nr), { captured: target.type });
    }
    return out;
  }

  if (piece.type === "bishop" || piece.type === "rook" || piece.type === "queen") {
    const dirs: number[][] = [];
    if (piece.type !== "rook") dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
    if (piece.type !== "bishop") dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
    for (const [df, dr] of dirs) {
      let nf = f + df;
      let nr = r + dr;
      while (inBounds(nf, nr)) {
        const target = state.board[idx(nf, nr)];
        if (!target) push(idx(nf, nr));
        else {
          if (target.color !== color) push(idx(nf, nr), { captured: target.type });
          break;
        }
        nf += df;
        nr += dr;
      }
    }
    return out;
  }

  // King
  for (const df of [-1, 0, 1]) {
    for (const dr of [-1, 0, 1]) {
      if (df === 0 && dr === 0) continue;
      const nf = f + df;
      const nr = r + dr;
      if (!inBounds(nf, nr)) continue;
      const target = state.board[idx(nf, nr)];
      if (!target) push(idx(nf, nr));
      else if (target.color !== color) push(idx(nf, nr), { captured: target.type });
    }
  }

  // Castling
  if (color === "white" && from === 4) {
    const opp = "black";
    if (
      state.castling.wK &&
      !state.board[5] && !state.board[6] &&
      !isSquareAttacked(state, 4, opp) &&
      !isSquareAttacked(state, 5, opp) &&
      !isSquareAttacked(state, 6, opp)
    ) {
      push(6, { isCastle: "kingside" });
    }
    if (
      state.castling.wQ &&
      !state.board[3] && !state.board[2] && !state.board[1] &&
      !isSquareAttacked(state, 4, opp) &&
      !isSquareAttacked(state, 3, opp) &&
      !isSquareAttacked(state, 2, opp)
    ) {
      push(2, { isCastle: "queenside" });
    }
  }
  if (color === "black" && from === 60) {
    const opp = "white";
    if (
      state.castling.bK &&
      !state.board[61] && !state.board[62] &&
      !isSquareAttacked(state, 60, opp) &&
      !isSquareAttacked(state, 61, opp) &&
      !isSquareAttacked(state, 62, opp)
    ) {
      push(62, { isCastle: "kingside" });
    }
    if (
      state.castling.bQ &&
      !state.board[59] && !state.board[58] && !state.board[57] &&
      !isSquareAttacked(state, 60, opp) &&
      !isSquareAttacked(state, 59, opp) &&
      !isSquareAttacked(state, 58, opp)
    ) {
      push(58, { isCastle: "queenside" });
    }
  }

  return out;
}

/** Fast apply used for legality filtering and bot search. Does not compute SAN/history. */
export function applyRaw(state: GameState, move: Move): GameState {
  const board = state.board.slice();
  const piece = board[move.from];
  if (!piece) return state;

  board[move.from] = null;
  board[move.to] = piece.type === "pawn" && move.promotion
    ? { type: move.promotion, color: piece.color }
    : piece;

  if (move.isEnPassant) {
    board[idx(fileOf(move.to), rankOf(move.from))] = null;
  }
  if (move.isCastle) {
    if (move.color === "white") {
      if (move.isCastle === "kingside") {
        board[5] = board[7];
        board[7] = null;
      } else {
        board[3] = board[0];
        board[0] = null;
      }
    } else {
      if (move.isCastle === "kingside") {
        board[61] = board[63];
        board[63] = null;
      } else {
        board[59] = board[56];
        board[56] = null;
      }
    }
  }

  const castling = { ...state.castling };
  if (piece.type === "king") {
    if (piece.color === "white") {
      castling.wK = false;
      castling.wQ = false;
    } else {
      castling.bK = false;
      castling.bQ = false;
    }
  }
  if (move.from === 0 || move.to === 0) castling.wQ = false;
  if (move.from === 7 || move.to === 7) castling.wK = false;
  if (move.from === 56 || move.to === 56) castling.bQ = false;
  if (move.from === 63 || move.to === 63) castling.bK = false;

  let enPassant: number | null = null;
  if (piece.type === "pawn" && Math.abs(rankOf(move.to) - rankOf(move.from)) === 2) {
    enPassant = idx(fileOf(move.from), (rankOf(move.from) + rankOf(move.to)) / 2);
  }

  const isPawnOrCapture = piece.type === "pawn" || !!move.captured;
  const halfmove = isPawnOrCapture ? 0 : state.halfmove + 1;
  const fullmove = state.fullmove + (piece.color === "black" ? 1 : 0);

  return {
    ...state,
    board,
    turn: oppositeColor(piece.color),
    castling,
    enPassant,
    halfmove,
    fullmove,
  };
}

/** Legal (self-check filtered) raw moves. No SAN. */
export function movesFor(state: GameState, from: number): Move[] {
  const piece = state.board[from];
  if (!piece || piece.color !== state.turn) return [];
  return rawMoves(state, from).filter((m) => {
    const child = applyRaw(state, m);
    const king = findKing(child, piece.color);
    if (king < 0) return false;
    return !isSquareAttacked(child, king, oppositeColor(piece.color));
  });
}

export function allMoves(state: GameState): Move[] {
  const out: Move[] = [];
  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (p && p.color === state.turn) out.push(...movesFor(state, i));
  }
  return out;
}

// ---------------------------------------------------------------------------
// SAN
// ---------------------------------------------------------------------------
const PIECE_LETTER: Record<PieceType, string> = {
  pawn: "",
  knight: "N",
  bishop: "B",
  rook: "R",
  queen: "Q",
  king: "K",
};

function sanFor(state: GameState, move: Move, isCheck: boolean, isCheckmate: boolean): string {
  if (move.isCastle) return move.isCastle === "kingside" ? "O-O" : "O-O-O";

  const letter = PIECE_LETTER[move.piece];
  let disamb = "";

  if (move.piece !== "pawn" && move.piece !== "king") {
    const others = allMoves(state).filter(
      (m) => m.to === move.to && m.from !== move.from && m.piece === move.piece,
    );
    if (others.length > 0) {
      const fromF = fileOf(move.from);
      const fromR = rankOf(move.from);
      const sameFile = others.some((m) => fileOf(m.from) === fromF);
      const sameRank = others.some((m) => rankOf(m.from) === fromR);
      if (!sameFile) disamb = FILES[fromF];
      else if (!sameRank) disamb = String(fromR + 1);
      else disamb = FILES[fromF] + String(fromR + 1);
    }
  }

  const captureMark = move.captured ? "x" : "";
  const fromFile = move.piece === "pawn" && move.captured ? FILES[fileOf(move.from)] : "";
  const to = indexToSquare(move.to);
  const promo = move.promotion ? "=" + PIECE_LETTER[move.promotion] : "";
  const suffix = isCheckmate ? "#" : isCheck ? "+" : "";

  return `${letter}${disamb}${fromFile}${captureMark}${to}${promo}${suffix}`;
}

// ---------------------------------------------------------------------------
// Full apply (computes SAN, status, draws, history)
// ---------------------------------------------------------------------------
export function applyMove(state: GameState, move: Move): GameState {
  const next = applyRaw(state, move);
  const oppColor = oppositeColor(move.color);
  const oppMoves = allMoves(next);
  const inCheck = oppMoves.length > 0 ? false : isInCheck(next, oppColor);

  let status: GameStatus = "active";
  let result: GameResult | null = null;
  let isCheckmate = false;
  let isCheck = false;

  if (oppMoves.length === 0) {
    if (inCheck || isInCheck(next, oppColor)) {
      status = "checkmate";
      isCheckmate = true;
      result = { outcome: move.color, reason: "checkmate" };
    } else {
      status = "stalemate";
      result = { outcome: "draw", reason: "stalemate" };
    }
  } else if (isInCheck(next, oppColor)) {
    isCheck = true;
  }

  // Draw rules
  if (status === "active") {
    if (next.halfmove >= 100) {
      status = "draw";
      result = { outcome: "draw", reason: "fifty-move" };
    } else if (hasInsufficientMaterial(next)) {
      status = "draw";
      result = { outcome: "draw", reason: "insufficient-material" };
    } else {
      const key = positionKey(next);
      const count = (next.counts[key] || 0) + 1;
      next.counts[key] = count;
      if (count >= 3) {
        status = "draw";
        result = { outcome: "draw", reason: "threefold" };
      }
    }
  }

  const annotated: Move = { ...move, isCheck, isCheckmate };
  annotated.san = sanFor(state, move, isCheck, isCheckmate);

  return {
    ...next,
    status,
    result,
    history: [
      ...state.history,
      {
        move: annotated,
        prevCastling: state.castling,
        prevEnPassant: state.enPassant,
        prevHalfmove: state.halfmove,
        prevFullmove: state.fullmove,
        prevCounts: { ...state.counts },
      },
    ],
  };
}

export function undoMove(state: GameState): GameState {
  const history = state.history;
  if (history.length === 0) return state;
  const last = history[history.length - 1];
  const move = last.move;

  const board = state.board.slice();
  const piece = board[move.to];
  board[move.to] = null;
  board[move.from] =
    move.promotion
      ? { type: "pawn", color: move.color }
      : piece;

  if (move.isEnPassant) {
    board[idx(fileOf(move.to), rankOf(move.from))] = { type: "pawn", color: oppositeColor(move.color) };
  } else if (move.captured) {
    board[move.to] = { type: move.captured, color: oppositeColor(move.color) };
  }
  if (move.isCastle) {
    if (move.color === "white") {
      if (move.isCastle === "kingside") {
        board[7] = board[5];
        board[5] = null;
      } else {
        board[0] = board[3];
        board[3] = null;
      }
    } else {
      if (move.isCastle === "kingside") {
        board[63] = board[61];
        board[61] = null;
      } else {
        board[56] = board[59];
        board[59] = null;
      }
    }
  }

  const fullmove = last.prevFullmove;

  return {
    ...state,
    board,
    turn: move.color,
    castling: last.prevCastling,
    enPassant: last.prevEnPassant,
    halfmove: last.prevHalfmove,
    fullmove,
    history: history.slice(0, -1),
    status: "active",
    result: null,
    counts: last.prevCounts,
  };
}

export function resign(state: GameState, color: PieceColor): GameState {
  return {
    ...state,
    status: "draw",
    result: {
      outcome: oppositeColor(color),
      reason: "resignation",
    },
  };
}

// ---------------------------------------------------------------------------
// Draw helpers
// ---------------------------------------------------------------------------
function hasInsufficientMaterial(state: GameState): boolean {
  const pieces: Piece[] = [];
  for (const p of state.board) if (p) pieces.push(p);
  const nonKings = pieces.filter((p) => p.type !== "king");
  if (nonKings.length === 0) return true;
  if (nonKings.length === 1) return nonKings[0].type === "bishop" || nonKings[0].type === "knight";
  if (nonKings.length === 2 && nonKings.every((p) => p.type === "bishop")) {
    // bishops only: draw if all bishops sit on same color squares
    let colors = 0;
    for (let i = 0; i < 64; i++) {
      const p = state.board[i];
      if (p && p.type === "bishop") colors |= 1 << ((fileOf(i) + rankOf(i)) % 2);
    }
    if (colors === 1 || colors === 2) return colors === 1 ? true : false;
    // colors is bitmask: 1 (light only) or 2 (dark only) => draw; 3 => different colors
    return colors !== 3;
  }
  return false;
}

// ---------------------------------------------------------------------------
// FEN / PGN / position key
// ---------------------------------------------------------------------------
export function positionKey(state: GameState): string {
  let s = "";
  for (let r = 7; r >= 0; r--) {
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = state.board[idx(f, r)];
      if (!p) {
        empty++;
      } else {
        if (empty) {
          s += empty;
          empty = 0;
        }
        const c = p.color === "white" ? p.type[0].toUpperCase() : p.type[0].toLowerCase();
        s += p.type === "knight" ? (p.color === "white" ? "N" : "n") : c;
      }
    }
    if (empty) s += empty;
    if (r > 0) s += "/";
  }
  s += ` ${state.turn === "white" ? "w" : "b"} `;
  const castling =
    (state.castling.wK ? "K" : "") +
    (state.castling.wQ ? "Q" : "") +
    (state.castling.bK ? "k" : "") +
    (state.castling.bQ ? "q" : "");
  s += castling || "-";
  s += ` ${state.enPassant != null ? indexToSquare(state.enPassant) : "-"}`;
  return s;
}

export function toFen(state: GameState): string {
  return `${positionKey(state)} ${state.halfmove} ${state.fullmove}`;
}

export function fromFen(fen: string): GameState {
  const parts = fen.trim().split(/\s+/);
  const boardPart = parts[0];
  const board: (Piece | null)[] = new Array(64).fill(null);
  const ranks = boardPart.split("/");
  for (let r = 0; r < 8; r++) {
    const rankStr = ranks[7 - r];
    let f = 0;
    for (const ch of rankStr) {
      if (ch >= "1" && ch <= "8") {
        f += Number(ch);
      } else {
        const color: PieceColor = ch === ch.toUpperCase() ? "white" : "black";
        const lower = ch.toLowerCase();
        const type: PieceType =
          lower === "p" ? "pawn"
          : lower === "n" ? "knight"
          : lower === "b" ? "bishop"
          : lower === "r" ? "rook"
          : lower === "q" ? "queen"
          : "king";
        board[idx(f, r)] = { type, color };
        f++;
      }
    }
  }
  const turn: PieceColor = parts[1] === "b" ? "black" : "white";
  const castlingStr = parts[2] ?? "-";
  const castling: CastlingRights = {
    wK: castlingStr.includes("K"),
    wQ: castlingStr.includes("Q"),
    bK: castlingStr.includes("k"),
    bQ: castlingStr.includes("q"),
  };
  const epStr = parts[3] ?? "-";
  const enPassant = epStr !== "-" && isValidSquare(epStr) ? squareToIndex(epStr as Square) : null;
  const halfmove = Number(parts[4] ?? 0);
  const fullmove = Number(parts[5] ?? 1);

  const state: GameState = {
    board,
    turn,
    castling,
    enPassant,
    halfmove,
    fullmove,
    history: [],
    status: "active",
    result: null,
    counts: {},
  };
  state.counts[positionKey(state)] = 1;
  return state;
}

export function toPgn(state: GameState): string {
  const lines: string[] = [];
  let line = "";
  for (let i = 0; i < state.history.length; i++) {
    const entry = state.history[i];
    const num = Math.floor(i / 2) + 1;
    const token = entry.move.san;
    if (i % 2 === 0) {
      const prefix = `${num}. ${token}`;
      if ((line + " " + prefix).trim().length > 79) {
        lines.push(line.trim());
        line = prefix;
      } else {
        line = line ? `${line} ${prefix}` : prefix;
      }
    } else {
      line = `${line} ${token}`;
      if (line.length > 79) {
        lines.push(line.trim());
        line = "";
      }
    }
  }
  if (line.trim()) lines.push(line.trim());
  const result =
    state.result?.outcome === "white" ? "1-0"
    : state.result?.outcome === "black" ? "0-1"
    : state.result?.outcome === "draw" ? "1/2-1/2"
    : "*";
  lines.push(result);
  return lines.join("\n");
}

export function squareName(index: number): Square {
  return indexToSquare(index);
}
