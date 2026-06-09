import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const AUDIO_URL =
  "https://gateway.pinata.cloud/ipfs/bafybeid54kwdlvz4xbk33nka3fbtrfz4f3niok7p6yhryezixtx5vaacui";

export function AudioToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);
  const [muted, setMuted] = useState(false);

  // Lazily create the audio element
  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const a = new Audio();
    a.preload = "metadata";
    a.src = AUDIO_URL;
    a.loop = true;
    a.volume = 0.5;
    a.crossOrigin = "anonymous";
    audioRef.current = a;
    return a;
  }, []);

  // Try to play on first user interaction anywhere on the page
  useEffect(() => {
    const tryStart = () => {
      if (startedRef.current) return;
      const a = ensureAudio();
      a.muted = muted;
      a.play()
        .then(() => {
          startedRef.current = true;
        })
        .catch(() => {
          /* will retry on next interaction */
        });
    };
    const events: (keyof DocumentEventMap)[] = [
      "click",
      "keydown",
      "touchstart",
      "pointerdown",
    ];
    events.forEach((e) =>
      document.addEventListener(e, tryStart, { passive: true }),
    );
    return () => {
      events.forEach((e) => document.removeEventListener(e, tryStart));
    };
  }, [ensureAudio, muted]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = useCallback(() => {
    const a = ensureAudio();
    const next = !muted;
    a.muted = next;
    setMuted(next);
    if (!next) {
      a.play().catch(() => {});
    }
  }, [ensureAudio, muted]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? "Unmute soundtrack" : "Mute soundtrack"}
      className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-primary/70 bg-background/60 text-primary border-glow hover:bg-primary/10 transition-colors"
      style={{
        boxShadow:
          "0 0 12px oklch(0.78 0.22 145 / 0.7), 0 0 24px oklch(0.78 0.22 145 / 0.4)",
      }}
    >
      {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
    </button>
  );
}
