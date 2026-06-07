import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TabId, Track } from "./types";
import { useManifest } from "./hooks/useManifest";
import { usePlayer } from "./hooks/usePlayer";
import { useFavorites } from "./hooks/useFavorites";
import { useSettings } from "./context/SettingsContext";
import { getLikes } from "./lib/api";
import { BackgroundLayer } from "./components/BackgroundLayer";
import { TabBar } from "./components/TabBar";
import { Player } from "./components/Player";
import { Library } from "./components/Library";
import { Search } from "./components/Search";
import { Settings } from "./components/Settings";
import { MiniBar } from "./components/MiniBar";
import { ACCENTS, applyAccent, colorForTrack } from "./lib/accent";

export default function App() {
  const { accent, autoAccent } = useSettings();
  const { manifest } = useManifest(); // background videos only
  const player = usePlayer();
  const fav = useFavorites();
  const [tab, setTab] = useState<TabId>("player");

  const [likes, setLikes] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Load the Yandex "liked" tracks → become the library + initial queue.
  useEffect(() => {
    let alive = true;
    getLikes()
      .then((list) => {
        if (!alive) return;
        setLikes(list);
        if (list.length) player.setQueue(list, 0, false);
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply accent color: per-track when autoAccent, otherwise the chosen palette.
  useEffect(() => {
    if (autoAccent && player.current) {
      const [a, o] = colorForTrack(player.current.id);
      applyAccent(a, o);
    } else {
      const [a, o] = ACCENTS[accent];
      applyAccent(a, o);
    }
  }, [accent, autoAccent, player.current?.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          player.toggle();
          break;
        case "ArrowRight":
          if (e.shiftKey) player.next();
          else player.seek(Math.min(player.duration, player.currentTime + 5));
          break;
        case "ArrowLeft":
          if (e.shiftKey) player.prev();
          else player.seek(Math.max(0, player.currentTime - 5));
          break;
        case "m":
        case "M":
        case "ь":
          player.toggleMute();
          break;
        case "n":
        case "N":
          player.next();
          break;
        case "p":
        case "P":
          player.prev();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [player]);

  const direction = tabIndex(tab);

  return (
    <div className="relative flex h-full w-full flex-col lg:pl-[88px]">
      <BackgroundLayer videos={manifest.videos} getAnalyser={player.getAnalyser} isPlaying={player.isPlaying} />

      {/* shared audio element */}
      <audio ref={player.audioRef} src={player.current ? player.current.src : undefined} preload="metadata" crossOrigin="anonymous" />

      {/* slim safe-area spacer (no app title) */}
      <div className="safe-top pt-2" aria-hidden />

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={tab}
            custom={direction}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0"
          >
            {loading ? (
              <Loading />
            ) : tab === "player" ? (
              <Player player={player} fav={fav} />
            ) : tab === "library" ? (
              <Library tracks={likes} player={player} fav={fav} error={error} />
            ) : tab === "search" ? (
              <Search player={player} />
            ) : (
              <Settings videos={manifest.videos} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mini player shown off the player tab */}
      <AnimatePresence>
        {tab !== "player" && player.current && (
          <MiniBar player={player} onExpand={() => setTab("player")} />
        )}
      </AnimatePresence>

      <TabBar active={tab} onChange={setTab} />

      {/* spacer so content clears the mobile tab bar */}
      <div className="h-20 shrink-0 lg:h-0" aria-hidden />
    </div>
  );
}

function Loading() {
  return (
    <div className="grid h-full place-items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent)]" />
    </div>
  );
}

function tabIndex(t: TabId): number {
  return t === "player" ? 0 : t === "library" ? 1 : t === "search" ? 2 : 3;
}
