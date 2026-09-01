"""Generate the Arcane Chess KING — ancient stone royal guardian with carved crown.

Run:  blender --background --python blender/scripts/generate_king.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import bpy
from arcaneforge import clear_scene, new_stone_material, displace_stone, make_chess_base, apply_modifiers, set_origin_to_base, export_glb

clear_scene()
mat = new_stone_material("ArcaneStone_King", base_color=(0.62, 0.61, 0.59))

base = make_chess_base(radius=0.38, height=0.18)
base.data.materials.append(mat)

# Broad royal body
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.22, depth=0.40, location=(0, 0, 0.18 + 0.20))
body = bpy.context.active_object
body.name = "KingBody"
body.data.materials.append(mat)

# Large crown (pointed band)
import math
bpy.ops.mesh.primitive_torus_add(major_radius=0.13, minor_radius=0.03, major_segments=24, minor_segments=8, location=(0, 0, 0.18 + 0.40 + 0.04))
crown_band = bpy.context.active_object
crown_band.name = "KingCrownBand"
crown_band.data.materials.append(mat)

for i in range(4):
    ang = i * 3.14159 / 2.0
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.035, radius2=0.0, depth=0.14, location=(0, 0, 0.18 + 0.40 + 0.10))
    spk = bpy.context.active_object
    spk.name = "KingCrownPt_%d" % i
    spk.location = (0.12 * math.cos(ang), 0.12 * math.sin(ang), 0.18 + 0.40 + 0.08)
    spk.data.materials.append(mat)

for o in (base, body, crown_band):
    displace_stone(o, strength=0.015, scale=5.0)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.join()
king = bpy.context.active_object
king.name = "ArcaneKing"
set_origin_to_base(king)

out = os.path.join(os.path.dirname(__file__), "..", "exports", "king.glb")
export_glb(king, out)
print("KING_GENERATED (procedural) ->", out)
