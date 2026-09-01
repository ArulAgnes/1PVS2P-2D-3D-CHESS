"""Arcane Chess — shared Blender generation helpers.

Provides utilities used by the per-piece generator scripts:
- base chess-plinth creation
- stone material setup (PBR-ish with roughness/bump)
- stone mesh displacement for believable weathered surface
- predictable GLB export

NOTE ON HONESTY: these scripts are authored and intended to run inside Blender
(`blender --background --python blender/scripts/<name>.py`). They are NOT claimed to
have already executed unless BLENDER_EXECUTED is recorded in the phase report.
"""

import bpy
import os


def clear_scene():
    """Remove default objects (cube, light, camera) so generations are deterministic."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def new_stone_material(name, base_color=(0.62, 0.61, 0.59), roughness=0.92):
    """Create a simple PBR stone material node graph."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    bsdf = nodes.get("Principled BSDF")
    output = nodes.get("Material Output")

    bsdf.inputs["Base Color"].default_value = (base_color[0], base_color[1], base_color[2], 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = 0.0

    # Coarse procedural bump for weathered stone (musgrave)
    tex = nodes.new(type="ShaderNodeTexMusgrave")
    tex.musgrave_dimensions = "3D"
    tex.inputs["Scale"].default_value = 6.0

    bump = nodes.new(type="ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.04
    links.new(tex.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    return mat


def displace_stone(obj, strength=0.02, scale=3.0):
    """Apply a subtle multi-fractal displacement for stone surface imperfection."""
    # This modifier approach requires a reasonably subdivided mesh.
    mod = obj.modifiers.new(name="StoneDisplace", type="DISPLACE")
    tex = bpy.data.textures.new("StoneTex", type="DISTORTED_NOISE")
    tex.noise_scale = scale
    mod.texture = tex
    mod.strength = strength
    return mod


def apply_modifiers(obj):
    """Apply all modifiers so the final mesh is static and export-safe."""
    ctx = bpy.context.copy()
    ctx["object"] = obj
    ctx["active_object"] = obj
    ctx["selected_objects"] = [obj]
    for m in obj.modifiers:
        bpy.ops.object.modifier_apply(ctx, modifier=m.name)


def make_chess_base(radius=0.42, height=0.18):
    """Create a bevelled stone plinth (chess piece base)."""
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=48, radius=radius, depth=height, location=(0, 0, height / 2.0)
    )
    base = bpy.context.active_object
    base.name = "Base"
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.bevel(offset=0.05, segments=3)
    bpy.ops.object.mode_set(mode="OBJECT")
    return base


def set_origin_to_base(obj):
    """Move object origin to the bottom (z=0) of the mesh for correct placement."""
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY")
    obj.location = (0, 0, 0)


def export_glb(obj, out_path, y_up=True):
    """Export the active object as .glb."""
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    out_path = os.path.abspath(out_path)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        use_selection=True,
        export_yup=y_up,
        export_apply=True,
    )
    print(f"[arcaneforge] exported -> {out_path}")
    return out_path
