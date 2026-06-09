export function Candle({ delay = 0, scale = 1 }: { delay?: number; scale?: number }) {
  return (
    <div className="relative pointer-events-none" style={{ transform: `scale(${scale})` }}>
      <div
        className="candle-halo absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.85 0.25 145 / 0.7), transparent 70%)",
          animationDelay: `${delay}s`,
        }}
      />
      <div
        className="candle-flame absolute -top-9 left-1/2 -translate-x-1/2 w-4 h-11 rounded-full blur-[2px]"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.98 0.22 145), oklch(0.78 0.27 145) 55%, transparent 75%)",
          boxShadow: "0 0 18px oklch(0.85 0.25 145 / 0.95), 0 0 36px oklch(0.78 0.22 145 / 0.7)",
          animationDelay: `${delay}s`,
        }}
      />
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[2px] h-2 bg-neutral-900" />
      <div
        className="w-3 h-16 rounded-sm mx-auto relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #ffffff 0%, #f4f4f0 35%, #e6e4dc 70%, #cfcdc3 100%)",
          boxShadow:
            "inset -2px 0 3px rgba(0,0,0,0.18), inset 2px 0 2px rgba(255,255,255,0.6), 0 0 14px oklch(0.85 0.25 145 / 0.55)",
        }}
      >
        <div
          className="absolute inset-0 opacity-50 mix-blend-multiply"
          style={{
            backgroundImage:
              "repeating-linear-gradient(180deg, transparent 0 4px, rgba(0,0,0,0.05) 4px 5px), repeating-linear-gradient(90deg, transparent 0 1px, rgba(0,0,0,0.04) 1px 2px)",
          }}
        />
      </div>
    </div>
  );
}
