"use client";

/**
 * ArcaneBoard — the 3D stone board. Uses the procedural TEMPORARY asset for now; the
 * registry maps it to the Blender GLB when available.
 */

import { useEffect, useRef } from "react";
import type { Group } from "three";

import { buildStoneBoard } from "./proceduralBoard";

export function Board() {
  const groupRef = useRef<Group>(null);
  const builtRef = useRef<ReturnType<typeof buildStoneBoard> | null>(null);

  useEffect(() => {
    const built = buildStoneBoard();
    builtRef.current = built;
    if (groupRef.current) {
      groupRef.current.add(built.group);
    }
    return () => {
      built.dispose();
    };
  }, []);

  return <group ref={groupRef} />;
}
