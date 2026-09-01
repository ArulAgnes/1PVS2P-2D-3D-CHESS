"use client";

/**
 * Minimal premium navigation. PLAY enters the 3D prototype; other entries are the
 * declared future phase surface (clearly not implemented — no fake functionality).
 */

const NAV_ITEMS = [
  { label: "Play", href: "#play", ready: true },
  { label: "Play with Friend", href: "#", ready: false },
  { label: "Bot", href: "#", ready: false },
  { label: "Ranked", href: "#", ready: false },
  { label: "Profile", href: "#", ready: false },
];

export function Nav() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 md:px-10">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold tracking-[0.35em] text-neutral-100">
          ARCANE
        </span>
        <span className="text-lg font-light tracking-[0.35em] text-amber-200/70">CHESS</span>
      </div>

      <nav className="hidden items-center gap-6 md:flex">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`text-sm tracking-wide transition ${
              item.ready
                ? "text-neutral-200 hover:text-white"
                : "cursor-not-allowed text-neutral-500"
            }`}
            title={item.ready ? item.label : "Coming in a future phase"}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
