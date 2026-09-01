import { describe, it, expect } from "vitest";
import { ASSET_REGISTRY, assetKey, isProcedural } from "./registry";

describe("asset registry", () => {
  it("registers all 12 piece variants with GLB URLs", () => {
    for (const color of ["white", "black"]) {
      for (const kind of ["pawn", "knight", "bishop", "rook", "queen", "king"]) {
        const key = assetKey(color as "white" | "black", kind as never);
        const entry = ASSET_REGISTRY[key];
        expect(entry).toBeDefined();
        expect(entry.url).toBe(`/assets/chess/${color}/${kind}.glb`);
      }
    }
  });

  it("registers the board", () => {
    expect(ASSET_REGISTRY["board"].url).toBe("/assets/board/board.glb");
  });

  it("recognizes procedural entries", () => {
    expect(isProcedural({ kind: "pawn", color: "white", url: null, procedural: true })).toBe(
      true,
    );
    expect(isProcedural(ASSET_REGISTRY["board"])).toBe(false);
  });
});
