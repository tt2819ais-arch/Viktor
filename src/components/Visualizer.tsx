import { useEffect, useRef } from "react";

interface Props {
  getAnalyser: () => AnalyserNode | null;
  isPlaying: boolean;
  bars?: number;
  className?: string;
}

// Lightweight canvas bar visualizer driven by the shared AnalyserNode.
export function Visualizer({ getAnalyser, isPlaying, bars = 48, className }: Props) {
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
      ctx.clearRect(0, 0, w, h);

      const accent = getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim() || "#f5f5f7";

      const data = new Uint8Array(analyser ? analyser.frequencyBinCount : bars);
      if (analyser && isPlaying) analyser.getByteFrequencyData(data);

      const gap = 3;
      const barW = (w - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        const srcIdx = Math.floor((i / bars) * data.length);
        const raw = analyser && isPlaying ? data[srcIdx] / 255 : 0;
        // idle shimmer so it never looks dead
        const idle = isPlaying ? 0 : 0.06 + 0.04 * Math.sin(Date.now() / 600 + i);
        const target = Math.max(raw * raw, idle);
        smooth.current[i] += (target - smooth.current[i]) * 0.28;
        const bh = Math.max(2, smooth.current[i] * h);
        const x = i * (barW + gap);
        const y = (h - bh) / 2;
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.25 + 0.65 * smooth.current[i];
        const r = Math.min(barW / 2, 3);
        roundRect(ctx, x, y, barW, bh, r);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [getAnalyser, isPlaying, bars]);

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
