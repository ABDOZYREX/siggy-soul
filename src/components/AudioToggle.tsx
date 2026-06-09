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
    audio.preload = "auto";
    audio.src = AUDIO_URL;
    audio.autoplay = true;
    audio.loop = true;
    audio.volume = 0.5;
    audio.playsInline = true;
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;
    return audio;
  }, []);

  useEffect(() => {
    const audio = ensureAudio();
    let interactionArmed = true;

    const syncEnabled = () => {
      setEnabled(!audio.paused && !audio.muted);
    };

    const detachInteractionListeners = () => {
      if (!interactionArmed) return;
      interactionArmed = false;
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };

    const startPlayback = async (bootstrapMuted = false) => {
      try {
        if (bootstrapMuted) {
          audio.muted = true;
          await audio.play();
          audio.muted = false;
        } else {
          audio.muted = false;
          await audio.play();
        }

        syncEnabled();
        detachInteractionListeners();
        return true;
      } catch {
        setEnabled(false);
        return false;
      }
    };

    const handleFirstInteraction = () => {
      void startPlayback(false);
    };

    audio.addEventListener("play", syncEnabled);
    audio.addEventListener("pause", syncEnabled);
    audio.addEventListener("volumechange", syncEnabled);

    void startPlayback(true);
    window.addEventListener("pointerdown", handleFirstInteraction, { passive: true });
    window.addEventListener("keydown", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction, { passive: true });

    return () => {
      detachInteractionListeners();
      audio.removeEventListener("play", syncEnabled);
      audio.removeEventListener("pause", syncEnabled);
      audio.removeEventListener("volumechange", syncEnabled);
      audio.pause();
      audioRef.current = null;
    };
  }, [ensureAudio]);

  const toggle = useCallback(() => {
    const audio = ensureAudio();

    if (!audio.paused) {
      audio.pause();
      setEnabled(false);
      return;
    }

    audio.muted = false;
    audio.play().then(() => setEnabled(true)).catch(() => setEnabled(false));
  }, [ensureAudio]);

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
