/** Core chess domain types. Pure and serializable (future multiplayer-safe). */

import type { Square } from "./board";

export type PieceColor = "white" | "black";

export type PieceType = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface ColoredPiece {
  type: PieceType;
  color: PieceColor;
}

/** A placement: a piece (or null) on a square. */
export interface PiecePlacement {
  square: Square;
  piece: Piece;
}

export function oppositeColor(color: PieceColor): PieceColor {
  return color === "white" ? "black" : "white";
}

/** Standard glyph used for the white/black marble pieces. */
export const GLYPHS: Record<PieceType, string> = {
  king: "K",
  queen: "Q",
  rook: "R",
  bishop: "B",
  knight: "N",
  pawn: "",
};
