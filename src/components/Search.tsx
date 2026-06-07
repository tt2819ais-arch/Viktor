import { useEffect, useRef, useState } from "react";
import { Search as SearchIcon, X, History } from "lucide-react";
import type { Track } from "../types";
import type { PlayerState } from "../hooks/usePlayer";
import { useSettings } from "../context/SettingsContext";
import { search as apiSearch, getRecent } from "../lib/api";
import { TrackRow } from "./Library";

type Mode = "search" | "recent";

export function Search({ player }: { player: PlayerState }) {
  const { t } = useSettings();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [recent, setRecent] = useState<Track[]>([]);
  const [mode, setMode] = useState<Mode>("search");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const reqId = useRef(0);

  // debounced live search
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setBusy(false);
      return;
    }
    setBusy(true);
    const id = ++reqId.current;
    const tmr = setTimeout(() => {
      apiSearch(q)
        .then((list) => { if (id === reqId.current) setResults(list); })
        .catch(() => { if (id === reqId.current) setResults([]); })
        .finally(() => { if (id === reqId.current) setBusy(false); });
    }, 380);
    return () => clearTimeout(tmr);
  }, [query]);

  const loadRecent = () => {
    setMode("recent");
    if (recent.length) return;
    setBusy(true);
    getRecent()
      .then(setRecent)
      .catch(() => setRecent([]))
      .finally(() => setBusy(false));
  };

  const list = mode === "recent" ? recent : results;

  return (
    <div className="scroll-area mx-auto h-full w-full max-w-3xl overflow-y-auto px-4 pb-6 pt-2">
      <div className="mb-4 flex items-baseline justify-between px-1">
        <h2 className="heading text-3xl">{t.tabs.search}</h2>
      </div>

      {/* search box */}
      <div className="mb-3 px-1">
        <div className="relative">
          <SearchIcon className="text-faint pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" strokeWidth={2.4} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setMode("search"); }}
            placeholder={t.search.placeholder}
            className="w-full rounded-full py-2.5 pl-10 pr-9 text-[14px] outline-none"
            style={{ background: "var(--panel-strong)", color: "var(--text)" }}
          />
          {query && (
            <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-dim" aria-label="clear">
              <X className="h-4 w-4" strokeWidth={2.6} />
            </button>
          )}
        </div>
      </div>

      {/* recently played toggle */}
      <div className="mb-3 px-1">
        <button
          onClick={loadRecent}
          className="pressable inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold"
          style={{
            background: mode === "recent" ? "var(--accent)" : "var(--panel-strong)",
            color: mode === "recent" ? "var(--on-accent)" : "var(--text-dim)",
          }}
        >
          <History className="h-4 w-4" strokeWidth={2.5} />
          {t.search.recent}
        </button>
      </div>

      {busy && (
        <div className="grid place-items-center py-10">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent)]" />
        </div>
      )}

      {!busy && list.length === 0 && (
        <p className="text-faint px-1 py-10 text-center text-sm">
          {mode === "recent" ? t.search.noRecent : query.trim() ? t.search.nothing : t.search.hint}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {list.map((track, i) => (
          <TrackRow
            key={track.id + "-" + i}
            track={track}
            player={player}
            onPlay={() => {
              if (player.current?.id === track.id) player.toggle();
              else player.setQueue(list, i, true);
            }}
            delay={Math.min(i * 0.02, 0.3)}
          />
        ))}
      </div>
    </div>
  );
}
