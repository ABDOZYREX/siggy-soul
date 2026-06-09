export function Smoke() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="smoke-plume absolute bottom-0 rounded-full blur-2xl"
          style={{
            left: `${15 + i * 28}%`,
            width: 120,
            height: 120,
            background: "radial-gradient(circle, oklch(0.7 0.2 145 / 0.35), transparent 70%)",
            animationDelay: `${i * 1.6}s`,
            animationDuration: `${9 + i * 1.5}s`,
          }}
        />
      ))}
    </div>
  );
}
