import { motion } from "framer-motion";
import { Music2, Play, Pause, Mic2 } from "lucide-react";
import type { Track } from "../types";
import type { PlayerState } from "../hooks/usePlayer";
import { useSettings } from "../context/SettingsContext";
import { AlbumArt } from "./AlbumArt";

export function Library({ tracks, player }: { tracks: Track[]; player: PlayerState }) {
  const { t } = useSettings();

  if (tracks.length === 0) {
    return (
      <div className="grid h-full place-items-center px-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-3xl panel">
            <Music2 className="h-9 w-9 text-dim" strokeWidth={2.2} />
          </div>
          <h2 className="heading text-2xl">{t.library.empty}</h2>
          <p className="text-dim max-w-xs text-sm">{t.library.emptyHint}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-area mx-auto h-full w-full max-w-3xl overflow-y-auto px-4 pb-6 pt-2">
      <div className="mb-4 flex items-baseline justify-between px-1">
        <h2 className="heading text-3xl">{t.library.title}</h2>
        <span className="text-faint text-sm">{t.library.count(tracks.length)}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {tracks.map((track, i) => {
          const isCurrent = player.index === i;
          const isPlaying = isCurrent && player.isPlaying;
          return (
            <motion.button
              key={track.id}
              onClick={() => {
                if (isCurrent) player.toggle();
                else {
                  player.selectTrack(i);
                  // play after selection
                  setTimeout(() => player.play(), 0);
                }
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.025, 0.4), ease: [0.32, 0.72, 0, 1] }}
              className="pressable group flex items-center gap-3 rounded-2xl p-2 pr-4 text-left"
              style={{ background: isCurrent ? "var(--panel-strong)" : "transparent" }}
            >
              <div className="relative shrink-0">
                <AlbumArt track={track} isPlaying={isPlaying} size="sm" />
                <div
                  className="absolute inset-0 grid place-items-center rounded-2xl bg-black/35 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ opacity: isCurrent ? 1 : undefined }}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5 text-white" strokeWidth={2.6} fill="currentColor" />
                  ) : (
                    <Play className="h-5 w-5 text-white" strokeWidth={2.6} fill="currentColor" />
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="heading truncate text-[15px]"
                  style={{ color: isCurrent ? "var(--accent)" : "var(--text)" }}
                >
                  {track.title}
                </p>
                <p className="text-dim truncate text-[13px]">
                  {track.artist || t.player.unknownArtist}
                </p>
              </div>
              {track.subtitles && (
                <span className="text-faint flex shrink-0 items-center gap-1 text-[11px]">
                  <Mic2 className="h-3.5 w-3.5" strokeWidth={2.4} />
                  <span className="hidden sm:inline">{t.library.hasSubs}</span>
                </span>
              )}
              {isPlaying && <PlayingBars />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function PlayingBars() {
  return (
    <span className="flex h-4 shrink-0 items-end gap-[2px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full"
          style={{ background: "var(--accent)" }}
          animate={{ height: ["30%", "100%", "45%", "80%", "30%"] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}
