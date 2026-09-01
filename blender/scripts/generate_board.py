"""Generate the Arcane Chess BOARD as an ancient carved-stone slab.

Run:  blender --background --python blender/scripts/generate_board.py

8x8 cells, physical thickness, bevelled edges, subtle stone displacement. Gameplay
readability (contrast between light/dark squares) is preserved.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import bpy
from arcaneforge import clear_scene, new_stone_material, displace_stone, apply_modifiers, export_glb

clear_scene()

SQUARE = 1.0
BOARD = SQUARE * 8
THICKNESS = 0.18

# Base slab
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, THICKNESS / 2))
slab = bpy.context.active_object
slab.name = "ArcaneBoard"
slab.scale = (BOARD, BOARD, THICKNESS)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.bevel(offset=0.04, segments=2)
bpy.ops.object.mode_set(mode="OBJECT")
displace_stone(slab, strength=0.015, scale=8.0)

mat_base = new_stone_material("Board_Base", base_color=(0.36, 0.34, 0.31))
slab.data.materials.append(mat_base)

# Checkered top squares (thin tiles embedded on top) — readable contrast, stone feel.
light = new_stone_material("Board_Light", base_color=(0.84, 0.80, 0.72), roughness=0.86)
dark = new_stone_material("Board_Dark", base_color=(0.22, 0.20, 0.18), roughness=0.88)

tile_thick = 0.02
start = -(BOARD / 2) + SQUARE / 2
for file in range(8):
    for rank in range(8):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
        tile = bpy.context.active_object
        tile.name = "Sq_%d%d" % (file, rank)
        tile.scale = (SQUARE * 0.98, SQUARE * 0.98, tile_thick)
        tile.location = (start + file * SQUARE, start + rank * SQUARE, THICKNESS + tile_thick / 2)
        tile.data.materials.append(light if (file + rank) % 2 == 0 else dark)

# Join slab+tiles, keep origin at base center
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.join()
board = bpy.context.active_object
# origin to bottom of slab
for v in board.data.vertices:
    pass  # origin handled below
bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY")
board.location.z = 0.0

out = os.path.join(os.path.dirname(__file__), "..", "exports", "board.glb")
export_glb(board, out)
print("BOARD_GENERATED (procedural) ->", out)
