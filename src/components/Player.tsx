import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Music2,
  AudioLines,
  Heart,
  MoreHorizontal,
  Maximize2,
  Share2,
} from "lucide-react";
import type { PlayerState } from "../hooks/usePlayer";
import type { useFavorites } from "../hooks/useFavorites";
import { useSettings } from "../context/SettingsContext";
import { SeekBar } from "./SeekBar";
import { Subtitles } from "./Subtitles";
import { Visualizer } from "./Visualizer";
import { MoreSheet } from "./MoreSheet";
import { FullscreenLyrics } from "./FullscreenLyrics";
import { QuoteCard } from "./QuoteCard";

type Fav = ReturnType<typeof useFavorites>;

export function Player({ player, fav }: { player: PlayerState; fav: Fav }) {
  const { t, visualizer, vizStyle } = useSettings();
  // Subtitles are always visible (they can no longer be hidden). The simple
  // button below toggles a compact equalizer overlay on the subtitle panel.
  const [showViz, setShowViz] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [quote, setQuote] = useState(false);
  const { current } = player;
  const hasSubs = Boolean(current?.subtitles);
  const liked = current ? fav.isFav(current.id) : false;

  if (!current) {
    return (
      <div className="grid h-full place-items-center px-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-3xl panel">
            <Music2 className="h-9 w-9 text-dim" strokeWidth={2.2} />
          </div>
          <h2 className="heading text-2xl">{t.player.nothingTitle}</h2>
          <p className="text-dim max-w-xs text-sm">{t.player.nothingHint}</p>
        </div>
      </div>
    );
  }

  const VolIcon = player.muted || player.volume === 0 ? VolumeX : player.volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="scroll-area mx-auto flex h-full w-full max-w-2xl flex-col gap-3 overflow-y-auto px-5 pb-4 pt-3 sm:gap-4">
      {/* Now playing header (always visible, no album art) */}
      <div className="flex shrink-0 flex-col items-center gap-0.5 px-1 text-center">
        <span className="text-faint text-[11px] uppercase tracking-[0.18em]">{t.player.now}</span>
        <h1 className="heading text-2xl leading-tight sm:text-3xl">{current.title}</h1>
        <p className="text-dim text-sm sm:text-base">{current.artist || t.player.unknownArtist}</p>
      </div>

      {/* Main panel: subtitles always visible; optional compact equalizer overlay.
          Swipe left/right to change track. */}
      <div className="relative min-h-0 shrink-0">
        <motion.div
          className="panel relative h-[clamp(200px,38vh,440px)] overflow-hidden rounded-[28px]"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={(_, info) => {
            if (info.offset.x < -70) player.next();
            else if (info.offset.x > 70) player.prev();
          }}
        >
          {hasSubs ? (
            <>
              <Subtitles track={current} currentTime={player.currentTime} onSeek={player.seek} />
              {/* fullscreen lyrics button */}
              <button
                onClick={() => setFullscreen(true)}
                className="pressable absolute right-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-full panel-strong text-dim"
                aria-label="fullscreen"
              >
                <Maximize2 className="h-4 w-4" strokeWidth={2.4} />
              </button>
              <AnimatePresence>
                {showViz && visualizer && (
                  <motion.div
                    key="eq"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25 }}
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-16 items-end justify-center bg-gradient-to-t from-[var(--bg)]/70 to-transparent"
                  >
                    <Visualizer
                      getAnalyser={player.getAnalyser}
                      isPlaying={player.isPlaying}
                      variant={vizStyle}
                      className="h-10 w-full max-w-[420px] px-8 opacity-80"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="grid h-full place-items-center">
              {visualizer ? (
                <Visualizer
                  getAnalyser={player.getAnalyser}
                  isPlaying={player.isPlaying}
                  variant={vizStyle}
                  className="h-40 w-full max-w-[440px] px-6"
                />
              ) : (
                <Music2 className="h-12 w-12 text-dim" strokeWidth={2} />
              )}
            </div>
          )}
        </motion.div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 sm:gap-4">
        {/* seek */}
        <div className="px-1">
          <SeekBar currentTime={player.currentTime} duration={player.duration} onSeek={player.seek} />
        </div>

        {/* transport (simple): prev / play / next */}
        <div className="flex items-center justify-center gap-5 lg:justify-start">
          <button
            onClick={player.prev}
            aria-label={t.controls.prev}
            className="pressable grid h-12 w-12 place-items-center rounded-full panel"
          >
            <SkipBack className="h-5 w-5" strokeWidth={2.4} fill="currentColor" />
          </button>

          <motion.button
            onClick={player.toggle}
            aria-label={player.isPlaying ? t.controls.pause : t.controls.play}
            whileTap={{ scale: 0.92 }}
            className="grid h-16 w-16 place-items-center rounded-full"
            style={{ background: "var(--accent)", color: "var(--on-accent)" }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {player.isPlaying ? (
                <motion.span key="pause" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Pause className="h-7 w-7" strokeWidth={2.6} fill="currentColor" />
                </motion.span>
              ) : (
                <motion.span key="play" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.15 }} className="ml-0.5">
                  <Play className="h-7 w-7" strokeWidth={2.6} fill="currentColor" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <button
            onClick={player.next}
            aria-label={t.controls.next}
            className="pressable grid h-12 w-12 place-items-center rounded-full panel"
          >
            <SkipForward className="h-5 w-5" strokeWidth={2.4} fill="currentColor" />
          </button>
        </div>

        {/* utility row: like · shuffle · repeat · quote · more */}
        <div className="flex items-center justify-center gap-5 lg:justify-start">
          <UtilBtn active={liked} onClick={() => current && fav.toggle(current.id)} label="like">
            <Heart className="h-5 w-5" strokeWidth={2.4} fill={liked ? "currentColor" : "none"} />
          </UtilBtn>
          <UtilBtn active={player.shuffle} onClick={player.toggleShuffle} label={t.controls.shuffle}>
            <Shuffle className="h-5 w-5" strokeWidth={2.4} />
          </UtilBtn>
          <UtilBtn active={player.repeat !== "off"} onClick={player.cycleRepeat} label={t.controls.repeat}>
            {player.repeat === "one" ? <Repeat1 className="h-5 w-5" strokeWidth={2.4} /> : <Repeat className="h-5 w-5" strokeWidth={2.4} />}
          </UtilBtn>
          {hasSubs && (
            <UtilBtn active={false} onClick={() => setQuote(true)} label="quote">
              <Share2 className="h-5 w-5" strokeWidth={2.4} />
            </UtilBtn>
          )}
          <UtilBtn active={sheet} onClick={() => setSheet(true)} label="more">
            <MoreHorizontal className="h-5 w-5" strokeWidth={2.4} />
          </UtilBtn>
        </div>

        {/* volume + lyrics toggle */}
        <div className="flex items-center gap-3 px-1">
          <button onClick={player.toggleMute} aria-label={t.controls.mute} className="pressable shrink-0">
            <VolIcon className="h-5 w-5 text-dim" strokeWidth={2.4} />
          </button>
          <input
            type="range"
            className="slider h-1.5 flex-1 rounded-full"
            min={0}
            max={1}
            step={0.01}
            value={player.muted ? 0 : player.volume}
            onChange={(e) => player.setVolume(parseFloat(e.target.value))}
            style={{
              background: `linear-gradient(to right, var(--accent) ${(player.muted ? 0 : player.volume) * 100}%, var(--border-strong) ${(player.muted ? 0 : player.volume) * 100}%)`,
            }}
            aria-label={t.controls.volume}
          />
          {hasSubs && (
            <button
              onClick={() => setShowViz((s) => !s)}
              className={`pressable grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                showViz ? "text-[var(--accent)]" : "text-dim"
              }`}
              aria-label="Эквалайзер"
              title="Эквалайзер"
            >
              <AudioLines className="h-[18px] w-[18px]" strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {sheet && <MoreSheet player={player} onClose={() => setSheet(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {fullscreen && hasSubs && (
          <FullscreenLyrics player={player} onClose={() => setFullscreen(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {quote && current && <QuoteCard player={player} onClose={() => setQuote(false)} />}
      </AnimatePresence>
    </div>
  );
}

function UtilBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className="pressable grid h-10 w-10 place-items-center rounded-full"
      style={{
        color: active ? "var(--accent)" : "var(--text-dim)",
        background: active ? "var(--panel-strong)" : "transparent",
      }}
    >
      {children}
    </button>
  );
}
