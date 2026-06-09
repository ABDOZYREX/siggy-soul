import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Candle } from "@/components/Candle";

type Props = {
  id: string;
  name: string;
  image: string;
  busy: boolean;
  disabled?: boolean;
  buttonLabel: string;
  onMint: () => void;
  size?: "lg" | "md";
};

export function NftCard({
  id,
  name,
  image,
  busy,
  disabled,
  buttonLabel,
  onMint,
  size = "md",
}: Props) {
  const [struck, setStruck] = useState(false);

  useEffect(() => {
    let timeout: number | undefined;
    const onStrike = (e: Event) => {
      const ce = e as CustomEvent<{ id?: string }>;
      if (ce.detail?.id !== id) return;
      setStruck(true);
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setStruck(false), 220);
    };
    window.addEventListener("nft-strike", onStrike as EventListener);
    return () => {
      window.removeEventListener("nft-strike", onStrike as EventListener);
      window.clearTimeout(timeout);
    };
  }, [id]);

  // Uniform large size for every NFT in the trinity collection
  const imgSize =
    "w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] md:w-[420px] md:h-[420px]";
  void size;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      <div className="relative">
        <motion.div
          className="relative ornate-frame rounded-sm border-glow-strong animate-flicker"
          animate={{
            boxShadow: [
              "0 0 30px oklch(0.78 0.22 145 / 0.5), 0 0 60px oklch(0.78 0.22 145 / 0.25)",
              "0 0 50px oklch(0.78 0.22 145 / 0.7), 0 0 90px oklch(0.78 0.22 145 / 0.35)",
              "0 0 30px oklch(0.78 0.22 145 / 0.5), 0 0 60px oklch(0.78 0.22 145 / 0.25)",
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative bg-background p-3">
            {["top-1 left-1", "top-1 right-1", "bottom-1 left-1", "bottom-1 right-1"].map(
              (p) => (
                <div key={p} className={`absolute ${p} w-4 h-4 border border-primary/60`} />
              ),
            )}
            <img
              id={id}
              src={image}
              alt={name}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className={`siggy-nft ${imgSize} object-cover ${struck ? "nft-struck" : ""}`}
              style={{
                boxShadow:
                  "0 0 24px oklch(0.78 0.22 145 / 0.6), 0 0 48px oklch(0.78 0.22 145 / 0.4)",
              }}
            />
          </div>
        </motion.div>

      {/* Candles anchored to the frame's bottom baseline, sitting just outside the sides */}
      <div className="absolute bottom-0 -left-5 pointer-events-none z-10 origin-bottom">
        <Candle delay={0.2} scale={1} />
      </div>
      <div className="absolute bottom-0 -right-5 pointer-events-none z-10 origin-bottom">
        <Candle delay={0.7} scale={1} />
      </div>
      </div>

      <h3 className="mt-16 font-display text-xl md:text-2xl tracking-[0.25em] uppercase text-primary text-glow text-center">
        {name}
      </h3>

      <motion.button
        whileHover={{ scale: busy || disabled ? 1 : 1.02 }}
        whileTap={{ scale: busy || disabled ? 1 : 0.98 }}
        onClick={onMint}
        disabled={busy || disabled}
        className="mt-5 w-full max-w-[260px] px-8 py-4 font-display font-black text-xl tracking-[0.3em] text-background bg-primary border-glow-strong overflow-hidden disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
      >
        {buttonLabel}
      </motion.button>
    </motion.div>
  );
}
