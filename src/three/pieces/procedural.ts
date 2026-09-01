/**
 * TEMPORARY ASSET — Procedural stone piece geometry.
 *
 * These are NOT final Blender-authored GLBs. They are in-repo original procedural
 * meshes (marked TEMPORARY in the audit ledger) that produce believable ancient-stone
 * silhouettes and swap cleanly for the real GLB assets via the asset registry.
 *
 * Every piece: lathe/extrude silhouette + bevelled base + subtle vertex displacement
 * for "carved stone" surface. Materials are PBR MeshStandardMaterial (never
 * MeshBasicMaterial) with roughness variation and subtle color noise.
 */

import * as THREE from "three";

import type { PieceType } from "@/features/chess/types";

export interface StonePalette {
  base: THREE.ColorRepresentation;
  highlight: THREE.ColorRepresentation;
  /** accent emission for subtle arcane energy */
  accent: THREE.ColorRepresentation;
  roughness: number;
}

export const WHITE_STONE: StonePalette = {
  base: new THREE.Color("#d8d3c8"),
  highlight: new THREE.Color("#efeae0"),
  accent: new THREE.Color("#9fd8e8"),
  roughness: 0.86,
};

export const BLACK_STONE: StonePalette = {
  base: new THREE.Color("#24201e"),
  highlight: new THREE.Color("#38322f"),
  accent: new THREE.Color("#8f6bd8"),
  roughness: 0.9,
};

function stoneMaterial(palette: StonePalette): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(palette.base),
    roughness: palette.roughness,
    metalness: 0.04,
  });
}

/** Simple deterministic pseudo-random for stable displacement (reproducible build). */
function seeded(index: number, salt = 0): number {
  const x = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Apply subtle irregular "chiseled stone" displacement to a mesh's vertices, clamped
 * near the base so pieces keep a flat, non-floating bottom.
 */
function displaceStone(geometry: THREE.BufferGeometry, strength = 0.012, salt = 0): void {
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    // Keep feet flat: fade displacement to zero below y=0.06
    const fade = Math.min(1, y / 0.06);
    const d = (seeded(i, salt) - 0.5) * 2 * strength * fade;
    const nx = x || 0.0001;
    const ny = y || 0.0001;
    const nz = z || 0.0001;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    pos.setXYZ(i, x + (nx / len) * d, y + (ny / len) * d, z + (nz / len) * d);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}

function bevelBase(radius: number, height: number, radialSegments = 48): THREE.Mesh {
  // Lathe profile for a bevelled plinth.
  const pts: THREE.Vector2[] = [];
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = (t * t) * height; // ease-in toward top
    const r = radius * (1 - t * 0.08);
    pts.push(new THREE.Vector2(r, y + 0.001));
  }
  pts.push(new THREE.Vector2(radius * 0.72, height * 0.9));
  const geo = new THREE.LatheGeometry(pts, radialSegments);
  const mesh = new THREE.Mesh(geo);
  return mesh;
}

function mergeInto(target: THREE.Group, mesh: THREE.Mesh): THREE.BufferGeometry {
  const geo = mesh.geometry.clone();
  target.add(new THREE.Mesh(geo, mesh.material));
  return geo;
}

export interface BuiltPiece {
  group: THREE.Group;
  material: THREE.MeshStandardMaterial;
  /** Disposable per-instance geometries (clone reuse); dispose on unmount. */
  geometries: THREE.BufferGeometry[];
}

/**
 * Build one chess piece (procedural stone). Returns a Group with origin at the base
 * (y=0 = piece base plane), scaled so it fits a 1-unit square at ~0.72 max footprint.
 */
export function buildStonePiece(type: PieceType, color: "white" | "black"): BuiltPiece {
  const palette = color === "white" ? WHITE_STONE : BLACK_STONE;
  const mat = stoneMaterial(palette);
  const group = new THREE.Group();
  group.name = `Arcane_${color}_${type}`;
  const geometries: THREE.BufferGeometry[] = [];

  const add = (mesh: THREE.Mesh, salt: number, displacement = 0.012): void => {
    mesh.material = mat;
    const g = mergeInto(group, mesh);
    displaceStone(g, displacement, salt);
    geometries.push(g);
  };

  const base = bevelBase(0.36, 0.16);
  add(base, 1);

  switch (type) {
    case "pawn": {
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.34, 32));
      body.position.y = 0.16 + 0.17;
      add(body, 2);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16));
      head.position.y = 0.16 + 0.34 + 0.02;
      add(head, 3);
      break;
    }
    case "knight": {
      // Rearing horse silhouette: swept neck + head + carved mane slabs.
      const neckPts: THREE.Vector2[] = [];
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        // Sweep upward and slight forward lean (x grows toward "front").
        const y = 0.16 + t * 0.42;
        const r = 0.17 - t * 0.06;
        const x = -0.02 + Math.sin(t * Math.PI * 0.6) * 0.10;
        neckPts.push(new THREE.Vector2(Math.max(0.04, r), y).add(new THREE.Vector2(0, 0)));
        (neckPts[neckPts.length - 1] as THREE.Vector2).x += x;
      }
      const neck = new THREE.Mesh(new THREE.LatheGeometry(neckPts, 28));
      add(neck, 4, 0.014);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.4, 1, 1, 1));
      head.position.set(0.10, 0.62, 0);
      head.rotation.z = -0.5;
      add(head, 5, 0.014);
      // carved mane
      for (let i = 0; i < 3; i++) {
        const mane = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.1));
        mane.position.set(-0.06 - i * 0.03, 0.52 - i * 0.09, 0);
        mane.rotation.x = 0.2;
        add(mane, 6 + i, 0.01);
      }
      break;
    }
    case "bishop": {
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 32));
      body.position.y = 0.16 + 0.2;
      add(body, 7);
      const mitre = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 3));
      mitre.position.y = 0.16 + 0.4 + 0.05;
      add(mitre, 8);
      const groove = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.16));
      groove.position.y = 0.16 + 0.34;
      add(groove, 9, 0.008);
      break;
    }
    case "rook": {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.42, 32));
      body.position.y = 0.16 + 0.21;
      add(body, 10);
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        const crenel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.07));
        crenel.position.set(
          Math.cos(ang) * 0.19,
          0.16 + 0.42 + 0.03,
          Math.sin(ang) * 0.19,
        );
        add(crenel, 11 + i, 0.006);
      }
      break;
    }
    case "queen": {
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.44, 32));
      body.position.y = 0.16 + 0.22;
      add(body, 15);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12));
      crown.position.y = 0.16 + 0.44 + 0.02;
      add(crown, 16);
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        const pt = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 4));
        pt.position.set(Math.cos(ang) * 0.08, 0.16 + 0.44 + 0.1, Math.sin(ang) * 0.08);
        add(pt, 17 + i, 0.004);
      }
      break;
    }
    case "king": {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.4, 32));
      body.position.y = 0.18 + 0.2;
      add(body, 21);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 16, 32));
      band.position.y = 0.18 + 0.4 + 0.04;
      band.rotation.x = Math.PI / 2;
      add(band, 22);
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        const pt = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 4));
        pt.position.set(Math.cos(ang) * 0.12, 0.18 + 0.4 + 0.11, Math.sin(ang) * 0.12);
        add(pt, 23 + i, 0.004);
      }
      break;
    }
  }

  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return { group, material: mat, geometries };
}

export function disposeBuiltPiece(built: BuiltPiece): void {
  built.geometries.forEach((g) => g.dispose());
  built.material.dispose();
}
