"use client";

/**
 * 2D fallback board (WebGL unavailable or user preference).
 *
 * Uses the exact same engine state/store as the 3D board — never a separate game logic.
 * Pieces are Unicode glyphs on a real clickable 8x8 grid.
 */

import { useMemo } from "react";
import { useGame } from "@/stores/useGame";
import { movesFor } from "@/features/chess/engine";
import { indexToSquare, type BoardOrientation } from "@/features/chess/board";
import type { Piece, PieceType, PieceColor } from "@/features/chess/types";

const GLYPH: Record<PieceColor, Record<PieceType, string>> = {
  white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" },
  black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" },
};

export function GameBoard2D({ orientation }: { orientation: BoardOrientation }) {
  const state = useGame((s) => s.state);
  const selected = useGame((s) => s.selected);
  const lastMove = useGame((s) => s.lastMove);
  const selectSquare = useGame((s) => s.selectSquare);

  const legal = useMemo(() => {
    if (selected == null) return { moves: [], caps: new Set<number>() };
    const ms = movesFor(state, selected);
    return { moves: ms, caps: new Set(ms.filter((m) => m.captured).map((m) => m.to)) };
  }, [state, selected]);

  const cells: number[] = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const rank = orientation === "white" ? 7 - r : r;
      const file = orientation === "white" ? f : 7 - f;
      cells.push(file + rank * 8);
    }
  }

  return (
    <div className="grid aspect-square w-full select-none grid-cols-8 overflow-hidden rounded-lg border border-white/10 shadow-2xl">
      {cells.map((i) => {
        const p = state.board[i] as Piece | null;
        const isLight = (Math.floor(i / 8) + (i % 8)) % 2 === 0;
        const isSel = selected === i;
        const isLast = lastMove?.from === i || lastMove?.to === i;
        const isMove = legal.moves.some((m) => m.to === i);
        const isCap = legal.caps.has(i);

        return (
          <button
            key={i}
            onClick={() => selectSquare(i)}
            aria-label={indexToSquare(i)}
            className={`relative flex items-center justify-center text-3xl sm:text-4xl md:text-5xl ${
              isLight ? "bg-[#c9b898]" : "bg-[#7a5c46]"
            }`}
          >
            {isLast && <span className="absolute inset-0 bg-amber-300/30" />}
            {isSel && <span className="absolute inset-0 bg-amber-200/40" />}
            {p && (
              <span
                className={`relative z-10 drop-shadow ${
                  p.color === "white" ? "text-[#f5f0e6]" : "text-[#1c1613]"
                }`}
              >
                {GLYPH[p.color][p.type]}
              </span>
            )}
            {isMove && !isCap && (
              <span className="absolute z-20 h-3 w-3 rounded-full bg-emerald-300/70" />
            )}
            {isCap && (
              <span className="absolute inset-0 z-20 rounded-full border-4 border-rose-400/70" />
            )}
          </button>
        );
      })}
    </div>
  );
}
