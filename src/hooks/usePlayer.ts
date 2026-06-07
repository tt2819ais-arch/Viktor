import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RepeatMode, Track } from "../types";
import { asset } from "../lib/format";

export type EqPreset = "flat" | "bass" | "vocal" | "treble" | "lounge";

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
  // --- enhancements ---
  rate: number;
  setRate: (r: number) => void;
  eqPreset: EqPreset;
  setEqPreset: (p: EqPreset) => void;
  abA: number | null;
  abB: number | null;
  setAbA: () => void;
  setAbB: () => void;
  clearAb: () => void;
  sleepRemaining: number | null; // seconds left, or null if off
  setSleepMinutes: (m: number | null) => void;
  crossfade: boolean;
  setCrossfade: (v: boolean) => void;
}

const EQ_PRESETS: Record<EqPreset, [number, number, number]> = {
  flat: [0, 0, 0],
  bass: [6, 0, -1],
  vocal: [-2, 4, 1],
  treble: [-1, 0, 6],
  lounge: [3, -1, 2],
};

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

  // enhancements
  const [rate, setRateState] = useState(1);
  const [eqPreset, setEqPresetState] = useState<EqPreset>(
    () => (localStorage.getItem("viktor.eq") as EqPreset) || "flat"
  );
  const [abA, setAbAState] = useState<number | null>(null);
  const [abB, setAbBState] = useState<number | null>(null);
  const [sleepRemaining, setSleepRemaining] = useState<number | null>(null);
  const sleepUntilRef = useRef<number | null>(null);
  const [crossfade, setCrossfadeState] = useState<boolean>(
    () => localStorage.getItem("viktor.crossfade") === "true"
  );

  // Web Audio graph for the visualizer (created lazily on first play).
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const eqNodesRef = useRef<BiquadFilterNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);

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
      // 3-band EQ
      const low = ctx.createBiquadFilter();
      low.type = "lowshelf";
      low.frequency.value = 120;
      const mid = ctx.createBiquadFilter();
      mid.type = "peaking";
      mid.frequency.value = 1000;
      mid.Q.value = 0.9;
      const high = ctx.createBiquadFilter();
      high.type = "highshelf";
      high.frequency.value = 4000;
      const gain = ctx.createGain();
      gain.gain.value = 1;
      try {
        const src = ctx.createMediaElementSource(el);
        // source -> low -> mid -> high -> analyser -> gain -> destination
        src.connect(low);
        low.connect(mid);
        mid.connect(high);
        high.connect(analyser);
        analyser.connect(gain);
        gain.connect(ctx.destination);
        sourceRef.current = src;
        eqNodesRef.current = [low, mid, high];
        gainRef.current = gain;
        const [lg, mg, hg] = EQ_PRESETS[eqPreset];
        low.gain.value = lg;
        mid.gain.value = mg;
        high.gain.value = hg;
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

  // --- enhancement setters ---
  const setRate = useCallback((r: number) => {
    const v = Math.min(2, Math.max(0.5, Math.round(r * 100) / 100));
    setRateState(v);
    if (audioRef.current) audioRef.current.playbackRate = v;
  }, []);

  const setEqPreset = useCallback((p: EqPreset) => {
    setEqPresetState(p);
    try { localStorage.setItem("viktor.eq", p); } catch {}
    const [lg, mg, hg] = EQ_PRESETS[p];
    const nodes = eqNodesRef.current;
    if (nodes.length === 3) {
      nodes[0].gain.value = lg;
      nodes[1].gain.value = mg;
      nodes[2].gain.value = hg;
    }
  }, []);

  const setAbA = useCallback(() => setAbAState(audioRef.current?.currentTime ?? 0), []);
  const setAbB = useCallback(() => setAbBState(audioRef.current?.currentTime ?? 0), []);
  const clearAb = useCallback(() => { setAbAState(null); setAbBState(null); }, []);

  const setSleepMinutes = useCallback((m: number | null) => {
    if (m === null) { sleepUntilRef.current = null; setSleepRemaining(null); return; }
    sleepUntilRef.current = Date.now() + m * 60000;
    setSleepRemaining(m * 60);
  }, []);

  const setCrossfade = useCallback((v: boolean) => {
    setCrossfadeState(v);
    try { localStorage.setItem("viktor.crossfade", String(v)); } catch {}
  }, []);

  // keep A/B in refs so the media-event handlers can read them without re-binding
  const abARef = useRef<number | null>(null);
  const abBRef = useRef<number | null>(null);
  useEffect(() => { abARef.current = abA; }, [abA]);
  useEffect(() => { abBRef.current = abB; }, [abB]);

  // resume positions (per track id)
  const posRef = useRef<Record<string, number>>(
    (() => { try { return JSON.parse(localStorage.getItem("viktor.pos") || "{}"); } catch { return {}; } })()
  );
  const savePos = useCallback(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    if (el.currentTime > 5 && el.currentTime < (el.duration || 0) - 5) {
      posRef.current[current.id] = el.currentTime;
    } else {
      delete posRef.current[current.id];
    }
    try { localStorage.setItem("viktor.pos", JSON.stringify(posRef.current)); } catch {}
  }, [current]);

  // sleep timer tick
  useEffect(() => {
    const id = window.setInterval(() => {
      if (sleepUntilRef.current == null) return;
      const rem = Math.max(0, Math.round((sleepUntilRef.current - Date.now()) / 1000));
      setSleepRemaining(rem);
      if (rem <= 0) {
        sleepUntilRef.current = null;
        setSleepRemaining(null);
        audioRef.current?.pause();
        setIsPlaying(false);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // apply playback rate when track changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate, index]);

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

  const pendingRestoreRef = useRef(false);
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    setCurrentTime(0);
    setDuration(0);
    pendingRestoreRef.current = true;
    if (wasPlaying.current) {
      ensureGraph();
      el.play()
        .then(() => {
          setIsPlaying(true);
          // crossfade-in: ramp the master gain up on track change
          if (crossfade && gainRef.current && audioCtxRef.current) {
            const g = gainRef.current.gain;
            const tnow = audioCtxRef.current.currentTime;
            g.cancelScheduledValues(tnow);
            g.setValueAtTime(0.0001, tnow);
            g.linearRampToValueAtTime(1, tnow + 0.7);
          }
        })
        .catch(() => setIsPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current?.src]);

  // Wire up media element events.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => {
      const a = abARef.current, b = abBRef.current;
      if (a != null && b != null && b > a && el.currentTime >= b) el.currentTime = a;
      setCurrentTime(el.currentTime);
      if (Math.floor(el.currentTime) % 5 === 0) savePos();
    };
    const onDur = () => {
      setDuration(el.duration || 0);
      if (pendingRestoreRef.current && current) {
        const saved = posRef.current[current.id];
        if (saved && saved > 5 && saved < (el.duration || 0) - 5) {
          el.currentTime = saved;
        }
        pendingRestoreRef.current = false;
      }
    };
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
    const onPause = () => { setIsPlaying(false); savePos(); };
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
      rate,
      setRate,
      eqPreset,
      setEqPreset,
      abA,
      abB,
      setAbA,
      setAbB,
      clearAb,
      sleepRemaining,
      setSleepMinutes,
      crossfade,
      setCrossfade,
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
      rate,
      setRate,
      eqPreset,
      setEqPreset,
      abA,
      abB,
      setAbA,
      setAbB,
      clearAb,
      sleepRemaining,
      setSleepMinutes,
      crossfade,
      setCrossfade,
    ]
  );
}
