"use client";

/**
 * GameScreen — the playable chess interface.
 *
 * Composes the 3D board (with 2D fallback), move list, status, promotion chooser,
 * and result overlay. All chess decisions flow through the engine via useGame.
 */

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";

import { useGame, moveListSan } from "@/stores/useGame";
import { GameBoard3D } from "@/three/game/GameBoard3D";
import { LightingRig } from "@/three/lighting/LightingRig";
import { CameraRig } from "@/three/camera/CameraRig";
import { Atmosphere } from "@/three/environment/Atmosphere";
import { GameBoard2D } from "./GameBoard2D";
import { BOT_PROFILES, type BotProfile } from "@/features/chess/bot";
import type { GameMode } from "@/stores/useGame";
import type { PieceType } from "@/features/chess/types";
import { useSettings, resolveRenderSettings } from "@/stores/useSettings";
import { useIsMobile } from "@/three/performance/useDevice";
import { toFen, toPgn } from "@/features/chess/engine";

const PROMO_GLYPHS: { type: PieceType; glyph: string }[] = [
  { type: "queen", glyph: "♛" },
  { type: "rook", glyph: "♜" },
  { type: "bishop", glyph: "♝" },
  { type: "knight", glyph: "♞" },
];

const WHITE_GLYPHS: Record<PieceType, string> = {
  queen: "♕",
  rook: "♖",
  bishop: "♗",
  knight: "♘",
  pawn: "♙",
  king: "♔",
};

