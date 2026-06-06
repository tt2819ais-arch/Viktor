import { motion } from "framer-motion";
import type { Track } from "../types";
import { hashHue, initials } from "../lib/format";

interface Props {
  track: Track | null;
  isPlaying: boolean;
  size?: "lg" | "sm";
}

export function AlbumArt({ track, isPlaying, size = "lg" }: Props) {
  const seed = track ? track.title + track.artist : "viktor";
  const hue = hashHue(seed);
  const dim = size === "lg" ? "h-full w-full" : "h-12 w-12";
  const radius = size === "lg" ? "rounded-[28px]" : "rounded-2xl";

  return (
    <div
      className={`relative ${dim} ${radius} overflow-hidden no-select`}
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(150deg, hsl(${hue} 16% 22%) 0%, hsl(${
            (hue + 40) % 360
          } 14% 10%) 60%, #050505 100%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: `radial-gradient(80% 60% at 30% 20%, hsla(${hue},30%,60%,0.35), transparent 60%)`,
        }}
      />
      {/* rotating sheen while playing */}
      <motion.div
        className="absolute -inset-1/2"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, hsla(${hue},40%,80%,0.10) 60deg, transparent 140deg)`,
        }}
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={{ duration: 14, ease: "linear", repeat: Infinity }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <span
          className={`heading text-[var(--text)] ${
            size === "lg" ? "text-6xl sm:text-7xl" : "text-base"
          } opacity-90 no-select`}
        >
          {track ? initials(track.title, track.artist) : "♪"}
        </span>
      </div>
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
    </div>
  );
}
