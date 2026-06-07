import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Cue, Track } from "../types";
import { parseVtt, activeCueIndex } from "../lib/vtt";
import { asset } from "../lib/format";
import { useSettings } from "../context/SettingsContext";

interface Props {
  track: Track | null;
  currentTime: number;
  onSeek: (t: number) => void;
}

export function Subtitles({ track, currentTime, onSeek }: Props) {
  const { t } = useSettings();
  const [cues, setCues] = useState<Cue[]>([]);
  const [loaded, setLoaded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setCues([]);
    setLoaded(false);
    if (!track?.subtitles) return;
    let alive = true;
    fetch(asset(track.subtitles))
      .then((r) => (r.ok ? r.text() : ""))
      .then((raw) => {
        if (!alive) return;
        setCues(parseVtt(raw));
        setLoaded(true);
      })
      .catch(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [track?.subtitles]);

  const active = useMemo(() => activeCueIndex(cues, currentTime), [cues, currentTime]);

  // keep the active line centered
  useEffect(() => {
    if (activeRef.current && listRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [active]);

  if (!track || !track.subtitles) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <p className="text-faint text-sm">{t.player.noSubtitles}</p>
      </div>
    );
  }

  if (loaded && cues.length === 0) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <p className="text-faint text-sm">{t.player.noSubtitles}</p>
      </div>
    );
  }

  return (
    <div ref={listRef} className="scroll-area h-full overflow-y-auto px-2 py-7">
      <div className="mx-auto flex max-w-md flex-col gap-3.5">
        {cues.map((cue, i) => {
          const isActive = i === active;
          // Karaoke sweep: brighten the already-sung portion of the active line.
          const span = Math.max(0.2, cue.end - cue.start);
          const p = isActive
            ? Math.min(100, Math.max(0, ((currentTime - cue.start) / span) * 100))
            : 0;
          const sweep = `linear-gradient(to right, var(--text) ${p}%, var(--text-dim) ${p}%)`;
          return (
            <button
              key={i}
              ref={isActive ? activeRef : undefined}
              onClick={() => onSeek(cue.start + 0.01)}
              className="pressable rounded-2xl px-4 py-1.5 text-left"
            >
              <motion.span
                className="block heading leading-snug"
                animate={{
                  opacity: isActive ? 1 : i < active ? 0.28 : 0.46,
                  scale: isActive ? 1 : 0.97,
                  filter: isActive ? "blur(0px)" : "blur(0.4px)",
                }}
                transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                style={{
                  fontSize: isActive ? "1.55rem" : "1.12rem",
                  fontWeight: isActive ? 900 : 700,
                  letterSpacing: "-0.02em",
                  ...(isActive
                    ? {
                        backgroundImage: sweep,
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                      }
                    : { color: "var(--text-dim)" }),
                }}
              >
                {cue.text}
              </motion.span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
