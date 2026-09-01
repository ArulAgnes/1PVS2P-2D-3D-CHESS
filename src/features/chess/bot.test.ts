import { describe, it, expect } from "vitest";
import { chooseBotMove, getBotProfile, BOT_PROFILES, evaluate } from "./bot";
import { initialState, applyMove, allMoves, fromFen } from "./engine";

describe("bot engine", () => {
  it("always returns a legal move when available", () => {
    const state = initialState();
    const move = chooseBotMove(state, BOT_PROFILES[0]);
    expect(move).not.toBeNull();
    // Applying must be valid (no throw) and produce a legal position.
    const next = applyMove(state, move!);
    expect(next.turn).toBe("black");
  });

  it("plays 30 consecutive legal moves", () => {
    let state = initialState();
    for (let i = 0; i < 30; i++) {
      const moves = allMoves(state);
      if (moves.length === 0) break;
      const move = chooseBotMove(state, BOT_PROFILES[2]);
      expect(move).not.toBeNull();
      state = applyMove(state, move!);
    }
    expect(state.history.length).toBeGreaterThanOrEqual(0);
  });

  it("finds a forced mate (back-rank mate-in-1)", () => {
    // Two rooks deliver a back-rank mate; the engine must find it (no noise).
    const state = fromFen("6k1/5ppp/8/8/8/8/8/RR4K1 w - - 0 1");
    const move = chooseBotMove(state, BOT_PROFILES[5]);
    expect(move).not.toBeNull();
    const next = applyMove(state, move!);
    expect(next.status).toBe("checkmate");
  });

  it("evaluates material advantage", () => {
    const rich = fromFen("7k/8/8/8/8/8/8/RRQ2K1 w - - 0 1");
    const poor = fromFen("7k/8/8/8/8/8/8/4K3 w - - 0 1");
    expect(evaluate(rich)).toBeGreaterThan(evaluate(poor));
  });

  it("maps targets to profiles", () => {
    expect(getBotProfile(100).tier).toBe("BEGINNER");
    expect(getBotProfile(4000).name).toBe("Grand Archmage");
  });
});
