import type { Cue } from "../types";

// Minimal WebVTT / SRT-ish parser. Supports timestamps in the forms
// HH:MM:SS.mmm, MM:SS.mmm and the SRT comma variant.
function parseTimestamp(ts: string): number {
  const clean = ts.trim().replace(",", ".");
  const parts = clean.split(":").map((p) => parseFloat(p));
  if (parts.some((n) => isNaN(n))) return NaN;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return NaN;
}

const TIMING = /(\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?\s*-->\s*(\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?/;

export function parseVtt(raw: string): Cue[] {
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = text.split(/\n\n+/);
  const cues: Cue[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) continue;
    if (/^WEBVTT/i.test(lines[0])) continue;

    let timingLineIndex = lines.findIndex((l) => TIMING.test(l));
    if (timingLineIndex === -1) continue;

    const timingLine = lines[timingLineIndex];
    const [startStr, rest] = timingLine.split("-->");
    if (!rest) continue;
    const endStr = rest.trim().split(/\s+/)[0];
    const start = parseTimestamp(startStr);
    const end = parseTimestamp(endStr);
    if (isNaN(start) || isNaN(end)) continue;

    const textLines = lines.slice(timingLineIndex + 1);
    const cueText = textLines
      .join("\n")
      .replace(/<[^>]+>/g, "") // strip inline tags
      .trim();
    if (!cueText) continue;

    cues.push({ start, end, text: cueText });
  }

  return cues.sort((a, b) => a.start - b.start);
}

export function activeCueIndex(cues: Cue[], time: number): number {
  // exact match within a cue window
  for (let i = 0; i < cues.length; i++) {
    if (time >= cues[i].start && time < cues[i].end) return i;
  }
  // otherwise highlight the most recent passed cue (karaoke feel)
  let last = -1;
  for (let i = 0; i < cues.length; i++) {
    if (time >= cues[i].start) last = i;
    else break;
  }
  return last;
}
