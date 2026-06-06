import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { BackgroundVideo } from "../types";
import { useSettings } from "../context/SettingsContext";
import { asset } from "../lib/format";

const CYCLE_MS = 18000;

export function BackgroundLayer({ videos }: { videos: BackgroundVideo[] }) {
  const { background, theme } = useSettings();
  const [autoIndex, setAutoIndex] = useState(0);
  const timer = useRef<number | null>(null);

  // Resolve which video to show based on the setting.
  const active: BackgroundVideo | null = useMemo(() => {
    if (background === "off" || videos.length === 0) return null;
    if (background === "auto") return videos[autoIndex % videos.length];
    return videos.find((v) => v.id === background) ?? videos[0];
  }, [background, videos, autoIndex]);

  // Auto-cycle between backgrounds.
  useEffect(() => {
    if (background !== "auto" || videos.length <= 1) return;
    timer.current = window.setInterval(() => {
      setAutoIndex((i) => (i + 1) % videos.length);
    }, CYCLE_MS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [background, videos.length]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[var(--bg)]">
      <AnimatePresence mode="popLayout">
        {active && (
          <motion.video
            key={active.id}
            className="absolute inset-0 h-full w-full object-cover"
            src={asset(active.src)}
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: [0.32, 0.72, 0, 1] }}
          />
        )}
      </AnimatePresence>

      {/* Readability scrim + subtle vignette. Adapts to theme. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            theme === "dark"
              ? "radial-gradient(120% 120% at 50% 0%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.72) 55%, rgba(0,0,0,0.92) 100%)"
              : "radial-gradient(120% 120% at 50% 0%, rgba(244,244,245,0.55) 0%, rgba(244,244,245,0.82) 55%, rgba(244,244,245,0.95) 100%)",
        }}
      />
      {/* Fine grain to avoid flat banding */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
