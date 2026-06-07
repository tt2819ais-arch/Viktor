import { useEffect, useRef } from "react";

export type VizVariant = "bars" | "wave" | "circle";

interface Props {
  getAnalyser: () => AnalyserNode | null;
  isPlaying: boolean;
  bars?: number;
  variant?: VizVariant;
  className?: string;
}

// Lightweight canvas visualizer driven by the shared AnalyserNode.
export function Visualizer({ getAnalyser, isPlaying, bars = 48, variant = "bars", className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  const smooth = useRef<number[]>(new Array(bars).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const analyser = getAnalyser();
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Canvas can be hidden (display:none) or not yet laid out → 0×0.
      // Drawing with non-positive sizes yields negative radii and throws,
      // so skip this frame but keep the loop alive.
      if (w <= 0 || h <= 0) {
        raf.current = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      const accent = getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim() || "#f5f5f7";

      const data = new Uint8Array(analyser ? analyser.frequencyBinCount : bars);
      if (analyser && isPlaying) analyser.getByteFrequencyData(data);

      // shared smoothing
      const val = (i: number) => {
        const srcIdx = Math.floor((i / bars) * data.length);
        const raw = analyser && isPlaying ? data[srcIdx] / 255 : 0;
        const idle = isPlaying ? 0 : 0.06 + 0.04 * Math.sin(Date.now() / 600 + i);
        const target = Math.max(raw * raw, idle);
        smooth.current[i] += (target - smooth.current[i]) * 0.28;
        return smooth.current[i];
      };
      ctx.fillStyle = accent;
      ctx.strokeStyle = accent;

      if (variant === "wave") {
        ctx.globalAlpha = 0.95;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";
        ctx.beginPath();
        for (let i = 0; i < bars; i++) {
          const v = val(i);
          const x = (i / (bars - 1)) * w;
          const y = h / 2 - (v - 0.15) * h * 0.9;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        // mirror glow
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        for (let i = 0; i < bars; i++) {
          const v = val(i);
          const x = (i / (bars - 1)) * w;
          const y = h / 2 + (v - 0.15) * h * 0.9;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else if (variant === "circle") {
        const cx = w / 2;
        const cy = h / 2;
        const base = Math.min(w, h) * 0.22;
        const n = bars;
        for (let i = 0; i < n; i++) {
          const v = val(i);
          const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
          const len = base + v * Math.min(w, h) * 0.32;
          const x1 = cx + Math.cos(ang) * base;
          const y1 = cy + Math.sin(ang) * base;
          const x2 = cx + Math.cos(ang) * len;
          const y2 = cy + Math.sin(ang) * len;
          ctx.globalAlpha = 0.3 + 0.6 * v;
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, base, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const gap = 3;
        const barW = Math.max(1, (w - gap * (bars - 1)) / bars);
        for (let i = 0; i < bars; i++) {
          const v = val(i);
          const bh = Math.max(2, v * h);
          const x = i * (barW + gap);
          const y = (h - bh) / 2;
          ctx.globalAlpha = 0.25 + 0.65 * v;
          const r = Math.max(0, Math.min(barW / 2, 3));
          roundRect(ctx, x, y, barW, bh, r);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [getAnalyser, isPlaying, bars, variant]);

  return <canvas ref={canvasRef} className={className} />;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
