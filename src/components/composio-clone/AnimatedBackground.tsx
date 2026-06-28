"use client";

import { useEffect } from "react";

const rows = [
  { id: "one", segments: ["a", "b", "c", "d", "e"] },
  { id: "two", segments: ["a", "b", "c", "d", "e", "f"] },
  { id: "three", segments: ["a", "b", "c", "d", "e"] },
  { id: "four", segments: ["a", "b", "c", "d", "e", "f"] },
  { id: "five", segments: ["a", "b", "c", "d"] },
  { id: "six", segments: ["a", "b", "c", "d", "e"] },
];

export function AnimatedBackground() {
  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 18;
      const y = (event.clientY / window.innerHeight - 0.5) * 10;
      document.documentElement.style.setProperty("--wave-parallax-x", `${x.toFixed(2)}px`);
      document.documentElement.style.setProperty("--wave-parallax-y", `${y.toFixed(2)}px`);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  return (
    <div className="animated-background" aria-hidden="true">
      <div className="cursor-aura" />
      <WaveGroup side="left" />
      <WaveGroup side="right" />
      <div className="grid-layer" />
      <svg className="circuit-layer" viewBox="0 0 1440 900" preserveAspectRatio="none">
        <path d="M96 620H430C512 620 512 548 594 548H812C888 548 888 492 964 492H1344" />
        <path d="M180 760H380C462 760 462 695 544 695H720C796 695 796 642 872 642H1260" />
        <path d="M1080 190H930C854 190 854 248 778 248H594C520 248 520 300 446 300H170" />
      </svg>
      <div className="scanline" />
      <div className="center-readability-mask" />
      <div className="grain-layer" />
    </div>
  );
}

function WaveGroup({ side }: { side: "left" | "right" }) {
  return (
    <div className={`hero-wave hero-wave-${side}`}>
      <div className="wave-glow" />
      <div className="pixel-wave-body">
        {rows.map((row) => (
          <div className={`pixel-row pixel-row-${row.id}`} key={row.id}>
            {row.segments.map((segment) => (
              <div className={`pixel-segment segment-${segment}`} key={segment} />
            ))}
          </div>
        ))}
      </div>
      <div className="wave-scan-texture" />
      <div className="wave-shade" />
    </div>
  );
}
