"""Generate the Arcane Chess BISHOP — ancient arcane guardian (pointed head, groove).

Run:  blender --background --python blender/scripts/generate_bishop.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import bpy
from arcaneforge import clear_scene, new_stone_material, displace_stone, make_chess_base, apply_modifiers, set_origin_to_base, export_glb

clear_scene()
mat = new_stone_material("ArcaneStone_Bishop", base_color=(0.63, 0.62, 0.60))

base = make_chess_base(radius=0.34, height=0.16)
base.data.materials.append(mat)

# Tapered robed body
bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=0.24, radius2=0.10, depth=0.40, location=(0, 0, 0.16 + 0.20))
body = bpy.context.active_object
body.name = "BishopBody"
body.data.materials.append(mat)

# Pointed mitre head
bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.12, radius2=0.0, depth=0.26, location=(0, 0, 0.16 + 0.40 + 0.05))
head = bpy.context.active_object
head.name = "BishopHead"
head.data.materials.append(mat)

# Carved central groove (thin box)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.16 + 0.40 + 0.05))
groove = bpy.context.active_object
groove.name = "BishopGroove"
groove.scale = (0.04, 0.18, 0.30)
groove.data.materials.append(mat)

for o in (base, body, head, groove):
    displace_stone(o, strength=0.015, scale=5.0)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.join()
bishop = bpy.context.active_object
bishop.name = "ArcaneBishop"
set_origin_to_base(bishop)

out = os.path.join(os.path.dirname(__file__), "..", "exports", "bishop.glb")
export_glb(bishop, out)
print("BISHOP_GENERATED (procedural) ->", out)
