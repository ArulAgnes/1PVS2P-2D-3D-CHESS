"""Generate the Arcane Chess pieces (all six) and board as procedural stone assets.

Master generator: dispatches each piece generator and the board generator.

Run:  blender --background --python blender/scripts/generate_all_pieces.py

This orchestrates the full set. Individual pieces can be regenerated independently.
"""

import os
import sys
import importlib

sys.path.insert(0, os.path.dirname(__file__))

MODULES = [
    "generate_pawn",
    "generate_knight",
    "generate_bishop",
    "generate_rook",
    "generate_queen",
    "generate_king",
    "generate_board",
]

if __name__ == "__main__":
    here = os.path.dirname(__file__)
    for m in MODULES:
        print(f"[generate_all_pieces] -> {m}")
        try:
            importlib.import_module(m)
        except Exception as exc:  # noqa: BLE001
            print(f"[generate_all_pieces] WARN: {m} failed: {exc}")
