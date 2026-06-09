export function Candle({ delay = 0, scale = 1 }: { delay?: number; scale?: number }) {
  return (
    <div className="relative pointer-events-none" style={{ transform: `scale(${scale})` }}>
      <div
        className="candle-halo absolute -top-[22px] left-1/2 -translate-x-1/2 w-[22px] h-[28px] rounded-full blur-[7px]"
        style={{
          marginLeft: "2px",
          background:
            "radial-gradient(ellipse at center, oklch(0.82 0.2 145 / 0.15) 0%, oklch(0.79 0.18 145 / 0.09) 46%, transparent 80%)",
          animationDelay: `${delay}s`,
        }}
      />
      <div
        className="candle-flame absolute -top-[17px] left-1/2 -translate-x-1/2 w-[5px] h-[13px] rounded-full blur-[0.5px]"
        style={{
          marginLeft: "2px",
          background:
            "radial-gradient(ellipse at center, oklch(0.95 0.15 145 / 0.88) 0%, oklch(0.81 0.17 145 / 0.62) 52%, oklch(0.7 0.13 145 / 0.12) 76%, transparent 90%)",
          boxShadow:
            "0 0 3px oklch(0.84 0.2 145 / 0.24), 0 0 6px oklch(0.77 0.16 145 / 0.11)",
          animationDelay: `${delay}s`,
        }}
      />
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[2px] h-2 bg-neutral-900" />
      <div
        className="w-[8px] h-12 rounded-sm mx-auto relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #ffffff 0%, #f4f4f0 35%, #e6e4dc 70%, #cfcdc3 100%)",
          boxShadow:
            "inset -2px 0 3px rgba(0,0,0,0.18), inset 2px 0 2px rgba(255,255,255,0.6), 0 0 2px oklch(0.82 0.2 145 / 0.08)",
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
