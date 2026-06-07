export type AccentKey = "mono" | "violet" | "aqua" | "lime" | "amber" | "rose";

// [accent, on-accent]
export const ACCENTS: Record<AccentKey, [string, string]> = {
  mono: ["#f5f5f7", "#0a0a0b"],
  violet: ["#a78bfa", "#160f2e"],
  aqua: ["#38bdf8", "#04121a"],
  lime: ["#a3e635", "#10160a"],
  amber: ["#fbbf24", "#1a1304"],
  rose: ["#fb7185", "#1a0810"],
};

export const ACCENT_KEYS = Object.keys(ACCENTS) as AccentKey[];

// Deterministic vivid color from a track id (for "accent per track").
export function colorForTrack(id: string): [string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const accent = `hsl(${hue} 85% 68%)`;
  const onAccent = `hsl(${hue} 60% 10%)`;
  return [accent, onAccent];
}

export function applyAccent(accent: string, onAccent: string) {
  const root = document.documentElement;
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--on-accent", onAccent);
}
