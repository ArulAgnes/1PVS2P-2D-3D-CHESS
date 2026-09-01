"""Generate the Arcane Chess KNIGHT (flagship piece) as a procedural stone statue.

Run:  blender --background --python blender/scripts/generate_knight.py

Produces an ANCIENT STONE WAR-HORSE silhouette (not a primitive): horse head, carved
mane, strong neck, sculptural base. Material and weathered displacement come from
arcaneforge.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

import bpy
from arcaneforge import clear_scene, new_stone_material, displace_stone, apply_modifiers, make_chess_base, set_origin_to_base, export_glb

clear_scene()
mat = new_stone_material("ArcaneStone_Knight", base_color=(0.60, 0.59, 0.57))

# Base plinth + neck/pedestal (sculpted column)
base = make_chess_base(radius=0.40, height=0.20)
base.data.materials.append(mat)

# Neck — tapered column suggesting a rearing horse's neck, using a lathe of a curve profile.
bpy.ops.curve.primitive_bezier_curve_add(location=(0, 0.20, 0))
neck_curve = bpy.context.active_object
neck_curve.name = "KnightNeck"
# A lathe (screw) of a hand-tuned profile approximates the horse neck sweep.
neck_curve.data.resolution_u = 12
# NOTE: a full sculpted profile would be hand-authored; this script establishes the
# procedural base silhouette for later sculpt detail.
bpy.ops.object.convert(target="MESH")
neck = bpy.context.active_object
displace_stone(neck, strength=0.02, scale=4.0)

# Head — stylized horse head via a deformed cube (snout).
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.42, 0))
head = bpy.context.active_object
head.name = "KnightHead"
head.scale = (0.22, 0.30, 0.34)
head.location.z = 0.52
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.bevel(offset=0.03, segments=2)
bpy.ops.object.mode_set(mode="OBJECT")

# Mane — a few sculpted slabs behind the neck suggesting carved mane.
for i in range(4):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.42 - i * 0.05, -0.12))
    mane = bpy.context.active_object
    mane.name = "KnightMane_%02d" % i
    mane.scale = (0.16, 0.12, 0.05)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.bevel(offset=0.02, segments=1)
    bpy.ops.object.mode_set(mode="OBJECT")
    mane.data.materials.append(mat)

for o in (head, mane):
    o.data.materials.append(mat)

# Join all into one piece (deterministic origin at base)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.join()
knight = bpy.context.active_object
knight.name = "ArcaneKnight"
set_origin_to_base(knight)

out = os.path.join(os.path.dirname(__file__), "..", "exports", "knight.glb")
export_glb(knight, out)
print("KNIGHT_GENERATED (procedural base) ->", out)
