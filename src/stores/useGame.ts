"use client";

/**
 * Game store — bridges the authoritative chess engine to the UI and 3D presentation.
 *
 * Chess state (GameState) is immutable and owned here; the 3D layer only reads it and
 * animates the *presentation* of moves. The engine remains the source of truth.
 *
 * `pieceIds` tracks a stable identity per piece so React keeps component instances
 * (and thus smooth movement animations) across moves.
 */

import { create } from "zustand";
import {
  initialState,
  movesFor,
  applyMove,
  undoMove,
  resign,
  toFen,
  toPgn,
  fromFen,
  type GameState,
  type Move,
} from "@/features/chess/engine";
import { indexToSquare } from "@/features/chess/board";
import type { PieceType } from "@/features/chess/types";
import {
  chooseBotMove,
  getBotProfile,
  type BotProfile,
} from "@/features/chess/bot";

export type GameMode = "local" | "bot";

export interface CaptureGhost {
  id: number;
  square: number;
  type: PieceType;
  color: "white" | "black";
}

const fileOf = (i: number) => i % 8;
const rankOf = (i: number) => (i / 8) | 0;

function initialPieceIds(state: GameState): (string | null)[] {
  return state.board.map((p, i) =>
    p ? `p-${p.color}-${p.type}-${i}` : null,
  );
}

