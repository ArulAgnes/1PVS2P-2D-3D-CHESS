/**
 * Deterministic chess board coordinate system.
 *
 * Files a-h (columns) and ranks 1-8 (rows). This module is the single source of
 * truth mapping chess squares to indices and 3D world coordinates. It is pure and
 * deterministic (per constitution: serializable, future-multiplayer-safe).
 */

export type FileIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type RankIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export type File = (typeof FILES)[number];

export const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;
export type Rank = (typeof RANKS)[number];

/** A chess square name, e.g. "e4". */
export type Square = `${File}${Rank}`;

export const SQUARE_COUNT = 64;

/** index 0 == a1, 7 == h1, 8 == a2, ... 63 == h8. */
export function squareToIndex(square: Square): number {
  const file = square.charCodeAt(0) - 97; // 'a' -> 0
  const rank = square.charCodeAt(1) - 49; // '1' -> 0
  return file + rank * 8;
}

export function indexToSquare(index: number): Square {
  const file = index % 8;
  const rank = Math.floor(index / 8);
  return `${FILES[file]}${RANKS[rank]}` as Square;
}

export function fileOf(square: Square): File {
  return square[0] as File;
}

export function rankOf(square: Square): Rank {
  return square[1] as Rank;
}

export function fileIndex(square: Square): number {
  return square.charCodeAt(0) - 97;
}

export function rankIndex(square: Square): number {
  return square.charCodeAt(1) - 49;
}

export function isValidSquare(value: string): value is Square {
  if (typeof value !== "string" || value.length !== 2) return false;
  const f = value.charCodeAt(0) - 97;
  const r = value.charCodeAt(1) - 49;
  return f >= 0 && f < 8 && r >= 0 && r < 8;
}

/** All 64 squares, a1..h8. */
export const ALL_SQUARES: Square[] = Array.from({ length: 64 }, (_, i) =>
  indexToSquare(i),
);

export type BoardOrientation = "white" | "black";

export interface WorldCoord {
  x: number;
  y: number;
  z: number;
}

/**
 * Board geometric constants. One square == 1 world unit. Board is centered at the
 * origin: files a..h map to x in [-3.5, 3.5], ranks 1..8 map to z (see orientation).
 */
export const SQUARE_SIZE = 1.0;
export const BOARD_SIZE = SQUARE_SIZE * 8;
export const BOARD_THICKNESS = 0.18;
export const PIECE_BASE_Y = BOARD_THICKNESS;

const HALF = BOARD_SIZE / 2; // 4.0

/**
 * Map a square to its world position. y is the board top surface (piece base).
 * Orientation flips the z axis so that rank 1 is at -z from white's perspective.
 */
export function squareToWorld(square: Square, orientation: BoardOrientation = "white"): WorldCoord {
  const f = fileIndex(square);
  const r = rankIndex(square);
  const x = f * SQUARE_SIZE + SQUARE_SIZE / 2 - HALF;
  // From white's perspective, rank 1 (r=0) is nearest the camera (bottom of screen).
  const zRaw = r * SQUARE_SIZE + SQUARE_SIZE / 2 - HALF;
  const z = orientation === "white" ? zRaw : -zRaw;
  return { x, y: PIECE_BASE_Y, z };
}

export interface SquareCoord {
  file: number;
  rank: number;
}

/**
 * Inverse mapping. Returns the board square for a world (x,z) position. The y
 * coordinate is ignored. Returns null when out of bounds.
 */
export function worldToSquare(
  x: number,
  z: number,
  orientation: BoardOrientation = "white",
): Square | null {
  const f = Math.floor(x + HALF);
  const zLocal = orientation === "white" ? z : -z;
  const r = Math.floor(zLocal + HALF);
  if (f < 0 || f > 7 || r < 0 || r > 7) return null;
  return `${FILES[f]}${RANKS[r]}` as Square;
}

/**
 * Piece orientation (yaw, radians) so pieces naturally face the opponent.
 * White faces one direction, black the opposite.
 */
export function pieceYaw(color: "white" | "black"): number {
  return color === "white" ? 0 : Math.PI;
}
