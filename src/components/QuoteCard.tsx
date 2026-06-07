import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Download, Share2 } from "lucide-react";
import type { PlayerState } from "../hooks/usePlayer";
import { parseVtt, activeCueIndex } from "../lib/vtt";
import { asset } from "../lib/format";

export function QuoteCard({ player, onClose }: { player: PlayerState; onClose: () => void }) {
  const { current } = player;
  const [line, setLine] = useState("");
  const [url, setUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frozen = useRef(player.currentTime);

  // resolve the active lyric line at the moment the card was opened
  useEffect(() => {
    if (!current?.subtitles) return;
    let alive = true;
    fetch(asset(current.subtitles))
      .then((r) => (r.ok ? r.text() : ""))
      .then((raw) => {
        if (!alive) return;
        const cues = parseVtt(raw);
        const i = activeCueIndex(cues, frozen.current);
        setLine((cues[i]?.text || cues[0]?.text || current.title).trim());
      })
      .catch(() => setLine(current.title));
    return () => { alive = false; };
  }, [current?.subtitles, current?.title]);

  // draw the card whenever the line is known
  useEffect(() => {
    if (!line) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const S = 1080;
    canvas.width = S;
    canvas.height = S;

    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#a78bfa";

    // background
    const g = ctx.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, "#0a0a0b");
    g.addColorStop(1, "#04040a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    // accent glow
    const rg = ctx.createRadialGradient(S * 0.5, S * 0.32, 60, S * 0.5, S * 0.32, S * 0.75);
    rg.addColorStop(0, hexA(accent, 0.28));
    rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, S, S);

    // accent bar
    ctx.fillStyle = accent;
    ctx.fillRect(110, 300, 90, 10);

    // quote text (wrapped)
    ctx.fillStyle = "#f5f5f7";
    ctx.font = "800 70px Inter, system-ui, sans-serif";
    ctx.textBaseline = "top";
    const lines = wrap(ctx, `«${line}»`, S - 220);
    let y = 360;
    for (const ln of lines.slice(0, 6)) {
      ctx.fillText(ln, 110, y);
      y += 92;
    }

    // track label
    ctx.fillStyle = accent;
    ctx.font = "700 36px Inter, system-ui, sans-serif";
    ctx.fillText((current?.artist || "").toUpperCase(), 110, S - 230);
    ctx.fillStyle = "rgba(245,245,247,0.7)";
    ctx.font = "500 32px Inter, system-ui, sans-serif";
    ctx.fillText(current?.title || "", 110, S - 185);

    // app mark
    ctx.fillStyle = "rgba(245,245,247,0.35)";
    ctx.font = "700 26px Inter, system-ui, sans-serif";
    ctx.fillText("VIKTOR · медиа-плеер", 110, S - 90);

    setUrl(canvas.toDataURL("image/png"));
  }, [line, current?.artist, current?.title]);

  const download = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${current?.title || "lyric"}.png`;
    a.click();
  };

  const share = async () => {
    try {
      if (!url) return;
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], "lyric.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: current?.title });
      } else {
        download();
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[60] flex items-center justify-center p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="panel-strong relative z-10 w-full max-w-sm rounded-[28px] p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="heading text-lg">Карточка-цитата</span>
          <button onClick={onClose} className="pressable grid h-9 w-9 place-items-center rounded-full panel" aria-label="close">
            <X className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>
        <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-2xl panel">
          {url ? (
            <img src={url} alt="quote" className="h-full w-full object-cover" />
          ) : (
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent)]" />
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="mt-4 flex gap-2">
          <button onClick={download} className="pressable flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-bold panel" >
            <Download className="h-4 w-4" strokeWidth={2.6} /> Скачать
          </button>
          <button onClick={share} className="pressable flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-bold" style={{ background: "var(--accent)", color: "var(--on-accent)" }}>
            <Share2 className="h-4 w-4" strokeWidth={2.6} /> Поделиться
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxW && cur) {
      out.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function hexA(color: string, a: number): string {
  const c = color.trim();
  if (c.startsWith("#")) {
    const m = c.slice(1);
    if (m.length === 6) {
      const r = parseInt(m.slice(0, 2), 16);
      const g = parseInt(m.slice(2, 4), 16);
      const b = parseInt(m.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${a})`;
    }
  }
  if (c.startsWith("hsl(")) {
    return c.replace(/^hsl\((.*)\)$/, `hsla($1 / ${a})`);
  }
  return `rgba(167,139,250,${a})`;
}
