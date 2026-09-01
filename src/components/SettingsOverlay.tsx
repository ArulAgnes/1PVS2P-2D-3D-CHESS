"use client";

/**
 * Premium minimal settings overlay: quality tier, reduced motion, sound.
 * This is real, wired state (not a fake button).
 */

import { useSettings, type QualityTier } from "@/stores/useSettings";

const QUALITY_TIERS: QualityTier[] = ["AUTO", "LOW", "MEDIUM", "HIGH", "ULTRA"];

export function SettingsOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { quality, setQuality, reducedMotion, setReducedMotion, sound, setSound } =
    useSettings();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#141010]/90 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-wide text-neutral-100">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-neutral-400 hover:bg-white/5 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <label className="text-xs uppercase tracking-widest text-neutral-400">
              Graphics Quality
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUALITY_TIERS.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`rounded-md px-3 py-1.5 text-sm transition ${
                    quality === q
                      ? "bg-amber-200/20 text-amber-100 ring-1 ring-amber-200/40"
                      : "bg-white/5 text-neutral-300 hover:bg-white/10"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            label="Reduced Motion"
            checked={reducedMotion}
            onChange={setReducedMotion}
          />
          <ToggleRow label="Sound" checked={sound} onChange={setSound} />
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-200">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-amber-200/40" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-neutral-100 transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
