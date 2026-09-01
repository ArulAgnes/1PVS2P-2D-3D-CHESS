import { describe, it, expect } from "vitest";
import {
  squareToIndex,
  indexToSquare,
  squareToWorld,
  worldToSquare,
  isValidSquare,
  ALL_SQUARES,
  pieceYaw,
  BOARD_SIZE,
  PIECE_BASE_Y,
} from "./board";

describe("squareToIndex / indexToSquare", () => {
  it("maps a1 -> 0 and h8 -> 63", () => {
    expect(squareToIndex("a1")).toBe(0);
    expect(squareToIndex("h8")).toBe(63);
  });

  it("maps b2 -> 9 and d4 -> 27", () => {
    expect(squareToIndex("b2")).toBe(9);
    expect(squareToIndex("d4")).toBe(27);
  });

  it("round-trips every square", () => {
    for (const sq of ALL_SQUARES) {
      expect(indexToSquare(squareToIndex(sq))).toBe(sq);
    }
  });
});

describe("squareToWorld", () => {
  it("centers the board at the origin", () => {
    // a1 is bottom-left from white's perspective.
    const a1 = squareToWorld("a1", "white");
    expect(a1.x).toBeCloseTo(-3.5);
    expect(a1.z).toBeCloseTo(-3.5);
    expect(a1.y).toBeCloseTo(PIECE_BASE_Y);

    const h8 = squareToWorld("h8", "white");
    expect(h8.x).toBeCloseTo(3.5);
    expect(h8.z).toBeCloseTo(3.5);
  });

  it("maps e4 to x=0.5 (file e center), and d4 to x=-0.5", () => {
    const e4 = squareToWorld("e4", "white");
    expect(e4.x).toBeCloseTo(0.5);
    const d4 = squareToWorld("d4", "white");
    expect(d4.x).toBeCloseTo(-0.5);
    // The geometric center of the board lies exactly between the d and e files.
  });

  it("flips z for black orientation but keeps x", () => {
    const white = squareToWorld("a1", "white");
    const black = squareToWorld("a1", "black");
    expect(black.x).toBeCloseTo(white.x);
    expect(black.z).toBeCloseTo(-white.z);
  });
});

describe("worldToSquare", () => {
  it("round-trips squareToWorld for white", () => {
    for (const sq of ALL_SQUARES) {
      const w = squareToWorld(sq, "white");
      expect(worldToSquare(w.x, w.z, "white")).toBe(sq);
    }
  });

  it("round-trips for black orientation", () => {
    for (const sq of ALL_SQUARES) {
      const w = squareToWorld(sq, "black");
      expect(worldToSquare(w.x, w.z, "black")).toBe(sq);
    }
  });

  it("returns null out of bounds", () => {
    expect(worldToSquare(-10, 0, "white")).toBeNull();
    expect(worldToSquare(0, 20, "white")).toBeNull();
  });
});

describe("isValidSquare", () => {
  it("accepts valid squares", () => {
    expect(isValidSquare("e4")).toBe(true);
    expect(isValidSquare("a1")).toBe(true);
    expect(isValidSquare("h8")).toBe(true);
  });
  it("rejects invalid squares", () => {
    expect(isValidSquare("i1")).toBe(false);
    expect(isValidSquare("a9")).toBe(false);
    expect(isValidSquare("")).toBe(false);
    expect(isValidSquare("aa")).toBe(false);
  });
});

describe("pieceYaw", () => {
  it("faces white and black oppositely", () => {
    expect(pieceYaw("white")).toBe(0);
    expect(pieceYaw("black")).toBeCloseTo(Math.PI);
  });
});

describe("board constants", () => {
  it("has 8 squares per side", () => {
    expect(BOARD_SIZE).toBe(8);
  });
});
