"use client";

/**
 * Restrained atmosphere: subtle floating dust motes + gentle fog. The board stays the
 * visual focus; this adds depth only.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 220;

export function Atmosphere({ enabled }: { enabled: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const offsets = useMemo(
    () =>
      new Float32Array(
        Array.from({ length: COUNT }, (_, i) => Math.sin(i * 12.9898) * 43758.5453 % 1),
      ),
    [],
  );

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (offsets[i] * 2 - 1) * 10;
      arr[i * 3 + 1] = ((i * 0.37) % 1) * 5 + 0.3;
      arr[i * 3 + 2] = ((i * 0.53) % 1) * 20 - 10;
    }
    return arr;
  }, [offsets]);

  useFrame((state) => {
    if (!ref.current || !enabled) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.01;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const base = pos.getY(i);
      pos.setY(i, base + Math.sin(t * 0.4 + i) * 0.0004);
    }
    pos.needsUpdate = true;
  });

  if (!enabled) return null;

  return (
    <>
      <fog attach="fog" args={["#0a0808", 14, 42]} />
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color="#cfb98a"
          transparent
          opacity={0.35}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </>
  );
}
