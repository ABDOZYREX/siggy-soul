export function Smoke() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="smoke-plume absolute bottom-0 rounded-full blur-2xl"
          style={{
            left: `${20 + i * 34}%`,
            width: 90,
            height: 90,
            background: "radial-gradient(circle, oklch(0.7 0.2 145 / 0.24), transparent 72%)",
            animationDelay: `${i * 1.8}s`,
            animationDuration: `${10 + i * 1.6}s`,
          }}
        />
      ))}
    </div>
  );
}
