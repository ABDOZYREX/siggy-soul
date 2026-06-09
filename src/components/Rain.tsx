import { useEffect, useRef } from "react";
import { shouldReduceEffects } from "@/lib/performance";

export function Rain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (shouldReduceEffects() || isMobile) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = 1;
    let w = 0;
    let h = 0;

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let resizeTimer: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    };
    window.addEventListener("resize", onResize, { passive: true });

    const drops = Array.from({ length: 5 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      l: 8 + Math.random() * 10,
      v: 260 + Math.random() * 160,
      o: 0.1 + Math.random() * 0.09,
    }));

    const frameInterval = 1000 / 18;
    let last = performance.now();
    let lastDraw = last;
    let raf = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - lastDraw < frameInterval) return;

      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      lastDraw = now;

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;

      for (const drop of drops) {
        drop.y += drop.v * dt;
        if (drop.y > h + 20) {
          drop.y = -20;
          drop.x = Math.random() * w;
        }

        ctx.strokeStyle = `oklch(0.85 0.12 145 / ${drop.o})`;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y - drop.l);
        ctx.stroke();
      }
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 w-full h-full"
      style={{ zIndex: 5 }}
    />
  );
}
