export interface Track {
  id: string;
  src: string;
  file: string;
  title: string;
  artist: string;
  subtitles: string | null;
  cover?: string | null;
  album?: string;
  albumId?: number | string | null;
  yandexUrl?: string;
  duration?: number;
}

export interface BackgroundVideo {
  id: string;
  src: string;
  name: string;
}

export interface Manifest {
  generatedAt: string;
  tracks: Track[];
  videos: BackgroundVideo[];
}

export interface Cue {
  start: number;
  end: number;
  text: string;
}

export type Lang = "ru" | "en";
export type Theme = "dark" | "light";
export type RepeatMode = "off" | "all" | "one";
export type TabId = "player" | "library" | "search" | "settings";
