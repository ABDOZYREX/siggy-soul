import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const AUDIO_URL =
  "https://gateway.pinata.cloud/ipfs/bafybeid54kwdlvz4xbk33nka3fbtrfz4f3niok7p6yhryezixtx5vaacui";

export function AudioToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = AUDIO_URL;
    audio.loop = true;
    audio.volume = 0.5;
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;
    return audio;
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = useCallback(() => {
    const audio = ensureAudio();

    if (enabled) {
      audio.pause();
      setEnabled(false);
      return;
    }

    audio.play().then(() => setEnabled(true)).catch(() => {
      setEnabled(false);
    });
  }, [enabled, ensureAudio]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={enabled ? "Mute soundtrack" : "Play soundtrack"}
      className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-primary/70 bg-background/60 text-primary border-glow hover:bg-primary/10 transition-colors"
      style={{
        boxShadow:
          "0 0 12px oklch(0.78 0.22 145 / 0.7), 0 0 24px oklch(0.78 0.22 145 / 0.4)",
      }}
    >
      {enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
    </button>
  );
}
