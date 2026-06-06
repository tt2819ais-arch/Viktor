import { useCallback, useRef, useState } from "react";
import { formatTime } from "../lib/format";

interface Props {
  currentTime: number;
  duration: number;
  onSeek: (t: number) => void;
}

export function SeekBar({ currentTime, duration, onSeek }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hoverPct, setHoverPct] = useState<number | null>(null);

  const pct = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const shownPct = dragging && hoverPct !== null ? hoverPct : pct;

  const pctFromEvent = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }, []);

  const handleDown = (clientX: number) => {
    setDragging(true);
    const p = pctFromEvent(clientX);
    setHoverPct(p);
  };
  const handleMove = (clientX: number) => {
    if (!dragging) return;
    setHoverPct(pctFromEvent(clientX));
  };
  const handleUp = () => {
    if (dragging && hoverPct !== null && duration > 0) {
      onSeek(hoverPct * duration);
    }
    setDragging(false);
    setHoverPct(null);
  };

  return (
    <div className="w-full no-select">
      <div
        ref={trackRef}
        className="group relative flex h-6 cursor-pointer items-center"
        onMouseDown={(e) => handleDown(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onTouchStart={(e) => handleDown(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleUp}
      >
        <div className="relative h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--border-strong)" }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${shownPct * 100}%`,
              background: "var(--accent)",
              transition: dragging ? "none" : "width 0.12s linear",
            }}
          />
        </div>
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            left: `${shownPct * 100}%`,
            background: "var(--accent)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            opacity: dragging ? 1 : undefined,
          }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-faint">
        <span>{formatTime(dragging && hoverPct !== null ? hoverPct * duration : currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
