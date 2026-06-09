import { useEffect, useRef } from "react";

/**
 * Ultra-lightweight canvas rain — drastically reduced drop count for fluid performance.
 */
export function Rain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    // On mobile, fully disable the JS rain loop — zero CPU usage
    if (reduce || isMobile) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = 1;
    let w = 0, h = 0;
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
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

    // Extremely low density: only 12 subtle streaks on desktop
    const COUNT = 12;
    const frameInterval = 1000 / 30;

    const drops = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      l: 8 + Math.random() * 14,
      v: 360 + Math.random() * 300,
      o: 0.14 + Math.random() * 0.18,
    }));

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
      for (const d of drops) {
        d.y += d.v * dt;
        if (d.y > h + 20) { d.y = -20; d.x = Math.random() * w; }
        ctx.strokeStyle = `oklch(0.85 0.12 145 / ${d.o})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x, d.y - d.l);
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

