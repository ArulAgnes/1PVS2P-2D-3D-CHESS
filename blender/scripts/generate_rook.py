"""Generate the Arcane Chess ROOK — ancient stone fortress tower.

Run:  blender --background --python blender/scripts/generate_rook.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import bpy
from arcaneforge import clear_scene, new_stone_material, displace_stone, make_chess_base, apply_modifiers, set_origin_to_base, export_glb

clear_scene()
mat = new_stone_material("ArcaneStone_Rook", base_color=(0.60, 0.59, 0.57))

base = make_chess_base(radius=0.36, height=0.16)
base.data.materials.append(mat)

# Fortress tower body (tapered)
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.22, depth=0.42, location=(0, 0, 0.16 + 0.21))
body = bpy.context.active_object
body.name = "RookBody"
body.data.materials.append(mat)

# Battlements (4 merlons around the tower rim)
import math
R = 0.20
for i in range(4):
    ang = i * math.pi / 2.0
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    crenel = bpy.context.active_object
    crenel.name = "RookCrenel_%d" % i
    crenel.scale = (0.09, 0.05, 0.06)
    crenel.location = (R * math.cos(ang), R * math.sin(ang), 0.16 + 0.42 + 0.03)
    crenel.data.materials.append(mat)

for o in (base, body):
    displace_stone(o, strength=0.015, scale=5.0)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.join()
rook = bpy.context.active_object
rook.name = "ArcaneRook"
set_origin_to_base(rook)

out = os.path.join(os.path.dirname(__file__), "..", "exports", "rook.glb")
export_glb(rook, out)
print("ROOK_GENERATED (procedural) ->", out)
