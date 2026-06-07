import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Cue, Track } from "../types";
import { parseVtt, activeCueIndex } from "../lib/vtt";
import { asset } from "../lib/format";
import { translateLine } from "../lib/translate";
import { useSettings } from "../context/SettingsContext";

interface Props {
  track: Track | null;
  currentTime: number;
  onSeek: (t: number) => void;
  big?: boolean;
  translate?: boolean;
}

export function Subtitles({ track, currentTime, onSeek, big = false, translate = false }: Props) {
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

  // optional translation of the active line
  const [trans, setTrans] = useState("");
  useEffect(() => {
    if (!translate || active < 0 || !cues[active]) { setTrans(""); return; }
    let alive = true;
    translateLine(cues[active].text).then((x) => { if (alive) setTrans(x); });
    return () => { alive = false; };
  }, [active, translate, cues]);

  // keep the active line centered with a gentle, custom-eased scroll
  // (native smooth-scroll feels abrupt; this glides over ~0.6s).
  useEffect(() => {
    const list = listRef.current;
    const el = activeRef.current;
    if (!list || !el) return;
    const target = el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2;
    const start = list.scrollTop;
    const dist = target - start;
    if (Math.abs(dist) < 2) return;
    const dur = 620;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    let startT: number | null = null;
    let raf = 0;
    const step = (ts: number) => {
      if (startT == null) startT = ts;
      const p = Math.min(1, (ts - startT) / dur);
      list.scrollTop = start + dist * ease(p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
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
                <span className="block heading leading-snug" style={{ fontSize: big ? "2.1rem" : "1.5rem", letterSpacing: "-0.02em", transition: "font-size 0.4s cubic-bezier(0.32,0.72,0,1)" }}>
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
                {translate && trans && (
                  <span className="mt-1.5 block font-medium leading-snug" style={{ fontSize: big ? "1.2rem" : "0.95rem", color: "var(--text-dim)", opacity: 0.85 }}>
                    {trans}
                  </span>
                )}
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
                style={{ fontSize: big ? "1.5rem" : "1.12rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-dim)", transition: "font-size 0.4s cubic-bezier(0.32,0.72,0,1), opacity 0.4s" }}
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
