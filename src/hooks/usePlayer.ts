import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RepeatMode, Track } from "../types";
import { asset } from "../lib/format";

export interface PlayerState {
  audioRef: React.RefObject<HTMLAudioElement>;
  current: Track | null;
  index: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  selectTrack: (i: number) => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  getAnalyser: () => AnalyserNode | null;
}

export function usePlayer(tracks: Track[]): PlayerState {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");

  // Web Audio graph for the visualizer (created lazily on first play).
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const current = tracks[index] ?? null;

  const ensureGraph = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.82;
      try {
        const src = ctx.createMediaElementSource(el);
        src.connect(analyser);
        analyser.connect(ctx.destination);
        sourceRef.current = src;
      } catch {
        // a source can only be created once per element; ignore on re-entry
      }
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    }
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, []);

  const play = useCallback(() => {
    const el = audioRef.current;
    if (!el || tracks.length === 0) return;
    ensureGraph();
    el.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [ensureGraph, tracks.length]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const pickNext = useCallback(
    (dir: 1 | -1) => {
      if (tracks.length === 0) return 0;
      if (shuffle && tracks.length > 1) {
        let n = index;
        while (n === index) n = Math.floor(Math.random() * tracks.length);
        return n;
      }
      return (index + dir + tracks.length) % tracks.length;
    },
    [index, shuffle, tracks.length]
  );

  const next = useCallback(() => {
    setIndex(pickNext(1));
  }, [pickNext]);

  const prev = useCallback(() => {
    const el = audioRef.current;
    if (el && el.currentTime > 3) {
      el.currentTime = 0;
      return;
    }
    setIndex(pickNext(-1));
  }, [pickNext]);

  const selectTrack = useCallback((i: number) => {
    setIndex(i);
  }, []);

  const seek = useCallback((t: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = t;
    setCurrentTime(t);
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    setVolumeState(clamped);
    if (clamped > 0) setMuted(false);
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
    []
  );

  // Apply volume / mute to the element.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
    el.muted = muted;
  }, [volume, muted, current]);

  // Load + autoplay when the track changes (only if we were already playing).
  const wasPlaying = useRef(false);
  useEffect(() => {
    wasPlaying.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    setCurrentTime(0);
    setDuration(0);
    if (wasPlaying.current) {
      ensureGraph();
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current?.src]);

  // Wire up media element events.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime);
    const onDur = () => setDuration(el.duration || 0);
    const onEnd = () => {
      if (repeat === "one") {
        el.currentTime = 0;
        el.play().catch(() => {});
        return;
      }
      if (index === tracks.length - 1 && repeat === "off" && !shuffle) {
        setIsPlaying(false);
        return;
      }
      setIndex(pickNext(1));
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onDur);
    el.addEventListener("durationchange", onDur);
    el.addEventListener("ended", onEnd);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onDur);
      el.removeEventListener("durationchange", onDur);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, [repeat, shuffle, index, tracks.length, pickNext]);

  // MediaSession (lock screen / headphone controls).
  useEffect(() => {
    if (!("mediaSession" in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist || "Viktor",
      album: "Viktor",
    });
    navigator.mediaSession.setActionHandler("play", play);
    navigator.mediaSession.setActionHandler("pause", pause);
    navigator.mediaSession.setActionHandler("nexttrack", next);
    navigator.mediaSession.setActionHandler("previoustrack", prev);
  }, [current, play, pause, next, prev]);

  const getAnalyser = useCallback(() => analyserRef.current, []);

  const src = current ? asset(current.src) : undefined;

  // expose the <audio> element via the ref; consumer renders it
  useEffect(() => {
    const el = audioRef.current;
    if (el && src && el.getAttribute("data-src") !== src) {
      el.setAttribute("data-src", src);
    }
  }, [src]);

  return useMemo(
    () => ({
      audioRef,
      current,
      index,
      isPlaying,
      currentTime,
      duration,
      volume,
      muted,
      shuffle,
      repeat,
      play,
      pause,
      toggle,
      next,
      prev,
      selectTrack,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      getAnalyser,
    }),
    [
      current,
      index,
      isPlaying,
      currentTime,
      duration,
      volume,
      muted,
      shuffle,
      repeat,
      play,
      pause,
      toggle,
      next,
      prev,
      selectTrack,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      getAnalyser,
    ]
  );
}
