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

type Props = {
  lite?: boolean;
};

type NavigatorWithHints = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

function makeStrike(target: DOMRect, lite: boolean): Bolt | null {
  const tx = target.left + target.width * (0.2 + Math.random() * 0.6);
  const ty = target.top + target.height * (0.2 + Math.random() * 0.6);

  const drift = (Math.random() - 0.5) * Math.min(window.innerWidth * (lite ? 0.24 : 0.4), lite ? 240 : 420);
  const sx = tx + drift;
  const sy = -30 - Math.random() * 60;

  const pad = lite ? 36 : 80;
  const minX = Math.min(sx, tx) - pad;
  const minY = Math.min(sy, ty) - pad;
  const maxX = Math.max(sx, tx) + pad;
  const maxY = Math.max(sy, ty) + pad;
  const width = maxX - minX;
  const height = maxY - minY;
  const main = jaggedPath(
    sx - minX,
    sy - minY,
    tx - minX,
    ty - minY,
    lite ? 4 : 6,
    lite ? 20 : 42,
  );

  return {
    id: Math.random(),
    d: main.d,
    branches: [],
    width,
    height,
    left: minX,
    top: minY,
  };
}

export function Lightning({ lite = false }: Props) {
  const [bolts, setBolts] = useState<Bolt[]>([]);
  const [liteMode, setLiteMode] = useState(lite);
  const flashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nav = window.navigator as NavigatorWithHints;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = Boolean(nav.connection?.saveData);
    if (reduceMotion || saveData) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const useLite = lite || isMobile;
    setLiteMode(useLite);

    let mounted = true;
    const timers: number[] = [];

    const fireOnce = () => {
      const targets = Array.from(document.querySelectorAll<HTMLElement>(".siggy-nft"));
      if (targets.length === 0) return;
      const target = targets[Math.floor(Math.random() * targets.length)];
      const rect = target.getBoundingClientRect();
      const bolt = makeStrike(rect, useLite);

      if (bolt) {
        setBolts((prev) => [...prev, bolt]);
        timers.push(
          window.setTimeout(() => {
            if (mounted) setBolts((prev) => prev.filter((b) => b.id !== bolt.id));
          }, useLite ? 220 : 380),
        );
      }

      const flash = flashRef.current;
      if (flash) {
        flash.style.opacity = useLite ? "0.18" : "0.45";
        timers.push(
          window.setTimeout(() => {
            if (flash) flash.style.opacity = "0";
          }, 120),
        );
      }

      window.dispatchEvent(new CustomEvent("nft-strike", { detail: { id: target.id } }));
    };

    const trigger = () => {
      if (!mounted) return;
      if (document.hidden) {
        timers.push(window.setTimeout(trigger, 10000));
        return;
      }

      fireOnce();
      timers.push(window.setTimeout(trigger, useLite ? 12000 + Math.random() * 7000 : 7000 + Math.random() * 6000));
    };

    timers.push(window.setTimeout(trigger, useLite ? 4500 : 3000));

    return () => {
      mounted = false;
      timers.forEach(clearTimeout);
    };
  }, [lite]);

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
        {bolts.map((bolt) => (
          <svg
            key={bolt.id}
            width={bolt.width}
            height={bolt.height}
            viewBox={`0 0 ${bolt.width} ${bolt.height}`}
            className="absolute animate-lightning"
            style={{
              left: bolt.left,
              top: bolt.top,
              filter: liteMode ? "none" : "drop-shadow(0 0 8px oklch(0.9 0.25 145 / 0.95))",
            }}
          >
            <path
              d={bolt.d}
              stroke="oklch(0.78 0.22 145)"
              strokeWidth={liteMode ? 2.2 : 4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={liteMode ? 0.28 : 0.42}
            />
            <path
              d={bolt.d}
              stroke="oklch(0.99 0.18 145)"
              strokeWidth={liteMode ? 0.9 : 1.2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ))}
      </div>
    </>
  );
}
