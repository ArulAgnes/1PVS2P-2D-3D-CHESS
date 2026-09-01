# ARCANE CHESS — GLB / GLTF PIPELINE

## GLB vs GLTF

- `.gltf` = JSON + optional separate `.bin` + textures (multiple files).
- `.glb` = single binary container (JSON + buffer + textures inlined/embedded).

**Prefer `.glb`** for production (self-contained, one request, no broken external refs).

## Coordinate system / units

- Blender: right-handed, **+Z up**, meters.
- Three.js (glTF): right-handed, **+Y up**, meters.
- glTF exporters convert Z-up → Y-up.
- Convention for this project: **1 blender unit = 1 world unit**, board squares are
  sized so 1 square ≈ 1.0 unit; pieces sit with their base at origin `y=0`.

## Scale & origin

- Origin at piece **base center**, y=0 at the base plane (not the center of mass).
- Keep a consistent scale so `squareToWorld` height offsets are deterministic.
- Apply all transforms (freeze) on export to avoid scale surprises.

## Textures

- PBR maps: BaseColor (sRGB), Normal (linear), Roughness (linear), AO, optional
  Metallic/Emission/Height.
- Prefer compressed (basisu/KTX2) or WebP/JPEG; keep power-of-two dimensions.

## Animation clips

- One action per clip; predictable names (`Knight_Attack`, etc.).
- For chess, board movement is **code-driven** (root motion off); animations provide
  only the *visual* gesture (idle/attack/hit/death).

## Compression & optimization

- Draco (`KHR_draco_mesh_compression`) or Meshopt (`EXT_meshopt_compression`) for meshes.
- KTX2/BasisU for textures.
- Verify that the runtime loader (R3F/`useGLTF`) has the required decoders installed
  (install `drei`'s recommended decoder setup) or use uncompressed fallbacks.

## Loading

- Use `useGLTF` (drei) which wraps `GLTFLoader` and caches by URL.
- Asset registry maps `pieceKey` → URL and offers `preload()` + `usePiece(key)`.
- Do not load the same GLB per square; share the cached scene and clone.

## Caching & disposal

- Keep shared `GLTF/gltf.scene` cached; clone for instances.
- Dispose per-instance materials/geometries on unmount, but NEVER dispose shared
  cached textures/geometries used elsewhere (see ADR on resource management).
- Use `SkeletonUtils.clone` for skinned meshes.

## Validation

Automated checks (see `docs/ASSET_LICENSING.md` / validation harness):
file exists → parses (`GLTFLoader`) → has meshes → has materials → optional clips →
bounding box within expected size → origin near base → texture refs resolve.
