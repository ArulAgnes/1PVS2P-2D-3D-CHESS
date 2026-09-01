/**
 * GLB/GLTF asset registry.
 *
 * Maps a logical piece key -> asset URL. The runtime renders either a Blender-authored
 * GLB (when present at the URL) or falls back to the procedural stone mesh builder
 * (clearly-marked TEMPORARY ASSET). This single abstraction prevents duplicated loader
 * logic and permits a clean swap to final GLB art with zero scene changes.
 */

import type { PieceType } from "@/features/chess/types";

export type AssetColor = "white" | "black";

export type AssetKind = PieceType | "board";

export interface AssetEntry {
  kind: AssetKind;
  color: AssetColor | null;
  /** Public URL of the GLB. Null means "procedural fallback" for this asset. */
  url: string | null;
  /** True when we are intentionally using the temporary procedural asset. */
  procedural?: boolean;
}

const CHESS_BASE = "/assets/chess";

function glbFor(kind: AssetKind, color: AssetColor | null): string {
  return color ? `${CHESS_BASE}/${color}/${kind}.glb` : `${CHESS_BASE}/board/${kind}.glb`;
}

/**
 * Registry entries. For each key we record the *expected* GLB URL. The loader checks
 * whether the file exists at runtime (HEAD request) and falls back to procedural stone
 * geometry if not — the honest behavior required when Blender hasn't been executed yet.
 */
export const ASSET_REGISTRY: Record<string, AssetEntry> = buildRegistry();

function buildRegistry(): Record<string, AssetEntry> {
  const entries: Record<string, AssetEntry> = {};
  const kinds: AssetKind[] = ["pawn", "knight", "bishop", "rook", "queen", "king"];
  for (const color of ["white", "black"] as AssetColor[]) {
    for (const kind of kinds) {
      entries[`${color}:${kind}`] = {
        kind,
        color,
        url: glbFor(kind, color),
        procedural: false,
      };
    }
  }
  entries["board"] = { kind: "board", color: null, url: "/assets/board/board.glb" };
  return entries;
}

export function assetKey(color: AssetColor, kind: AssetKind): string {
  return `${color}:${kind}`;
}

/**
 * True when the runtime should treat this key as a procedural temporary asset.
 * The loader may mark an entry procedural:true when its GLB is absent.
 */
export function isProcedural(entry: AssetEntry): boolean {
  return entry.procedural === true || entry.url === null;
}
