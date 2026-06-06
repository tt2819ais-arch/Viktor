// Scans public/music, public/video and public/subtitles and writes
// public/manifest.json. Run automatically by Vite (see vite.config.ts) and in CI.
//
// How matching works:
//   public/music/Artist - Title.mp3   -> a track
//   public/subtitles/Artist - Title.vtt -> lyrics/subtitles for that track
//     (matched by identical base filename)
//   public/video/*.mp4 (webm/ogv)      -> looping background videos
//
// Maintainers only need to drop files into those folders; nothing else.

import { readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");

const AUDIO_EXT = new Set([".mp3", ".m4a", ".aac", ".ogg", ".oga", ".wav", ".flac", ".opus", ".weba"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".ogv", ".mov", ".m4v"]);
const SUB_EXT = new Set([".vtt"]);

function listFiles(dir, allowed) {
  const full = join(publicDir, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => !f.startsWith("."))
    .filter((f) => {
      try {
        return statSync(join(full, f)).isFile() && allowed.has(extname(f).toLowerCase());
      } catch {
        return false;
      }
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

// Pretty-ish title from a filename: strip extension, leading track numbers.
function titleFromFile(file) {
  const name = basename(file, extname(file));
  return name.replace(/^\s*\d{1,3}[\s._-]+/, "").trim() || name;
}

// "Artist - Title" splitting (optional, used for nicer display).
function splitArtistTitle(file) {
  const t = titleFromFile(file);
  const m = t.match(/^(.*?)\s+[-–—]\s+(.*)$/);
  if (m) return { artist: m[1].trim(), title: m[2].trim() };
  return { artist: "", title: t };
}

const subFiles = listFiles("subtitles", SUB_EXT);
const subByBase = new Map();
for (const s of subFiles) subByBase.set(basename(s, extname(s)).toLowerCase(), s);

const tracks = listFiles("music", AUDIO_EXT).map((file, i) => {
  const base = basename(file, extname(file)).toLowerCase();
  const { artist, title } = splitArtistTitle(file);
  const sub = subByBase.get(base);
  return {
    id: `track-${i}`,
    src: `music/${file}`,
    file,
    title,
    artist,
    subtitles: sub ? `subtitles/${sub}` : null,
  };
});

const videos = listFiles("video", VIDEO_EXT).map((file, i) => ({
  id: `bg-${i}`,
  src: `video/${file}`,
  name: titleFromFile(file),
}));

const manifest = {
  generatedAt: new Date().toISOString(),
  tracks,
  videos,
};

if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
writeFileSync(join(publicDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

console.log(
  `[manifest] ${tracks.length} track(s), ${videos.length} background video(s), ` +
    `${tracks.filter((t) => t.subtitles).length} with subtitles`
);
