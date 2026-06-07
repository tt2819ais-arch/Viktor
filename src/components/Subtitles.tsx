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
          if (isActive) {
            const tokens = wordTimings(cue.text, cue.start, cue.end);
            // index of the current word = last started word token
            let cur = -1;
            for (const tk of tokens) {
              if (!tk.isSpace && currentTime >= tk.start) cur = tk.idx;
            }
            return (
              <button
                key={i}
                ref={activeRef}
                onClick={() => onSeek(cue.start + 0.01)}
                className="pressable rounded-2xl px-4 py-1.5 text-left"
              >
                <span className="block heading leading-snug" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
                  {tokens.map((tk) => {
                    if (tk.isSpace) return <span key={tk.idx}>{tk.w}</span>;
                    const current = tk.idx === cur;
                    const sung = cur >= 0 && tk.idx < cur;
                    return (
                      <motion.span
                        key={tk.idx}
                        animate={{ scale: current ? 1.04 : 1 }}
                        transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                        style={{
                          display: "inline-block",
                          fontWeight: current ? 900 : 700,
                          color: current ? "var(--text)" : sung ? "var(--text)" : "var(--text-dim)",
                          opacity: current ? 1 : sung ? 0.92 : 0.6,
                          textShadow: current ? "0 0 22px var(--accent)" : "none",
                        }}
                      >
                        {tk.w}
                      </motion.span>
                    );
                  })}
                </span>
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => onSeek(cue.start + 0.01)}
              className="pressable rounded-2xl px-4 py-1.5 text-left"
            >
              <motion.span
                className="block heading leading-snug"
                animate={{ opacity: i < active ? 0.28 : 0.46, scale: 0.97, filter: "blur(0.4px)" }}
                transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                style={{ fontSize: "1.12rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-dim)" }}
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

type WordToken = { w: string; idx: number; isSpace: boolean; start: number; end: number };

// Split a line into word/space tokens and distribute the line's [start,end]
// across the words proportionally to their length. Discrete per-word timing —
// no continuous gradient, so the highlight doesn't lag.
function wordTimings(text: string, start: number, end: number): WordToken[] {
  const parts = text.split(/(\s+)/).filter((p) => p.length > 0);
  const weight = (p: string) => (/^\s+$/.test(p) ? 0 : p.length + 1);
  const total = parts.reduce((s, p) => s + weight(p), 0) || 1;
  const dur = Math.max(0.2, end - start);
  let acc = 0;
  return parts.map((p, idx) => {
    const isSpace = /^\s+$/.test(p);
    const wStart = start + (acc / total) * dur;
    acc += weight(p);
    const wEnd = start + (acc / total) * dur;
    return { w: p, idx, isSpace, start: wStart, end: wEnd };
  });
}
