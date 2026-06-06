import { motion } from "framer-motion";
import { Play, Pause, SkipForward, ChevronUp } from "lucide-react";
import type { PlayerState } from "../hooks/usePlayer";
import { useSettings } from "../context/SettingsContext";
import { AlbumArt } from "./AlbumArt";

export function MiniBar({ player, onExpand }: { player: PlayerState; onExpand: () => void }) {
  const { t } = useSettings();
  const { current } = player;
  if (!current) return null;

  const pct = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
      className="safe-bottom pointer-events-none fixed inset-x-0 bottom-[76px] z-20 flex justify-center px-4 lg:bottom-5 lg:left-[88px] lg:px-8"
    >
      <div className="panel-strong pointer-events-auto flex w-full max-w-2xl items-center gap-3 overflow-hidden rounded-3xl p-2 pr-3 shadow-2xl">
        <button onClick={onExpand} className="pressable flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={t.tabs.player}>
          <div className="relative shrink-0">
            <AlbumArt track={current} isPlaying={player.isPlaying} size="sm" />
            <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/30">
              <ChevronUp className="h-4 w-4 text-white" strokeWidth={2.6} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="heading truncate text-sm">{current.title}</p>
            <p className="text-dim truncate text-xs">{current.artist || t.player.unknownArtist}</p>
          </div>
        </button>

        <button
          onClick={player.toggle}
          aria-label={player.isPlaying ? t.controls.pause : t.controls.play}
          className="pressable grid h-11 w-11 shrink-0 place-items-center rounded-full"
          style={{ background: "var(--accent)", color: "var(--on-accent)" }}
        >
          {player.isPlaying ? (
            <Pause className="h-5 w-5" strokeWidth={2.6} fill="currentColor" />
          ) : (
            <Play className="ml-0.5 h-5 w-5" strokeWidth={2.6} fill="currentColor" />
          )}
        </button>
        <button onClick={player.next} aria-label={t.controls.next} className="pressable hidden h-11 w-11 shrink-0 place-items-center rounded-full panel sm:grid">
          <SkipForward className="h-5 w-5" strokeWidth={2.4} fill="currentColor" />
        </button>

        {/* progress line */}
        <div className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: "var(--border)" }}>
          <div className="h-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
        </div>
      </div>
    </motion.div>
  );
}
