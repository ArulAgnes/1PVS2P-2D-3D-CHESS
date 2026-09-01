"use client";

/**
 * Camera rig: slightly-elevated board-centered default with orbit controls (optional)
 * for the prototype. Keeps the board readable and produces no excessive distortion.
 */

import { OrbitControls } from "@react-three/drei";

export function CameraRig() {
  return (
    <>
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={6}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.05}
        enableDamping
        dampingFactor={0.08}
        target={[0, 0, 0]}
      />
    </>
  );
}
