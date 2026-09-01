"""Generate the Arcane Chess QUEEN — elegant ornate stone ruler.

Run:  blender --background --python blender/scripts/generate_queen.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import bpy
from arcaneforge import clear_scene, new_stone_material, displace_stone, make_chess_base, apply_modifiers, set_origin_to_base, export_glb

clear_scene()
mat = new_stone_material("ArcaneStone_Queen", base_color=(0.64, 0.63, 0.60))

base = make_chess_base(radius=0.36, height=0.16)
base.data.materials.append(mat)

# Sculpted robed body
bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=0.24, radius2=0.10, depth=0.44, location=(0, 0, 0.16 + 0.22))
body = bpy.context.active_object
body.name = "QueenBody"
body.data.materials.append(mat)

# Ornate crown (small sphere + points)
bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.10, location=(0, 0, 0.16 + 0.44 + 0.02))
crown = bpy.context.active_object
crown.name = "QueenCrown"
crown.data.materials.append(mat)

for i in range(4):
    ang = i * 3.14159 / 2.0
    import math
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.03, radius2=0.0, depth=0.08, location=(0, 0, 0.16 + 0.44 + 0.10))
    spk = bpy.context.active_object
    spk.name = "QueenCrownPt_%d" % i
    spk.location = (0.08 * math.cos(ang), 0.08 * math.sin(ang), 0.16 + 0.44 + 0.06)
    spk.data.materials.append(mat)

for o in (base, body, crown):
    displace_stone(o, strength=0.015, scale=5.0)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.join()
queen = bpy.context.active_object
queen.name = "ArcaneQueen"
set_origin_to_base(queen)

out = os.path.join(os.path.dirname(__file__), "..", "exports", "queen.glb")
export_glb(queen, out)
print("QUEEN_GENERATED (procedural) ->", out)
