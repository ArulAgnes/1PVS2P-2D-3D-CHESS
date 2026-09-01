"""Generate the Arcane Chess PAWN — small stone warrior guardian.

Run:  blender --background --python blender/scripts/generate_pawn.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import bpy
from arcaneforge import clear_scene, new_stone_material, displace_stone, make_chess_base, apply_modifiers, set_origin_to_base, export_glb

clear_scene()
mat = new_stone_material("ArcaneStone_Pawn", base_color=(0.66, 0.65, 0.63))

base = make_chess_base(radius=0.34, height=0.16)
base.data.materials.append(mat)

# Tapered body (truncated cone)
bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=0.26, radius2=0.14, depth=0.34, location=(0, 0, 0.16 + 0.17))
body = bpy.context.active_object
body.name = "PawnBody"
body.data.materials.append(mat)

# Rounded head
bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.15, location=(0, 0, 0.16 + 0.34 + 0.02))
head = bpy.context.active_object
head.name = "PawnHead"
head.data.materials.append(mat)

for o in (base, body, head):
    displace_stone(o, strength=0.015, scale=5.0)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.join()
pawn = bpy.context.active_object
pawn.name = "ArcanePawn"
set_origin_to_base(pawn)

out = os.path.join(os.path.dirname(__file__), "..", "exports", "pawn.glb")
export_glb(pawn, out)
print("PAWN_GENERATED (procedural) ->", out)
