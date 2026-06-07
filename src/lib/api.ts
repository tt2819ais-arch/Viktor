import type { Track } from "../types";

// All endpoints are served from the same origin as the SPA (the local/cloud
// helper). In dev, Vite proxies /api to the Flask server (see vite.config.ts).

interface ApiTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumId?: number | string | null;
  cover?: string | null;
  src: string;
  lyrics?: string | null;
  hasLyrics?: boolean;
  yandexUrl?: string;
  duration?: number;
}

function mapTrack(j: ApiTrack): Track {
  return {
    id: String(j.id),
    src: j.src,
    file: j.title,
    title: j.title,
    artist: j.artist,
    subtitles: j.hasLyrics && j.lyrics ? j.lyrics : null,
    cover: j.cover ?? null,
    album: j.album,
    albumId: j.albumId ?? null,
    yandexUrl: j.yandexUrl,
    duration: j.duration,
  };
}

async function getTracks(url: string): Promise<Track[]> {
  const r = await fetch(url, { cache: "no-cache" });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  const data = await r.json();
  if (!Array.isArray(data)) return [];
  return data.map(mapTrack);
}

export const getLikes = () => getTracks("/api/likes");
export const getRecent = () => getTracks("/api/recent");
export const search = (q: string) =>
  getTracks("/api/search?q=" + encodeURIComponent(q));
