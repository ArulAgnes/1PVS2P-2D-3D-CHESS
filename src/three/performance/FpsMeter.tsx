"use client";

import { useEffect, useRef, useState } from "react";

/** Lightweight FPS meter using requestAnimationFrame deltas (development UI). */
export function FpsMeter() {
  const [fps, setFps] = useState(0);
  const frames = useRef(0);
  const last = useRef(performance.now());

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      frames.current += 1;
      const elapsed = now - last.current;
      if (elapsed >= 1000) {
        setFps(Math.round((frames.current * 1000) / elapsed));
        frames.current = 0;
        last.current = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <span className="tabular-nums">{fps} FPS</span>;
}
