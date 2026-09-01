import type { Metadata } from "next";
import { GameScreen } from "@/components/GameScreen";

export const metadata: Metadata = {
  title: "Play — Arcane Chess",
  description: "Play cinematic 3D chess — local two-player or against an in-house bot.",
};

export default function PlayPage() {
  return <GameScreen />;
}
