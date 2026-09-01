"use client";

/**
 * Cinematic lighting rig: KEY + FILL + RIM + ENV + soft shadow light.
 * No bare <ambientLight /> only; this gives pieces highlights, separation, and
 * contact shadows without crushing blacks.
 */

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

interface LightingRigProps {
  shadowMapSize: number;
  shadowMapEnabled: boolean;
}

export function LightingRig({ shadowMapSize, shadowMapEnabled }: LightingRigProps) {
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    gl.shadowMap.enabled = shadowMapEnabled;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl, shadowMapEnabled]);

  return (
    <>
      <ambientLight intensity={0.35} color="#cfd6e6" />

      {/* KEY — warm directional, casts shadows */}
      <directionalLight
        position={[6, 9, 5]}
        intensity={1.9}
        color="#fff4e0"
        castShadow={shadowMapEnabled}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      {/* FILL — cool, low, softens shadows without flattening */}
      <directionalLight position={[-8, 4, -3]} intensity={0.6} color="#aebcff" />

      {/* RIM — separates pieces from background */}
      <directionalLight position={[0, 5, -8]} intensity={0.9} color="#e8dfff" />

      {/* Subtle point fill near board center for readability */}
      <pointLight position={[0, 5, 0]} intensity={0.5} distance={20} color="#c9d6e0" />
    </>
  );
}
