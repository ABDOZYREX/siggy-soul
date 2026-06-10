import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const AUDIO_URL =
  "https://gateway.pinata.cloud/ipfs/bafybeid54kwdlvz4xbk33nka3fbtrfz4f3niok7p6yhryezixtx5vaacui";
const AUDIO_PREF_KEY = "siggy-soul-audio-enabled";

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
    const storedPreference =
      typeof window !== "undefined" ? window.localStorage.getItem(AUDIO_PREF_KEY) : null;

    const syncEnabled = () => {
      setEnabled(!audio.paused && !audio.muted);
    };

    const detachInteractionListeners = () => {
      if (!interactionArmed) return;
      interactionArmed = false;
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("mousemove", handleFirstInteraction);
      window.removeEventListener("wheel", handleFirstInteraction);
      window.removeEventListener("scroll", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };

    const startPlayback = async (bootstrapMuted = false) => {
      try {
        if (bootstrapMuted) {
          audio.muted = true;
          await audio.play();
        } else {
          audio.muted = false;
          await audio.play();
          try {
            window.localStorage.setItem(AUDIO_PREF_KEY, "true");
          } catch {
            /* ignore */
          }
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

    void startPlayback(storedPreference !== "true");
    window.addEventListener("pointerdown", handleFirstInteraction, { passive: true });
    window.addEventListener("mousemove", handleFirstInteraction, { passive: true });
    window.addEventListener("wheel", handleFirstInteraction, { passive: true });
    window.addEventListener("scroll", handleFirstInteraction, { passive: true });
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
      try {
        window.localStorage.setItem(AUDIO_PREF_KEY, "false");
      } catch {
        /* ignore */
      }
      setEnabled(false);
      return;
    }

    audio.muted = false;
    audio
      .play()
      .then(() => {
        try {
          window.localStorage.setItem(AUDIO_PREF_KEY, "true");
        } catch {
          /* ignore */
        }
        setEnabled(true);
      })
      .catch(() => setEnabled(false));
  }, [ensureAudio]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={enabled ? "Mute soundtrack" : "Play soundtrack"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/70 bg-background/60 text-primary border-glow transition-colors hover:bg-primary/10 sm:h-10 sm:w-10"
      style={{
        boxShadow:
          "0 0 12px oklch(0.78 0.22 145 / 0.7), 0 0 24px oklch(0.78 0.22 145 / 0.4)",
      }}
    >
      {enabled ? <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" /> : <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />}
    </button>
  );
}
