"use client";

/**
 * Client settings store: rendering quality tiers + accessibility toggles.
 * These control shadow map size, particle budgets, and (future) post-processing.
 */

import { create } from "zustand";

export type QualityTier = "AUTO" | "LOW" | "MEDIUM" | "HIGH" | "ULTRA";

export interface SettingsState {
  quality: QualityTier;
  reducedMotion: boolean;
  sound: boolean;
  setQuality: (q: QualityTier) => void;
  setReducedMotion: (v: boolean) => void;
  setSound: (v: boolean) => void;
}

export const useSettings = create<SettingsState>((set) => ({
  quality: "AUTO",
  reducedMotion: false,
  sound: true,
  setQuality: (quality) => set({ quality }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setSound: (sound) => set({ sound }),
}));

/**
 * Resolve the effective quality tier into concrete render settings.
 * AUTO maps to HIGH on desktop, MEDIUM on small/mobile-sized viewports (checked at
 * call site by the scene).
 */
export interface RenderSettings {
  shadowMapSize: number;
  shadowMapEnabled: boolean;
  pixelRatio: number;
  particlesEnabled: boolean;
}

export function resolveRenderSettings(quality: QualityTier, isMobile: boolean): RenderSettings {
  const tier: Exclude<QualityTier, "AUTO"> =
    quality === "AUTO" ? (isMobile ? "MEDIUM" : "HIGH") : quality;

  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;

  switch (tier) {
    case "ULTRA":
      return { shadowMapSize: 4096, shadowMapEnabled: true, pixelRatio: Math.min(2, dpr), particlesEnabled: true };
    case "HIGH":
      return { shadowMapSize: 2048, shadowMapEnabled: true, pixelRatio: Math.min(2, dpr), particlesEnabled: true };
    case "MEDIUM":
      return { shadowMapSize: 1024, shadowMapEnabled: true, pixelRatio: Math.min(1.5, dpr), particlesEnabled: true };
    case "LOW":
      return { shadowMapSize: 512, shadowMapEnabled: true, pixelRatio: 1, particlesEnabled: false };
  }
}
