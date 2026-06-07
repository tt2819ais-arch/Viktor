import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Lang, Theme } from "../types";
import type { AccentKey } from "../lib/accent";
import { dict, type Dict } from "../i18n";

type BackgroundMode = "auto" | "off" | string; // "auto" | "off" | video id
export type VizStyle = "bars" | "wave" | "circle";

interface SettingsValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  background: BackgroundMode;
  setBackground: (b: BackgroundMode) => void;
  visualizer: boolean;
  setVisualizer: (v: boolean) => void;
  accent: AccentKey;
  setAccent: (a: AccentKey) => void;
  autoAccent: boolean;
  setAutoAccent: (v: boolean) => void;
  vizStyle: VizStyle;
  setVizStyle: (v: VizStyle) => void;
  bgReactive: boolean;
  setBgReactive: (v: boolean) => void;
  t: Dict;
}

const SettingsContext = createContext<SettingsValue | null>(null);

function read<T extends string>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return (v as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === "true";
  } catch {
    return fallback;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => read<Lang>("viktor.lang", "ru"));
  const [theme, setThemeState] = useState<Theme>(() => read<Theme>("viktor.theme", "dark"));
  const [background, setBackgroundState] = useState<BackgroundMode>(() =>
    read<string>("viktor.bg", "auto")
  );
  const [visualizer, setVisualizerState] = useState<boolean>(() =>
    readBool("viktor.visualizer", true)
  );
  const [accent, setAccentState] = useState<AccentKey>(() => read<AccentKey>("viktor.accent", "violet"));
  const [autoAccent, setAutoAccentState] = useState<boolean>(() => readBool("viktor.autoAccent", false));
  const [vizStyle, setVizStyleState] = useState<VizStyle>(() => read<VizStyle>("viktor.vizStyle", "bars"));
  const [bgReactive, setBgReactiveState] = useState<boolean>(() => readBool("viktor.bgReactive", true));

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    root.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#000000" : "#f4f4f5");
    try {
      localStorage.setItem("viktor.theme", theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    try {
      localStorage.setItem("viktor.lang", lang);
    } catch {}
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem("viktor.bg", background);
    } catch {}
  }, [background]);

  useEffect(() => {
    try {
      localStorage.setItem("viktor.visualizer", String(visualizer));
    } catch {}
  }, [visualizer]);

  useEffect(() => { try { localStorage.setItem("viktor.accent", accent); } catch {} }, [accent]);
  useEffect(() => { try { localStorage.setItem("viktor.autoAccent", String(autoAccent)); } catch {} }, [autoAccent]);
  useEffect(() => { try { localStorage.setItem("viktor.vizStyle", vizStyle); } catch {} }, [vizStyle]);
  useEffect(() => { try { localStorage.setItem("viktor.bgReactive", String(bgReactive)); } catch {} }, [bgReactive]);

  const value = useMemo<SettingsValue>(
    () => ({
      lang,
      setLang: setLangState,
      theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((p) => (p === "dark" ? "light" : "dark")),
      background,
      setBackground: setBackgroundState,
      visualizer,
      setVisualizer: setVisualizerState,
      accent,
      setAccent: setAccentState,
      autoAccent,
      setAutoAccent: setAutoAccentState,
      vizStyle,
      setVizStyle: setVizStyleState,
      bgReactive,
      setBgReactive: setBgReactiveState,
      t: dict[lang],
    }),
    [lang, theme, background, visualizer, accent, autoAccent, vizStyle, bgReactive]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
