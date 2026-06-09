import { motion } from "framer-motion";

export function Smoke() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 rounded-full blur-2xl"
          style={{
            left: `${15 + i * 14}%`,
            width: 120,
            height: 120,
            background: "radial-gradient(circle, oklch(0.7 0.2 145 / 0.35), transparent 70%)",
          }}
          animate={{
            y: [0, -200, -400],
            x: [0, i % 2 ? 30 : -30, 0],
            opacity: [0, 0.6, 0],
            scale: [0.8, 1.4, 1.8],
          }}
          transition={{
            duration: 8 + i,
            repeat: Infinity,
            delay: i * 1.3,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
