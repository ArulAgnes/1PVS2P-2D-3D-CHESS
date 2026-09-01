"use client";

/**
 * <ChessPiece type=? color=? position=[x,y,z] /> — a single piece with smooth movement.
 *
 * The component resolves the asset (GLB or procedural TEMPORARY), positions it, and
 * animates position changes (a move) with an eased lerp and a subtle lift arc. It owns
 * lifecycle disposal of cloned geometry so long games don't leak.
 *
 * NOTE: this is presentation only — it renders a piece the authoritative engine state
 * has already placed; it never decides chess legality.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { PieceType } from "@/features/chess/types";
import { useSettings } from "@/stores/useSettings";
import { usePieceAsset } from "../assets/usePieceAsset";
import { disposeBuiltPiece } from "./procedural";

export interface ChessPieceProps {
  type: PieceType;
  color: "white" | "black";
  position: [number, number, number];
  rotationY?: number;
  selected?: boolean;
  hovered?: boolean;
  arcHeight?: number;
}

export function ChessPiece({
  type,
  color,
  position,
  rotationY = 0,
  selected = false,
  hovered = false,
  arcHeight = 0.55,
}: ChessPieceProps) {
  const asset = usePieceAsset(color, type);
  const groupRef = useRef<THREE.Group>(null);
  const [built, setBuilt] = useState<ReturnType<ReturnType<typeof usePieceAsset>["build"]> | null>(null);

  useEffect(() => {
    if (!asset.ready) return;
    const b = asset.build();
    setBuilt(b);
    return () => {
      setBuilt(null);
      if (b) disposeBuiltPiece(b);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.ready, asset.build]);

  const reducedMotion = useSettings((s) => s.reducedMotion);

  // Movement animation state.
  const pos = useRef(new THREE.Vector3(position[0], position[1], position[2]));
  const target = useMemo(
    () => new THREE.Vector3(position[0], position[1], position[2]),
    [position[0], position[1], position[2]],
  );
  const anim = useRef({ start: pos.current.clone(), dist: 0, prev: target.clone() });

  useEffect(() => {
    // A move is detected when the target changes by value.
    if (anim.current.prev.distanceTo(target) > 0.0001) {
      anim.current.start = pos.current.clone();
      anim.current.dist = pos.current.distanceTo(target);
      anim.current.prev.copy(target);
    }
  }, [target]);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const current = pos.current;
    const d = current.distanceTo(target);
    const state = anim.current;

    if (d > 0.001) {
      if (reducedMotion) {
        current.copy(target);
      } else {
        current.lerp(target, 0.16);
      }
      // lift arc based on progress
      const remaining = current.distanceTo(target);
      const progress = state.dist > 0.001 ? 1 - remaining / state.dist : 1;
      const arc = Math.sin(Math.min(1, progress) * Math.PI) * arcHeight;
      g.position.set(current.x, target.y + arc, current.z);
    } else {
      const t = reducedMotion ? 0 : 0;
      const selectionLift = selected ? 0.04 : hovered ? 0.015 : 0;
      const breathe = reducedMotion ? 0 : Math.sin(performance.now() / 600 + position[0]) * 0.002;
      g.position.set(target.x, target.y + selectionLift + breathe, target.z);
    }

    g.rotation.y = rotationY;
    const targetScale = selected ? 1.05 : hovered ? 1.01 : 1;
    const s = THREE.MathUtils.lerp(g.scale.x, targetScale, 0.18);
    g.scale.setScalar(s);
  });

  if (!built) {
    return <group ref={groupRef} position={position} />;
  }

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      <primitive object={built.group} />
    </group>
  );
}