export function GameScreen() {
  const { state, mode, botProfile, pendingPromotion, thinking } = useGame();
  const actions = useGame.getState;
  const [view2d, setView2d] = useState(false);
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [showFen, setShowFen] = useState(false);

  const quality = useSettings((s) => s.quality);
  const isMobile = useIsMobile();
  const render = resolveRenderSettings(quality, isMobile);

  const san = useMemo(() => moveListSan(state), [state]);
  const rows: { n: number; white: string; black: string }[] = [];
  for (let i = 0; i < san.length; i += 2) {
    rows.push({ n: i / 2 + 1, white: san[i], black: san[i + 1] ?? "" });
  }

  const turnLabel =
    state.status === "checkmate"
      ? `Checkmate — ${state.result?.outcome === "white" ? "White" : "Black"} wins`
      : state.status === "stalemate"
        ? "Draw by stalemate"
        : state.status === "draw"
          ? `Draw (${state.result?.reason})`
          : state.turn === "white"
            ? "White to move"
            : "Black to move";

  const botThinking =
    mode === "bot" && thinking && state.status === "active";

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#0a0808] text-neutral-100">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-[0.3em]">ARCANE</span>
          <span className="text-sm font-light tracking-[0.3em] text-amber-200/70">CHESS</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModeSelector />
          <button onClick={() => actions().newGame(mode, botProfile.target)} className="rounded-md border border-amber-200/30 bg-amber-100/10 px-3 py-1.5 text-xs uppercase tracking-wider text-amber-100 hover:bg-amber-200/20">
            New Game
          </button>
          <button onClick={() => actions().undo()} className="rounded-md border border-white/10 px-3 py-1.5 text-xs uppercase tracking-wider text-neutral-300 hover:bg-white/5">
            Undo
          </button>
          <button onClick={() => setOrientation((o) => (o === "white" ? "black" : "white"))} className="rounded-md border border-white/10 px-3 py-1.5 text-xs uppercase tracking-wider text-neutral-300 hover:bg-white/5">
            Flip
          </button>
          <button onClick={() => setView2d((v) => !v)} className="rounded-md border border-white/10 px-3 py-1.5 text-xs uppercase tracking-wider text-neutral-300 hover:bg-white/5">
            {view2d ? "3D" : "2D"}
          </button>
          <button onClick={() => setShowFen((v) => !v)} className="rounded-md border border-white/10 px-3 py-1.5 text-xs uppercase tracking-wider text-neutral-300 hover:bg-white/5">
            FEN
          </button>
        </div>
      </header>

      {/* Board + sidebar */}
      <div className="flex flex-1 flex-col gap-6 p-4 md:flex-row md:items-start md:justify-center md:p-8">
        {/* Board */}
        <div className="relative w-full max-w-[min(92vw,640px)]">
          {view2d ? (
            <GameBoard2D orientation={orientation} />
          ) : (
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <Canvas
                shadows={render.shadowMapEnabled}
                dpr={render.pixelRatio}
                camera={{ position: [0, 8.5, 9], fov: 42, near: 0.1, far: 100 }}
                gl={{ antialias: true, alpha: true }}
              >
                <LightingRig shadowMapSize={render.shadowMapSize} shadowMapEnabled={render.shadowMapEnabled} />
                <CameraRig />
                <GameBoard3D orientation={orientation} />
                <Atmosphere enabled={render.particlesEnabled && !isMobile} />
              </Canvas>
            </div>
          )}

          {/* Turn / status bar */}
          <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-4 py-2.5">
            <span className="text-sm text-neutral-200">{turnLabel}</span>
            {botThinking && <span className="text-xs text-amber-200/80 animate-pulse">Opponent is thinking…</span>}
            {mode === "bot" && (
              <span className="text-xs text-neutral-500">
                {botProfile.name} · {botProfile.target} target
              </span>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full max-w-[min(92vw,640px)] space-y-4 md:w-72 md:max-w-xs">
          {mode === "bot" && <BotSelector />}

          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <h3 className="mb-2 text-xs uppercase tracking-widest text-neutral-500">Moves</h3>
            <div className="max-h-72 overflow-y-auto pr-1">
              {rows.length === 0 ? (
                <p className="text-sm text-neutral-600">No moves yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.n} className="border-b border-white/5 last:border-0">
                        <td className="w-8 py-1 text-neutral-600">{r.n}.</td>
                        <td className="py-1 font-medium text-neutral-100">{r.white}</td>
                        <td className="py-1 text-neutral-300">{r.black}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {showFen && (
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <h3 className="mb-2 text-xs uppercase tracking-widest text-neutral-500">FEN</h3>
              <p className="break-all font-mono text-xs text-neutral-300">{toFen(state)}</p>
              <h3 className="mb-2 mt-3 text-xs uppercase tracking-widest text-neutral-500">PGN</h3>
              <pre className="whitespace-pre-wrap font-mono text-xs text-neutral-400">{toPgn(state)}</pre>
            </div>
          )}
        </aside>
      </div>

      {/* Promotion modal */}
      {pendingPromotion && (
        <PromotionModal onPick={(t) => actions().choosePromotion(t)} />
      )}

      {/* Result overlay */}
      {state.status !== "active" && <ResultOverlay />}
    </div>
  );
}

function ModeSelector() {
  const { mode } = useGame();
  const actions = useGame.getState;
  const modes: { id: GameMode; label: string }[] = [
    { id: "local", label: "Local 2P" },
    { id: "bot", label: "Bot" },
  ];
  return (
    <div className="flex rounded-md border border-white/10 p-0.5">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => actions().newGame(m.id)}
          className={`rounded px-3 py-1.5 text-xs uppercase tracking-wider transition ${
            mode === m.id ? "bg-amber-200/20 text-amber-100" : "text-neutral-400 hover:text-white"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

function BotSelector() {
  const { botProfile } = useGame();
  const actions = useGame.getState;
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
      <h3 className="mb-2 text-xs uppercase tracking-widest text-neutral-500">Opponent</h3>
      <select
        value={botProfile.target}
        onChange={(e) => actions().newGame("bot", Number(e.target.value))}
        className="w-full rounded-md border border-white/10 bg-[#1a1515] px-3 py-2 text-sm text-neutral-200"
      >
        {BOT_PROFILES.map((p: BotProfile) => (
          <option key={p.id} value={p.target}>
            {p.name} — {p.target} target ({p.tier})
          </option>
        ))}
      </select>
    </div>
  );
}

function PromotionModal({ onPick }: { onPick: (t: PieceType) => void }) {
  const color = useGame((s) => s.state.turn) === "white" ? "white" : "black";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="rounded-2xl border border-white/10 bg-[#141010] p-6">
        <h2 className="mb-4 text-center text-sm uppercase tracking-widest text-neutral-300">
          Promote to
        </h2>
        <div className="flex gap-3">
          {PROMO_GLYPHS.map((p) => (
            <button
              key={p.type}
              onClick={() => onPick(p.type)}
              className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-4xl transition hover:bg-amber-200/10"
            >
              <span className={color === "white" ? "text-[#f5f0e6]" : "text-[#1c1613]"}>
                {color === "white" ? WHITE_GLYPHS[p.type] : p.glyph}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultOverlay() {
  const state = useGame((s) => s.state);
  const actions = useGame.getState;
  const outcome = state.result?.outcome;
  const title =
    outcome === "draw" ? "DRAW" : outcome === "white" ? "WHITE WINS" : "BLACK WINS";
  const reason = state.result?.reason ?? "";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="animate-fade-up rounded-2xl border border-amber-200/20 bg-[#141010]/95 p-8 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-200/60">Match Complete</p>
        <h1 className="mt-3 text-4xl font-bold tracking-wide text-neutral-50 md:text-5xl">{title}</h1>
        <p className="mt-2 text-sm capitalize text-neutral-400">{reason.replace("-", " ")}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => actions().newGame(useGame.getState().mode, useGame.getState().botProfile.target)}
            className="rounded-full border border-amber-200/40 bg-amber-100/10 px-6 py-2 text-sm uppercase tracking-wider text-amber-100 hover:bg-amber-200/20"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
