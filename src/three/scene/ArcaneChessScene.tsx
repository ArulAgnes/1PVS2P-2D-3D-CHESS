"use client";

/**
 * ArcaneChessScene — the 3D hero scene.
 *
 * Composes: board, a set of pieces (hero knight + others), lighting rig, camera rig,
 * atmosphere. This is Phase 1's rendering foundation; interaction + full game state
 * arrive in Phase 2. Chess state and presentation state remain separate.
 */

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";

import { LightingRig } from "../lighting/LightingRig";
import { CameraRig } from "../camera/CameraRig";
import { Atmosphere } from "../environment/Atmosphere";
import { Board } from "../board/Board";
import { ChessPiece } from "../pieces/ChessPiece";
import { preloadPiece } from "../assets/usePieceAsset";
import { useSettings, resolveRenderSettings } from "@/stores/useSettings";
import { useIsMobile } from "../performance/useDevice";
import { pieceYaw } from "@/features/chess/board";

import type { PieceType } from "@/features/chess/types";

/** Hero arrangement for the Phase 1 prototype scene. */
const HERO_LAYOUT: Array<{ type: PieceType; color: "white" | "black"; x: number; z: number }> = [
  // White back rank (facing black, +z)
  { type: "rook", color: "white", x: -3.5, z: 3.5 },
  { type: "knight", color: "white", x: -2.5, z: 3.5 },
  { type: "bishop", color: "white", x: -1.5, z: 3.5 },
  { type: "queen", color: "white", x: 0.5, z: 3.5 },
  { type: "king", color: "white", x: -0.5, z: 3.5 },
  // White pawns
  { type: "pawn", color: "white", x: -3.5, z: 2.5 },
  { type: "pawn", color: "white", x: -2.5, z: 2.5 },
  { type: "pawn", color: "white", x: -1.5, z: 2.5 },
  // Black back rank (facing white, -z)
  { type: "rook", color: "black", x: 3.5, z: -3.5 },
  { type: "knight", color: "black", x: 2.5, z: -3.5 },
  { type: "queen", color: "black", x: -0.5, z: -3.5 },
  { type: "king", color: "black", x: 0.5, z: -3.5 },
];

export function ArcaneChessScene() {
  const quality = useSettings((s) => s.quality);
  const isMobile = useIsMobile();
  const [hydrated, setHydrated] = useState(false);

  const render = resolveRenderSettings(quality, isMobile);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Preload core hero pieces (GLB if present) so nothing pops in.
  useEffect(() => {
    const types: PieceType[] = ["knight", "pawn", "rook"];
    types.forEach((t) => {
      preloadPiece("white", t);
      preloadPiece("black", t);
    });
  }, []);

  if (!hydrated) return null;

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows={render.shadowMapEnabled}
        dpr={render.pixelRatio}
        camera={{ position: [0, 8.5, 9], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <LightingRig
            shadowMapSize={render.shadowMapSize}
            shadowMapEnabled={render.shadowMapEnabled}
          />
          <CameraRig />
          <Board />
          {HERO_LAYOUT.map((p, i) => (
            <ChessPiece
              key={`${p.color}-${p.type}-${i}`}
              type={p.type}
              color={p.color}
              position={[p.x, 0.18, p.z]}
              rotationY={pieceYaw(p.color)}
            />
          ))}
          <Atmosphere enabled={render.particlesEnabled && !isMobile} />
        </Suspense>
      </Canvas>
    </div>
  );
}
