/**
 * TEMPORARY ASSET — Procedural stone board.
 *
 * Ancient carved-stone slab: 8x8 readable squares, physical thickness, bevelled edges,
 * subtle stone displacement. Swaps for the Blender GLB via the registry.
 */

import * as THREE from "three";
import { BOARD_SIZE, BOARD_THICKNESS, SQUARE_SIZE } from "@/features/chess/board";

export const BOARD_COLORS = {
  light: "#cdbfa5",
  dark: "#3a342e",
  border: "#1a1714",
};

export interface BuiltBoard {
  group: THREE.Group;
  dispose: () => void;
}

export function buildStoneBoard(): BuiltBoard {
  const group = new THREE.Group();
  group.name = "ArcaneBoard";

  const disposables: Array<{ dispose: () => void }> = [];

  // Base slab
  const slabGeo = new THREE.BoxGeometry(BOARD_SIZE, BOARD_THICKNESS, BOARD_SIZE);
  const slabMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#2a2521"),
    roughness: 0.9,
    metalness: 0.02,
  });
  const slab = new THREE.Mesh(slabGeo, slabMat);
  slab.position.y = BOARD_THICKNESS / 2;
  slab.receiveShadow = true;
  slab.castShadow = true;
  group.add(slab);
  disposables.push(slabGeo, slabMat);

  // Checkered tiles (embedded on top)
  const tileGeo = new THREE.BoxGeometry(SQUARE_SIZE * 0.98, 0.02, SQUARE_SIZE * 0.98);
  const lightMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(BOARD_COLORS.light),
    roughness: 0.82,
    metalness: 0.0,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(BOARD_COLORS.dark),
    roughness: 0.88,
    metalness: 0.0,
  });
  const start = -BOARD_SIZE / 2 + SQUARE_SIZE / 2;
  for (let f = 0; f < 8; f++) {
    for (let r = 0; r < 8; r++) {
      const tile = new THREE.Mesh(tileGeo, (f + r) % 2 === 0 ? lightMat : darkMat);
      tile.position.set(
        start + f * SQUARE_SIZE,
        BOARD_THICKNESS + 0.01,
        start + r * SQUARE_SIZE,
      );
      tile.receiveShadow = true;
      group.add(tile);
    }
  }
  disposables.push(tileGeo, lightMat, darkMat);

  // Border trim
  const trimGeo = new THREE.BoxGeometry(BOARD_SIZE + 0.5, 0.12, BOARD_SIZE + 0.5);
  const trimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(BOARD_COLORS.border),
    roughness: 0.9,
    metalness: 0.05,
  });
  const trim = new THREE.Mesh(trimGeo, trimMat);
  trim.position.y = 0.05;
  trim.receiveShadow = true;
  group.add(trim);
  disposables.push(trimGeo, trimMat);

  return {
    group,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
