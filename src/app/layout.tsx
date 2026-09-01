import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arcane Chess — Every Move Leaves a Mark",
  description:
    "A cinematic 3D online chess platform. Ancient stone chess realm, real multiplayer, and premium gameplay.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0808] text-neutral-100 antialiased">{children}</body>
    </html>
  );
}
