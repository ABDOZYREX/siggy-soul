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
  priority?: boolean;
  reducedEffects?: boolean;
  revealDelayMs?: number;
};

export function NftCard({
  id,
  name,
  image,
  busy,
  disabled,
  buttonLabel,
  onMint,
  priority = false,
  reducedEffects = false,
  revealDelayMs = 0,
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

  const imgSize = "w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] md:w-[420px] md:h-[420px]";
  const frameClass = reducedEffects
    ? "relative ornate-frame rounded-sm border-glow"
    : "relative ornate-frame rounded-sm border-glow-strong";

  return (
    <div
      className="intro-fade-up flex flex-col items-center"
      style={{ animationDelay: `${revealDelayMs}ms` }}
    >
      <div className="relative nft-card-shell">
        <div
          className={`card-aura ${reducedEffects ? "card-aura-lite" : ""}`}
          aria-hidden
        />
        <div className={frameClass}>
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
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority ? "high" : "auto"}
              className={`siggy-nft nft-card-image ${imgSize} object-cover ${struck ? "nft-struck" : ""}`}
              style={{
                boxShadow:
                  "0 0 14px oklch(0.78 0.22 145 / 0.24), 0 0 32px oklch(0.78 0.22 145 / 0.14)",
              }}
            />
          </div>
        </div>

        {!reducedEffects && (
          <>
            <div className="absolute bottom-0 left-0 -translate-x-[72%] pointer-events-none z-10 origin-bottom">
              <Candle delay={0.2} scale={1} />
            </div>
            <div className="absolute bottom-0 right-0 translate-x-[72%] pointer-events-none z-10 origin-bottom">
              <Candle delay={0.7} scale={1} />
            </div>
          </>
        )}
      </div>

      <h3 className="mt-16 font-display text-xl md:text-2xl tracking-[0.25em] uppercase text-primary text-glow text-center">
        {name}
      </h3>

      <button
        type="button"
        onClick={onMint}
        disabled={busy || disabled}
        className="mt-5 w-full max-w-[260px] px-8 py-4 font-display font-black text-xl tracking-[0.3em] text-background bg-primary border-glow overflow-hidden transition-transform duration-150 enabled:hover:scale-[1.01] enabled:active:scale-[0.99] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
