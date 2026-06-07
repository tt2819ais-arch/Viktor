import { useState } from "react";
import { motion } from "framer-motion";
import { Music2, Play, Pause, Mic2, Search as SearchIcon, Heart, X, WifiOff } from "lucide-react";
import type { Track } from "../types";
import type { PlayerState } from "../hooks/usePlayer";
import type { useFavorites } from "../hooks/useFavorites";
import { useSettings } from "../context/SettingsContext";
import { AlbumArt } from "./AlbumArt";

type Fav = ReturnType<typeof useFavorites>;

export function Library({
  tracks,
  player,
  fav,
  error,
}: {
  tracks: Track[];
  player: PlayerState;
  fav: Fav;
  error?: boolean;
}) {
  const { t } = useSettings();
  const [query, setQuery] = useState("");
  const [onlyFavs, setOnlyFavs] = useState(false);

  const q = query.trim().toLowerCase();
  const filtered = tracks.filter((tr) => {
    if (onlyFavs && !fav.isFav(tr.id)) return false;
    if (!q) return true;
    return (tr.title + " " + tr.artist).toLowerCase().includes(q);
  });

  if (error) {
    return (
      <div className="grid h-full place-items-center px-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-3xl panel">
            <WifiOff className="h-9 w-9 text-dim" strokeWidth={2.2} />
          </div>
          <h2 className="heading text-2xl">{t.library.offline}</h2>
          <p className="text-dim max-w-xs text-sm">{t.library.offlineHint}</p>
        </div>
      </div>
    );
  }

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
        <span className="text-faint text-sm">{t.library.count(filtered.length)}</span>
      </div>

      {/* quick filter + favorites */}
      <div className="mb-3 flex items-center gap-2 px-1">
        <div className="relative flex-1">
          <SearchIcon className="text-faint pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" strokeWidth={2.4} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.library.filter}
            className="w-full rounded-full py-2.5 pl-10 pr-9 text-[14px] outline-none"
            style={{ background: "var(--panel-strong)", color: "var(--text)" }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-dim" aria-label="clear">
              <X className="h-4 w-4" strokeWidth={2.6} />
            </button>
          )}
        </div>
        <button
          onClick={() => setOnlyFavs((v) => !v)}
          className="pressable grid h-10 w-10 shrink-0 place-items-center rounded-full"
          style={{ background: onlyFavs ? "var(--accent)" : "var(--panel-strong)", color: onlyFavs ? "var(--on-accent)" : "var(--text-dim)" }}
          aria-label="favorites"
        >
          <Heart className="h-[18px] w-[18px]" strokeWidth={2.4} fill={onlyFavs ? "currentColor" : "none"} />
        </button>
      </div>

      {filtered.length === 0 && <p className="text-faint px-1 py-8 text-center text-sm">—</p>}

      <div className="flex flex-col gap-1.5">
        {filtered.map((track, i) => (
          <TrackRow
            key={track.id}
            track={track}
            player={player}
            fav={fav}
            onPlay={() => {
              if (player.current?.id === track.id) player.toggle();
              else player.setQueue(filtered, i, true);
            }}
            delay={Math.min(i * 0.025, 0.4)}
          />
        ))}
      </div>
    </div>
  );
}

export function TrackRow({
  track,
  player,
  fav,
  onPlay,
  delay = 0,
}: {
  track: Track;
  player: PlayerState;
  fav?: Fav;
  onPlay: () => void;
  delay?: number;
}) {
  const { t } = useSettings();
  const isCurrent = player.current?.id === track.id;
  const isPlaying = isCurrent && player.isPlaying;
  const liked = fav?.isFav(track.id) ?? false;

  return (
    <motion.button
      onClick={onPlay}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.32, 0.72, 0, 1] }}
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
        <p className="heading truncate text-[15px]" style={{ color: isCurrent ? "var(--accent)" : "var(--text)" }}>
          {track.title}
        </p>
        <p className="text-dim truncate text-[13px]">{track.artist || t.player.unknownArtist}</p>
      </div>
      {track.subtitles && (
        <span className="text-faint flex shrink-0 items-center gap-1 text-[11px]">
          <Mic2 className="h-3.5 w-3.5" strokeWidth={2.4} />
          <span className="hidden sm:inline">{t.library.hasSubs}</span>
        </span>
      )}
      {fav && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); fav.toggle(track.id); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); fav.toggle(track.id); } }}
          className="pressable grid h-8 w-8 shrink-0 place-items-center rounded-full"
          style={{ color: liked ? "var(--accent)" : "var(--text-faint)" }}
          aria-label="like"
        >
          <Heart className="h-[18px] w-[18px]" strokeWidth={2.4} fill={liked ? "currentColor" : "none"} />
        </span>
      )}
      {isPlaying && <PlayingBars />}
    </motion.button>
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
