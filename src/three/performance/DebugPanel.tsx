"use client";

/**
 * Development-only debug panel. NOT rendered in production builds (guarded by
 * process.env.NODE_ENV). Shows FPS + quality tier + reduced-motion state.
 */

import { FpsMeter } from "./FpsMeter";
import { useSettings } from "@/stores/useSettings";

export function DebugPanel() {
  if (process.env.NODE_ENV === "production") return null;

  const quality = useSettings((s) => s.quality);
  const reducedMotion = useSettings((s) => s.reducedMotion);

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-[11px] font-mono text-emerald-200/90 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="opacity-60">ARCANE·DEV</span>
        <FpsMeter />
      </div>
      <div className="mt-1 flex gap-3 opacity-70">
        <span>Q:{quality}</span>
        <span>MOTION:{reducedMotion ? "REDUCED" : "FULL"}</span>
      </div>
    </div>
  );
}
