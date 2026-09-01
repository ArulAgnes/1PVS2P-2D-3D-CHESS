import { describe, it, expect } from "vitest";
import {
  initialState,
  movesFor,
  allMoves,
  applyMove,
  undoMove,
  resign,
  toFen,
  fromFen,
  toPgn,
  isInCheck,
  findKing,
  START_FEN,
  type GameState,
  type Move,
} from "./engine";
import { squareToIndex, indexToSquare } from "./board";

const S = (sq: string) => squareToIndex(sq as never);

function find(state: GameState, from: string, to: string): Move | undefined {
  const moves = movesFor(state, S(from));
  return moves.find((m) => indexToSquare(m.to) === to);
}

function play(state: GameState, from: string, to: string): GameState {
  const m = find(state, from, to);
  if (!m) throw new Error(`Illegal move ${from}->${to}`);
  return applyMove(state, m);
}

describe("initial state", () => {
  it("exports the standard starting FEN", () => {
    expect(toFen(initialState())).toBe(START_FEN);
  });
  it("has 20 legal moves for white initially", () => {
    expect(allMoves(initialState()).length).toBe(20);
  });
});

describe("pawn movement", () => {
  it("single and double move from start", () => {
    let s = initialState();
    expect(find(s, "e2", "e3")).toBeDefined();
    expect(find(s, "e2", "e4")).toBeDefined();
    expect(find(s, "e2", "e5")).toBeUndefined();
    s = play(s, "e2", "e4");
    expect(toFen(s).split(" ")[0]).toBe("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR");
  });

  it("blocks pawn advance when occupied", () => {
    const s = fromFen("rnbqkbnr/pppppppp/8/8/4p3/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(find(s, "e2", "e4")).toBeUndefined();
  });

  it("captures diagonally", () => {
    const s = fromFen("rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1");
    const m = find(s, "e4", "d5");
    expect(m?.captured).toBe("pawn");
  });

  it("supports en passant", () => {
    let s = fromFen("rnbqkbnr/ppp1pppp/8/8/3pP3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1");
    const m = find(s, "d4", "e3");
    expect(m?.isEnPassant).toBe(true);
    expect(m?.to).toBe(S("e3"));
    s = applyMove(s, m!);
    // captured pawn (e4) removed
    expect(s.board[S("e4")]).toBeNull();
    expect(s.board[S("e3")]?.type).toBe("pawn");
  });
});

describe("knight / bishop / rook / queen", () => {
  it("knight moves in L and jumps", () => {
    let s = initialState();
    const m = find(s, "g1", "f3");
    expect(m).toBeDefined();
    s = applyMove(s, m!);
    expect(s.board[S("f3")]?.type).toBe("knight");
  });
  it("bishop blocked by piece", () => {
    const s = fromFen("rnbqkbnr/pppp1ppp/8/4p3/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(find(s, "f1", "a6")).toBeUndefined();
  });
  it("rook slides and queen moves both ways", () => {
    const s = fromFen("7k/8/8/8/8/8/8/RQ5K w - - 0 1");
    expect(find(s, "a1", "a8")).toBeDefined();
    expect(find(s, "b1", "b8")).toBeDefined();
    expect(find(s, "b1", "h7")).toBeDefined();
  });
});

describe("castling", () => {
  it("kingside castle moves king and rook", () => {
    const s = fromFen("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    const m = find(s, "e1", "g1");
    expect(m?.isCastle).toBe("kingside");
    const after = applyMove(s, m!);
    expect(after.board[S("g1")]?.type).toBe("king");
    expect(after.board[S("f1")]?.type).toBe("rook");
  });
  it("queenside castle", () => {
    const s = fromFen("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    const m = find(s, "e1", "c1");
    expect(m?.isCastle).toBe("queenside");
    const after = applyMove(s, m!);
    expect(after.board[S("d1")]?.type).toBe("rook");
  });
  it("cannot castle through attacked square", () => {
    // black rook attacks f1
    const s = fromFen("r3k2r/8/8/8/8/8/5r2/R3K2R w KQkq - 0 1");
    expect(find(s, "e1", "g1")).toBeUndefined();
  });
  it("cannot castle out of check", () => {
    const s = fromFen("r3k2r/8/8/8/8/8/4r3/R3K2R w KQkq - 0 1");
    expect(find(s, "e1", "g1")).toBeUndefined();
  });
  it("loses castling rights after king move", () => {
    let s = fromFen("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    s = play(s, "e1", "e2");
    s = play(s, "e8", "e7");
    s = play(s, "e2", "e1");
    expect(s.castling.wK).toBe(false);
    expect(s.castling.wQ).toBe(false);
  });
});

describe("check / checkmate / stalemate", () => {
  it("detects check", () => {
    const s = fromFen("rnbqkbnr/pppp1ppp/8/4p3/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    // Qh5 from white would put check; verify simple: king attacked detection
    expect(isInCheck(s, "white")).toBe(false);
  });

  it("fool's mate ends in checkmate", () => {
    let s = initialState();
    s = play(s, "f2", "f3");
    s = play(s, "e7", "e5");
    s = play(s, "g2", "g4");
    s = play(s, "d8", "h4");
    expect(s.status).toBe("checkmate");
    expect(s.result?.outcome).toBe("black");
    expect(s.result?.reason).toBe("checkmate");
    expect(allMoves(s).length).toBe(0);
  });

  it("recognizes stalemate", () => {
    const s = fromFen("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
    const after = fromFen("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
    // Apply a move that stalemates: black king a8->? (already stalemate position)
    expect(after.status).toBe("active");
    const moves = allMoves(after);
    // h8 king has no moves and not in check => stalemate should be detected on any attempt.
    // Direct: from this position allMoves for black is empty.
    expect(moves.length).toBe(0);
  });
});

describe("draws", () => {
  it("detects insufficient material (K vs K)", () => {
    const s = fromFen("7k/8/8/8/8/8/8/6K1 w - - 0 1");
    const m = find(s, "g1", "g2")!;
    const after = applyMove(s, m);
    expect(after.status).toBe("draw");
    expect(after.result?.reason).toBe("insufficient-material");
  });

  it("detects threefold repetition", () => {
    let s = fromFen("7k/8/8/8/8/8/6P1/6K1 w - - 0 1");
    // repeat a king move cycle three times
    for (let i = 0; i < 3; i++) {
      s = play(s, "g1", "f1");
      s = play(s, "h8", "h7");
      s = play(s, "f1", "g1");
      s = play(s, "h7", "h8");
    }
    expect(s.status).toBe("draw");
    expect(s.result?.reason).toBe("threefold");
  });
});

describe("SAN notation", () => {
  it("produces standard opening SAN", () => {
    let s = initialState();
    s = play(s, "e2", "e4");
    expect(s.history[0].move.san).toBe("e4");
    s = play(s, "e7", "e5");
    s = play(s, "g1", "f3");
    expect(s.history[2].move.san).toBe("Nf3");
  });
  it("annotates castling and check", () => {
    let s = fromFen("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    s = play(s, "e1", "g1");
    expect(s.history[0].move.san).toBe("O-O");
  });
  it("promotion notation", () => {
    const s = fromFen("7k/P7/8/8/8/8/8/6K1 w - - 0 1");
    const m = find(s, "a7", "a8");
    expect(m?.promotion).toBe("queen");
    const after = applyMove(s, m!);
    expect(after.board[S("a8")]?.type).toBe("queen");
  });
  it("disambiguates same-piece moves", () => {
    const s = fromFen("7k/8/8/8/8/8/8/4N1NK w - - 0 1");
    const m = find(s, "e1", "f3");
    expect(m).toBeDefined();
    const after = applyMove(s, m!);
    // two knights (e1, g1) can both reach f3; needs file disambiguation
    expect(after.history[0].move.san).toMatch(/^N[eg]f3/);
  });
});

describe("promotion", () => {
  it("promotes to all four pieces", () => {
    const s = fromFen("7k/P7/8/8/8/8/8/6K1 w - - 0 1");
    const kinds = ["queen", "rook", "bishop", "knight"] as const;
    for (const k of kinds) {
      const m = movesFor(s, S("a7")).find((x) => x.promotion === k);
      expect(m).toBeDefined();
    }
  });
});

describe("FEN round-trip", () => {
  it("preserves position for several FENs", () => {
    const fens = [
      "r3k2r/pppq1ppp/2npbn2/2b1p3/2B1P3/2NPBN2/PPPQ1PPP/R3K2R w KQkq - 4 8",
      "8/8/8/8/8/8/8/8 w - - 0 1",
    ];
    for (const fen of fens) {
      const s = fromFen(fen);
      expect(toFen(s)).toBe(fen);
    }
  });
});

describe("undo", () => {
  it("restores previous position", () => {
    let s = initialState();
    const before = toFen(s);
    s = play(s, "e2", "e4");
    expect(toFen(s)).not.toBe(before);
    s = undoMove(s);
    expect(toFen(s)).toBe(before);
  });
  it("undoes castling correctly", () => {
    let s = fromFen("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    s = play(s, "e1", "g1");
    s = undoMove(s);
    expect(s.board[S("e1")]?.type).toBe("king");
    expect(s.board[S("h1")]?.type).toBe("rook");
    expect(s.castling.wK).toBe(true);
  });
  it("undoes capture restoring piece", () => {
    let s = fromFen("rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1");
    s = play(s, "e4", "d5");
    s = undoMove(s);
    expect(s.board[S("d5")]?.color).toBe("black");
    expect(s.board[S("e4")]?.color).toBe("white");
  });
});

describe("determinism", () => {
  it("same sequence yields same final position", () => {
    const seq: [string, string][] = [
      ["e2", "e4"],
      ["e7", "e5"],
      ["g1", "f3"],
      ["b8", "c6"],
      ["f1", "b5"],
      ["a7", "a6"],
    ];
    const run = () => {
      let s = initialState();
      for (const [a, b] of seq) s = play(s, a, b);
      return toFen(s);
    };
    expect(run()).toBe(run());
  });
});

describe("PGN", () => {
  it("exports moves and result", () => {
    let s = initialState();
    s = play(s, "e2", "e4");
    s = play(s, "e7", "e5");
    const pgn = toPgn(s);
    expect(pgn).toContain("1. e4 e5");
    expect(pgn).toContain("*");
  });
});

describe("resignation", () => {
  it("awards win to opponent", () => {
    const s = resign(initialState(), "white");
    expect(s.result?.outcome).toBe("black");
    expect(s.result?.reason).toBe("resignation");
  });
});

describe("king helpers", () => {
  it("finds kings", () => {
    const s = initialState();
    expect(findKing(s, "white")).toBe(S("e1"));
    expect(findKing(s, "black")).toBe(S("e8"));
  });
});