function pieceIdsAfterMove(ids: (string | null)[], move: Move): (string | null)[] {
  const next = ids.slice();
  next[move.to] = next[move.from];
  next[move.from] = null;
  if (move.isEnPassant) {
    next[fileOf(move.to) + rankOf(move.from) * 8] = null;
  }
  if (move.isCastle) {
    if (move.color === "white") {
      if (move.isCastle === "kingside") {
        next[5] = next[7];
        next[7] = null;
      } else {
        next[3] = next[0];
        next[0] = null;
      }
    } else {
      if (move.isCastle === "kingside") {
        next[61] = next[63];
        next[63] = null;
      } else {
        next[59] = next[56];
        next[56] = null;
      }
    }
  }
  if (move.promotion) {
    next[move.to] = `p-${move.color}-${move.promotion}-${move.to}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return next;
}

interface GameStore {
  state: GameState;
  pieceIds: (string | null)[];
  mode: GameMode;
  botProfile: BotProfile;
  selected: number | null;
  lastMove: { from: number; to: number } | null;
  capture: CaptureGhost | null;
  pendingPromotion: { from: number; to: number } | null;
  thinking: boolean;

  newGame: (mode: GameMode, botTarget?: number) => void;
  selectSquare: (index: number) => void;
  makeMove: (from: number, to: number) => void;
  choosePromotion: (type: PieceType) => void;
  undo: () => void;
  resign: () => void;
  loadFen: (fen: string) => void;
  maybeBotMove: (profile?: BotProfile) => void;
}

let captureCounter = 0;
let botTimer: ReturnType<typeof setTimeout> | null = null;

const HUMAN_COLOR: "white" | "black" = "white";

export const useGame = create<GameStore>((set, get) => {
  const start = initialState();

  return {
    state: start,
    pieceIds: initialPieceIds(start),
    mode: "local",
    botProfile: getBotProfile(1200),
    selected: null,
    lastMove: null,
    capture: null,
    pendingPromotion: null,
    thinking: false,

    newGame: (mode, botTarget) => {
      if (botTimer) clearTimeout(botTimer);
      botTimer = null;
      const s = initialState();
      set({
        state: s,
        pieceIds: initialPieceIds(s),
        mode,
        botProfile: botTarget != null ? getBotProfile(botTarget) : get().botProfile,
        selected: null,
        lastMove: null,
        capture: null,
        pendingPromotion: null,
        thinking: false,
      });
      if (mode === "bot") get().maybeBotMove(get().botProfile);
    },

    selectSquare: (index) => {
      const { state, selected, mode } = get();
      if (state.status !== "active") return;
      if (mode === "bot" && state.turn !== HUMAN_COLOR) return;

      const piece = state.board[index];
      if (selected == null) {
        if (piece && piece.color === state.turn) set({ selected: index });
        return;
      }
      if (piece && piece.color === state.turn && index !== selected) {
        set({ selected: index });
        return;
      }
      const moves = movesFor(state, selected);
      const target = moves.find((m) => m.to === index);
      if (target) {
        get().makeMove(selected, index);
        return;
      }
      set({ selected: null });
    },

    makeMove: (from, to) => {
      const { state, mode, botProfile } = get();
      if (state.status !== "active") return;
      const moves = movesFor(state, from);
      const match = moves.find((m) => m.to === to);

      if (match && match.promotion) {
        set({ pendingPromotion: { from, to }, selected: null });
        return;
      }
      if (!match) {
        set({ selected: null });
        return;
      }

      const next = applyMove(state, match);
      const ghost: CaptureGhost | null = match.captured
        ? {
            id: ++captureCounter,
            square: match.to,
            type: match.captured,
            color: next.turn,
          }
        : null;

      set({
        state: next,
        pieceIds: pieceIdsAfterMove(get().pieceIds, match),
        selected: null,
        lastMove: { from, to },
        capture: ghost,
      });

      if (mode === "bot" && next.status === "active" && next.turn !== HUMAN_COLOR) {
        get().maybeBotMove(botProfile);
      }
    },

    choosePromotion: (type) => {
      const { state, pendingPromotion } = get();
      if (!pendingPromotion) return;
      const { from, to } = pendingPromotion;
      const move = movesFor(state, from).find((m) => m.to === to && m.promotion === type);
      if (!move) return;

      const next = applyMove(state, move);
      set({
        state: next,
        pieceIds: pieceIdsAfterMove(get().pieceIds, move),
        selected: null,
        pendingPromotion: null,
        lastMove: { from, to },
        capture: move.captured
          ? { id: ++captureCounter, square: to, type: move.captured, color: next.turn }
          : get().capture,
      });
      if (get().mode === "bot" && next.status === "active" && next.turn !== HUMAN_COLOR) {
        get().maybeBotMove(get().botProfile);
      }
    },

    undo: () => {
      if (botTimer) clearTimeout(botTimer);
      botTimer = null;
      const { state } = get();
      if (state.history.length === 0) return;
      const next = undoMove(state);
      set({
        state: next,
        pieceIds: initialPieceIds(next),
        selected: null,
        pendingPromotion: null,
        capture: null,
        thinking: false,
      });
    },

    resign: () => {
      const { state } = get();
      if (state.status !== "active") return;
      set({ state: resign(state, state.turn) });
    },

    loadFen: (fen) => {
      if (botTimer) clearTimeout(botTimer);
      botTimer = null;
      const next = fromFen(fen);
      set({
        state: next,
        pieceIds: initialPieceIds(next),
        selected: null,
        lastMove: null,
        capture: null,
        pendingPromotion: null,
        thinking: false,
      });
    },

    maybeBotMove: (profile) => {
      const { state, mode } = get();
      if (mode !== "bot") return;
      if (state.status !== "active") return;
      const p = profile ?? get().botProfile;
      set({ thinking: true });
      botTimer = setTimeout(() => {
        const current = get().state;
        const move: Move | null = chooseBotMove(current, p);
        if (!move) {
          set({ thinking: false });
          return;
        }
        const next = applyMove(current, move);
        const ghost: CaptureGhost | null = move.captured
          ? { id: ++captureCounter, square: move.to, type: move.captured, color: move.color }
          : null;
        set({
          state: next,
          pieceIds: pieceIdsAfterMove(get().pieceIds, move),
          lastMove: { from: move.from, to: move.to },
          capture: ghost,
          thinking: false,
        });
      }, 450 + Math.random() * 500);
    },
  };
});

export function moveListSan(state: GameState): string[] {
  return state.history.map((h) => h.move.san);
}

export { toFen, toPgn, indexToSquare };
export type { GameState, Move, PieceType };
