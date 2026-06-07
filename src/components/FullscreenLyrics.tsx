import { useState } from "react";
import { motion } from "framer-motion";
import { X, Languages, Play, Pause } from "lucide-react";
import type { PlayerState } from "../hooks/usePlayer";
import { Subtitles } from "./Subtitles";

export function FullscreenLyrics({ player, onClose }: { player: PlayerState; onClose: () => void }) {
  const [translate, setTranslate] = useState(false);
  const { current } = player;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col bg-[var(--bg)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="safe-top flex items-center justify-between px-5 pt-4">
        <div className="min-w-0">
          <p className="heading truncate text-base">{current?.title}</p>
          <p className="text-dim truncate text-xs">{current?.artist}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTranslate((v) => !v)}
            className="pressable grid h-10 w-10 place-items-center rounded-full"
            style={{
              background: translate ? "var(--accent)" : "var(--panel-strong)",
              color: translate ? "var(--on-accent)" : "var(--text-dim)",
            }}
            aria-label="translate"
          >
            <Languages className="h-5 w-5" strokeWidth={2.4} />
          </button>
          <button onClick={onClose} className="pressable grid h-10 w-10 place-items-center rounded-full panel-strong" aria-label="close">
            <X className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <Subtitles track={current} currentTime={player.currentTime} onSeek={player.seek} big translate={translate} />
      </div>

      <div className="safe-bottom flex items-center justify-center gap-6 px-5 pb-8 pt-3">
        <button onClick={player.prev} className="pressable text-dim" aria-label="prev">‹‹</button>
        <button
          onClick={player.toggle}
          className="grid h-16 w-16 place-items-center rounded-full"
          style={{ background: "var(--accent)", color: "var(--on-accent)" }}
          aria-label="toggle"
        >
          {player.isPlaying ? <Pause className="h-7 w-7" strokeWidth={2.6} fill="currentColor" /> : <Play className="ml-0.5 h-7 w-7" strokeWidth={2.6} fill="currentColor" />}
        </button>
        <button onClick={player.next} className="pressable text-dim" aria-label="next">››</button>
      </div>
    </motion.div>
  );
}
