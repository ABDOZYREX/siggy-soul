import { useEffect, useRef, useState } from "react";

type Bolt = {
  id: number;
  d: string;
  branches: string[];
  width: number;
  height: number;
  left: number;
  top: number;
};

function jaggedPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  segments: number,
  jitter: number,
) {
  const points: { x: number; y: number }[] = [{ x: x1, y: y1 }];
  let d = `M ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len;
    const py = dx / len;
    const off = (Math.random() - 0.5) * jitter;
    const x = x1 + dx * t + px * off + (Math.random() - 0.5) * jitter * 0.4;
    const y = y1 + dy * t + py * off + (Math.random() - 0.5) * jitter * 0.4;
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    points.push({ x, y });
  }
  d += ` L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  points.push({ x: x2, y: y2 });
  return { d, points };
}

function makeStrike(target: DOMRect): Bolt | null {
  const tx = target.left + target.width * (0.2 + Math.random() * 0.6);
  const ty = target.top + target.height * (0.2 + Math.random() * 0.6);

  const drift = (Math.random() - 0.5) * Math.min(window.innerWidth * 0.6, 600);
  const sx = tx + drift;
  const sy = -30 - Math.random() * 60;

  const minX = Math.min(sx, tx) - 80;
  const minY = Math.min(sy, ty) - 80;
  const maxX = Math.max(sx, tx) + 80;
  const maxY = Math.max(sy, ty) + 80;
  const width = maxX - minX;
  const height = maxY - minY;

  // Reduced segments for lighter CPU load
  const main = jaggedPath(sx - minX, sy - minY, tx - minX, ty - minY, 8, 60);

  const branches: string[] = [];
  const branchCount = Math.floor(Math.random() * 2); // 0 or 1 branch only
  for (let b = 0; b < branchCount; b++) {
    const idx = 2 + Math.floor(Math.random() * (main.points.length - 4));
    const start = main.points[idx];
    const angle = Math.random() * Math.PI * 2;
    const len = 50 + Math.random() * 90;
    const ex = start.x + Math.cos(angle) * len;
    const ey = start.y + Math.sin(angle) * len;
    branches.push(jaggedPath(start.x, start.y, ex, ey, 5, 30).d);
  }

  return {
    id: Math.random(),
    d: main.d,
    branches,
    width,
    height,
    left: minX,
    top: minY,
  };
}

export function Lightning() {
  const [bolts, setBolts] = useState<Bolt[]>([]);
  const flashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    let mounted = true;
    const timers: number[] = [];

    const fireOnce = () => {
      const targets = Array.from(
        document.querySelectorAll<HTMLElement>(".siggy-nft"),
      );
      if (targets.length === 0) return;
      const target = targets[Math.floor(Math.random() * targets.length)];

      // Mobile: skip SVG bolt rendering entirely — only the opacity flash
      if (!isMobile) {
        const rect = target.getBoundingClientRect();
        const bolt = makeStrike(rect);
        if (bolt) {
          setBolts((prev) => [...prev, bolt]);
          timers.push(
            window.setTimeout(() => {
              if (mounted) setBolts((prev) => prev.filter((b) => b.id !== bolt.id));
            }, 600),
          );
        }
      }


      // Hardware-accelerated flash via direct DOM manipulation — zero React re-render
      const el = flashRef.current;
      if (el) {
        el.style.opacity = "0.55";
        timers.push(
          window.setTimeout(() => {
            if (el) el.style.opacity = "0";
          }, 140),
        );
      }

      window.dispatchEvent(
        new CustomEvent("nft-strike", { detail: { id: target.id } }),
      );
    };


    const trigger = () => {
      if (!mounted) return;
      if (document.hidden) {
        timers.push(window.setTimeout(trigger, 8000));
        return;
      }
      // Single strike only — no burst to save CPU
      fireOnce();
      // Much longer interval: 5–10 seconds
      timers.push(window.setTimeout(trigger, 5000 + Math.random() * 5000));
    };
    timers.push(window.setTimeout(trigger, 2000));

    return () => {
      mounted = false;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <>
      <div
        ref={flashRef}
        className="pointer-events-none fixed inset-0 z-20"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.85 0.22 145 / 0.45), transparent 70%)",
          opacity: 0,
          transition: "opacity 120ms ease-out",
          willChange: "opacity",
          mixBlendMode: "screen",
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
        {bolts.map((b) => (
          <svg
            key={b.id}
            width={b.width}
            height={b.height}
            viewBox={`0 0 ${b.width} ${b.height}`}
            className="absolute animate-lightning"
            style={{
              left: b.left,
              top: b.top,
              filter: "drop-shadow(0 0 8px oklch(0.9 0.25 145 / 0.95))",
            }}
          >
            <path
              d={b.d}
              stroke="oklch(0.78 0.22 145)"
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.45"
            />
            <path
              d={b.d}
              stroke="oklch(0.99 0.18 145)"
              strokeWidth={1.4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {b.branches.map((d, i) => (
              <path
                key={i}
                d={d}
                stroke="oklch(0.95 0.2 145)"
                strokeWidth={1}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
            ))}
          </svg>
        ))}
      </div>
    </>
  );
}

