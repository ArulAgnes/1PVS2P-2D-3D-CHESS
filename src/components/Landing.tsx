"use client";

/**
 * Cinematic landing page. The 3D Arcane Chess scene is the hero. Primary CTAs route to
 * the real playable game. Unimplemented surface is clearly marked (no fake buttons).
 */

import Link from "next/link";
import { useState } from "react";

import { ArcaneChessScene } from "@/three/scene/ArcaneChessScene";
import { DebugPanel } from "@/three/performance/DebugPanel";
import { Nav } from "./Nav";
import { SettingsOverlay } from "./SettingsOverlay";

export function Landing() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <main className="relative h-screen w-full overflow-hidden">
      <Nav />

      {/* 3D hero scene */}
      <div className="absolute inset-0">
        <ArcaneChessScene />
      </div>

      {/* Foreground content */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-full flex-col items-center justify-center px-6">
        <div className="animate-fade-up flex flex-col items-center text-center">
          <p className="text-xs uppercase tracking-[0.5em] text-amber-200/60">
            Ancient Stone Chess Realm
          </p>
          <h1 className="mt-4 text-6xl font-bold tracking-[0.08em] text-neutral-50 md:text-8xl">
            ARCANE CHESS
          </h1>
          <p className="mt-4 text-sm uppercase tracking-[0.4em] text-neutral-300/80 md:text-base">
            Every move leaves a mark
          </p>

          <div className="pointer-events-auto mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/play"
              className="group rounded-full border border-amber-200/40 bg-amber-100/10 px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100 backdrop-blur-md transition hover:bg-amber-200/20"
            >
              Play Now
            </Link>
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-full border border-white/10 bg-black/30 px-8 py-3 text-sm uppercase tracking-[0.2em] text-neutral-300 backdrop-blur-md transition hover:text-white"
            >
              Settings
            </button>
          </div>

          <p className="pointer-events-none mt-6 max-w-md text-xs text-neutral-500">
            Real 3D chess · local two-player · in-house bot. Online multiplayer,
            matchmaking, ratings and tournaments are future phases.
          </p>
        </div>
      </div>

      <DebugPanel />
      <SettingsOverlay open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
