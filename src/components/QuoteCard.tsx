import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Download, Share2 } from "lucide-react";
import type { PlayerState } from "../hooks/usePlayer";
import { parseVtt, activeCueIndex } from "../lib/vtt";

const TELEGRAM = "@MaksimXyila";

export function QuoteCard({ player, onClose }: { player: PlayerState; onClose: () => void }) {
  const { current } = player;
  const [line, setLine] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frozen = useRef(player.currentTime);

  // resolve the active lyric line (falls back to the title)
  useEffect(() => {
    if (!current) return;
    if (!current.subtitles) {
      setLine(current.title);
      return;
    }
    let alive = true;
    fetch(current.subtitles)
      .then((r) => (r.ok ? r.text() : ""))
      .then((raw) => {
        if (!alive) return;
        const cues = parseVtt(raw);
        const i = activeCueIndex(cues, frozen.current);
        setLine((cues[i]?.text || cues[0]?.text || current.title).trim());
      })
      .catch(() => alive && setLine(current.title));
    return () => { alive = false; };
  }, [current?.id]);

  // draw the card whenever the line is known
  useEffect(() => {
    if (line == null || !current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let cancelled = false;

    const draw = (cover: HTMLImageElement | null) => {
      if (cancelled) return;
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
      const rg = ctx.createRadialGradient(S * 0.5, S * 0.3, 60, S * 0.5, S * 0.3, S * 0.8);
      rg.addColorStop(0, hexA(accent, 0.26));
      rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, S, S);

      // ── header: cover + track info ──
      const cx = 110, cy = 110, cs = 200;
      if (cover) {
        roundRect(ctx, cx, cy, cs, cs, 28);
        ctx.save();
        ctx.clip();
        ctx.drawImage(cover, cx, cy, cs, cs);
        ctx.restore();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        roundRect(ctx, cx, cy, cs, cs, 28);
        ctx.stroke();
      } else {
        roundRect(ctx, cx, cy, cs, cs, 28);
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.fill();
      }

      const tx = cx + cs + 40;
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = accent;
      ctx.font = "800 38px Inter, system-ui, sans-serif";
      wrapDraw(ctx, (current.artist || "").toUpperCase(), tx, cy + 70, S - tx - 90, 46, 1);
      ctx.fillStyle = "#f5f5f7";
      ctx.font = "700 46px Inter, system-ui, sans-serif";
      wrapDraw(ctx, current.title || "", tx, cy + 128, S - tx - 90, 54, 2);

      // accent divider
      ctx.fillStyle = accent;
      ctx.fillRect(110, 392, 90, 10);

      // ── quote ──
      ctx.fillStyle = "#f5f5f7";
      ctx.font = "800 66px Inter, system-ui, sans-serif";
      ctx.textBaseline = "top";
      const lines = wrap(ctx, `«${line}»`, S - 220);
      let y = 450;
      for (const ln of lines.slice(0, 5)) {
        ctx.fillText(ln, 110, y);
        y += 88;
      }

      // ── footer: telegram + link ──
      const fy = S - 150;
      drawTelegram(ctx, 110, fy, 44, accent);
      ctx.fillStyle = "#f5f5f7";
      ctx.font = "700 36px Inter, system-ui, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText(TELEGRAM, 110 + 60, fy + 22);

      if (current.yandexUrl) {
        ctx.fillStyle = "rgba(245,245,247,0.45)";
        ctx.font = "500 26px Inter, system-ui, sans-serif";
        ctx.textBaseline = "top";
        ctx.fillText(prettyUrl(current.yandexUrl), 110, S - 70);
      }

      setUrl(canvas.toDataURL("image/png"));
    };

    if (current.cover) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => draw(img);
      img.onerror = () => draw(null);
      img.src = current.cover;
    } else {
      draw(null);
    }
    return () => { cancelled = true; };
  }, [line, current?.id]);

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
      const text = `${current?.title || ""}${current?.artist ? " — " + current.artist : ""}\n${current?.yandexUrl || ""}\nTelegram: ${TELEGRAM}`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: current?.title, text });
      } else {
        download();
      }
    } catch {
      /* cancelled */
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
          <span className="heading text-lg">Поделиться</span>
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
          <button onClick={download} className="pressable flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-bold panel">
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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Telegram paper-plane glyph in a filled circle.
function drawTelegram(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const r = size / 2;
  const cx = x + r, cy = y + r;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // plane
  ctx.fillStyle = "#0a0a0b";
  ctx.beginPath();
  const s = size;
  ctx.moveTo(x + s * 0.22, y + s * 0.5);
  ctx.lineTo(x + s * 0.8, y + s * 0.27);
  ctx.lineTo(x + s * 0.68, y + s * 0.75);
  ctx.lineTo(x + s * 0.52, y + s * 0.58);
  ctx.lineTo(x + s * 0.4, y + s * 0.7);
  ctx.lineTo(x + s * 0.4, y + s * 0.55);
  ctx.lineTo(x + s * 0.66, y + s * 0.37);
  ctx.lineTo(x + s * 0.36, y + s * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function prettyUrl(u: string): string {
  return u.replace(/^https?:\/\//, "");
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

// draw wrapped text from a baseline, limited to maxLines
function wrapDraw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines: number) {
  const lines = wrap(ctx, text, maxW).slice(0, maxLines);
  lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lh));
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
  if (c.startsWith("hsl(")) return c.replace(/^hsl\((.*)\)$/, `hsla($1 / ${a})`);
  return `rgba(167,139,250,${a})`;
}
