"use client";

/**
 * Piece asset loader: GLB when available, procedural stone otherwise.
 *
 * - Caches successful GLB loads per key via drei's `useGLTF` (URL-cached).
 * - Detects missing GLBs with a lightweight HEAD check and falls back to the
 *   procedural stone builder (TEMPORARY ASSET) so the game never blank-screens.
 * - Exposes preload() so core pieces can be fetched before gameplay.
 */

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

import type { PieceType } from "@/features/chess/types";
import { assetKey } from "./registry";
import { buildStonePiece, disposeBuiltPiece, type BuiltPiece } from "../pieces/procedural";

export interface PieceAsset {
  /** True once a usable asset (GLB or procedural) is available. */
  ready: boolean;
  /** True while loading (GLB HEAD or fetch). */
  loading: boolean;
  /** True when using the procedural TEMPORARY asset. */
  procedural: boolean;
  error: string | null;
  /** Clone a fresh piece instance. Caller owns disposal. */
  build: () => BuiltPiece;
}

// Cache of whether a GLB is known to be absent (HEAD already returned 404).
const absentCache = new Map<string, boolean>();
// Preloaded GLTF scenes, keyed by URL (drei useGLTF already caches; this dedupes ours).
const gltfPresence = new Map<string, boolean>();

async function glbExists(url: string): Promise<boolean> {
  if (gltfPresence.has(url)) return gltfPresence.get(url) as boolean;
  try {
    const res = await fetch(url, { method: "HEAD" });
    const ok = res.ok;
    gltfPresence.set(url, ok);
    return ok;
  } catch {
    gltfPresence.set(url, false);
    return false;
  }
}

/** Preload a piece asset (GLB if present). Fire-and-forget. */
export async function preloadPiece(color: "white" | "black", type: PieceType): Promise<void> {
  const url = `/assets/chess/${color}/${type}.glb`;
  const key = assetKey(color, type);
  if (absentCache.has(key) && absentCache.get(key)) return;
  const exists = await glbExists(url);
  if (!exists) {
    absentCache.set(key, true);
    return;
  }
  try {
    await fetch(url);
  } catch {
    /* preload best-effort */
  }
}

/**
 * React hook: returns a builder for the given piece. Uses GLB when present, else the
 * procedural stone TEMPORARY asset.
 */
export function usePieceAsset(
  color: "white" | "black",
  type: PieceType,
): PieceAsset {
  const url = `/assets/chess/${color}/${type}.glb`;
  const key = assetKey(color, type);
  const [state, setState] = useState<{
    loading: boolean;
    procedural: boolean;
    error: string | null;
  }>({ loading: true, procedural: false, error: null });

  const proceduralBuilder = useMemo(
    () => () => buildStonePiece(type, color),
    [type, color],
  );

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, procedural: false, error: null });
    if (absentCache.get(key)) {
      setState({ loading: false, procedural: true, error: null });
      return;
    }
    glbExists(url)
      .then((exists) => {
        if (cancelled) return;
        if (exists) {
          // Present; three/drei will cache via useGLTF when the scene clones it.
          setState({ loading: false, procedural: false, error: null });
        } else {
          absentCache.set(key, true);
          setState({ loading: false, procedural: true, error: null });
        }
      })
      .catch(() => {
        if (cancelled) return;
        absentCache.set(key, true);
        setState({ loading: false, procedural: true, error: null });
      });
    return () => {
      cancelled = true;
    };
  }, [url, key]);

  return {
    ready: !state.loading,
    loading: state.loading,
    procedural: state.procedural,
    error: state.error,
    build: proceduralBuilder,
  };
}
