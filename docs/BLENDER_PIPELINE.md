# ARCANE CHESS — BLENDER PIPELINE

Describes the exact production pipeline for authoring and exporting game-ready assets.

```
BLENDER → MODEL → SCULPT/DETAIL → TOPOLOGY → UV → MATERIAL → TEXTURE
→ (RIG) → ANIMATION → GLB EXPORT → public/assets → THREE.jS/R3F → BROWSER
```

## 0. Environment honesty

- If Blender **is** installed in the dev environment, run the scripts and export GLBs.
- If it is **not**, do NOT claim the assets were generated. Ship the scripts + exact scene
  structure + export instructions instead, and keep the procedural temporary assets
  active in the app (clearly marked TEMPORARY).

## 1. Install Blender

- Download from https://www.blender.org/ (use an LTS release).
- Verify CLI: `blender --version`.

## 2. Repository layout

```
blender/
  scripts/       python generators (run headless)
  assets/        intermediate .blend / model sources
  materials/     .blend material library files
  animations/    action source files
  exports/       output GLB/GLTF
  scenes/        staged scene files
  docs/          notes
```

## 3. Run a generation script (headless)

```bash
blender --background --python blender/scripts/generate_knight.py
```

Each generator (see below) creates the mesh from modifiers/displacement, applies it,
and (optionally) exports a GLB into `blender/exports/`.

## 4. Generator scripts

| Script | Output |
|--------|--------|
| `generate_board.py` | carved stone board |
| `generate_pawn.py` | pawn |
| `generate_knight.py` | knight (flagship) |
| `generate_bishop.py` | bishop |
| `generate_rook.py` | rook |
| `generate_queen.py` | queen |
| `generate_king.py` | king |
| `generate_all_pieces.py` | all six, both colors |
| `export_glb.py` | shared GLB export + validation helpers |

## 5. Inspect the asset

- Open the `.blend` in Blender, check silhouette, normals, UVs, scale, origin.
- Open the GLB in a viewer (e.g., https://gltf-viewer.donmccurdy.com/ or Blender itself).

## 6. Modify the material

- Use a PBR node group: BaseColor → Roughness → Normal → AO.
- Stone: subtle color variation, high-frequency noise for roughness, edge wear, cracks.
- Keep textures power-of-two, preferably compressed (KHR_texture_basisu / WebP/JPEG).

## 7. Create animation

- Use actions named predictably: `<Piece>_Idle`, `<Piece>_Move`, `<Piece>_Attack`,
  `<Piece>_Hit`, `<Piece>_Death` (e.g. `Knight_Idle`).
- Bake/keep as NLA strips or single actions per clip.

## 8. Export GLB

```bash
blender --background --python blender/scripts/export_glb.py -- --source knight.blend --out ../public/assets/chess/white/knight.glb
```

Export rules (see `export_glb.py`):
- Apply transforms / correct origin (centered at base, y-up).
- Correct scale (see `docs/GLB_PIPELINE.md` for unit conventions).
- Remove hidden objects, unused materials, cameras, lights.
- Verify normals & UVs.
- Prefer `.glb` (self-contained) for production.

## 9. Copy GLB to public/assets

```
public/assets/chess/white/king.glb ...
public/assets/chess/black/king.glb ...
public/assets/board/board.glb
```

## 10. Load through R3F

`useGLTF('/assets/chess/white/knight.glb')` via the asset registry (see
`src/three/assets/`). The registry caches and preloads; do not reload per square.

## 11. Validate

Run the asset validation harness (see `docs/GLB_PIPELINE.md`) to check existence,
parse, mesh/material presence, bounding box scale, origin, texture references.

## 12. Optimize

- Decimate to a per-piece triangle budget (see `docs/ASSET_LICENSING.md`/perf report).
- Compress textures; use Draco/Meshopt for optional streaming.
- Re-validate and re-test loading performance.
