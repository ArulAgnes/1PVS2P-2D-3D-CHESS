"""Shared GLB export + validation helper.

Usage examples:
  blender --background --python blender/scripts/export_glb.py -- \
      --source knight.blend --out ../public/assets/chess/white/knight.glb
"""

import os
import sys
import argparse

sys.path.insert(0, os.path.dirname(__file__))

import bpy  # noqa: E402


def export_selected(out_path, y_up=True, apply=True, optimize=True):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    # apply transforms, remove unused, skip cameras/lights (self-contained piece)
    bpy.ops.export_scene.gltf(
        filepath=os.path.abspath(out_path),
        export_format="GLB",
        use_selection=True,
        export_yup=y_up,
        export_apply=apply,
        export_cameras=False,
        export_lights=False,
        export_animations=True,
        export_optimize_animation_size=optimize,
    )
    print("[export_glb] ->", os.path.abspath(out_path))


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--source", required=False)
    p.add_argument("--out", required=True)
    p.add_argument("--y-up", action="store_true", default=True)
    p.add_argument("--no-apply", action="store_true")
    args = p.parse_args(argv)

    if args.source and args.source.endswith((".blend", ".blend1")):
        bpy.ops.wm.open_mainfile(filepath=os.path.abspath(args.source))

    if not bpy.context.selected_objects:
        bpy.ops.object.select_all(action="SELECT")

    export_selected(
        args.out,
        y_up=args.y_up,
        apply=not args.no_apply,
    )
