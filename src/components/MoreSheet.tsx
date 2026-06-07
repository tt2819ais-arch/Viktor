import { motion } from "framer-motion";
import { X, Gauge, SlidersHorizontal, Repeat, Moon, Waves, AudioLines } from "lucide-react";
import type { ReactNode } from "react";
import type { PlayerState, EqPreset } from "../hooks/usePlayer";
import { useSettings, type VizStyle } from "../context/SettingsContext";

const L = {
  ru: {
    title: "Параметры",
    speed: "Скорость",
    eq: "Эквалайзер",
    ab: "A–B повтор",
    setA: "Метка A",
    setB: "Метка B",
    clear: "Сброс",
    sleep: "Таймер сна",
    off: "Выкл",
    min: "мин",
    fade: "Плавный переход",
    viz: "Визуализатор",
    eqNames: { flat: "Ровный", bass: "Бас", vocal: "Вокал", treble: "Верх", lounge: "Лаунж" } as Record<EqPreset, string>,
    vizNames: { bars: "Бары", wave: "Волна", circle: "Круг" } as Record<VizStyle, string>,
  },
  en: {
    title: "Options",
    speed: "Speed",
    eq: "Equalizer",
    ab: "A–B repeat",
    setA: "Mark A",
    setB: "Mark B",
    clear: "Clear",
    sleep: "Sleep timer",
    off: "Off",
    min: "min",
    fade: "Crossfade",
    viz: "Visualizer",
    eqNames: { flat: "Flat", bass: "Bass", vocal: "Vocal", treble: "Treble", lounge: "Lounge" } as Record<EqPreset, string>,
    vizNames: { bars: "Bars", wave: "Wave", circle: "Circle" } as Record<VizStyle, string>,
  },
};

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const SLEEPS = [15, 30, 45, 60];
const EQS: EqPreset[] = ["flat", "bass", "vocal", "treble", "lounge"];
const VIZ: VizStyle[] = ["bars", "wave", "circle"];

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MoreSheet({ player, onClose }: { player: PlayerState; onClose: () => void }) {
  const { lang, vizStyle, setVizStyle } = useSettings();
  const l = L[lang];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
        className="panel-strong safe-bottom relative z-10 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] p-5 lg:mb-6 lg:rounded-[28px]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="heading text-xl">{l.title}</h3>
          <button onClick={onClose} className="pressable grid h-9 w-9 place-items-center rounded-full panel" aria-label="close">
            <X className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        <Block icon={<Gauge className="h-[18px] w-[18px]" />} title={`${l.speed} · ${player.rate}×`}>
          {SPEEDS.map((s) => (
            <Chip key={s} active={player.rate === s} onClick={() => player.setRate(s)}>{s}×</Chip>
          ))}
        </Block>

        <Block icon={<SlidersHorizontal className="h-[18px] w-[18px]" />} title={l.eq}>
          {EQS.map((p) => (
            <Chip key={p} active={player.eqPreset === p} onClick={() => player.setEqPreset(p)}>{l.eqNames[p]}</Chip>
          ))}
        </Block>

        <Block icon={<Repeat className="h-[18px] w-[18px]" />} title={l.ab}>
          <Chip active={player.abA != null} onClick={player.setAbA}>
            {l.setA}{player.abA != null ? ` ${fmt(player.abA)}` : ""}
          </Chip>
          <Chip active={player.abB != null} onClick={player.setAbB}>
            {l.setB}{player.abB != null ? ` ${fmt(player.abB)}` : ""}
          </Chip>
          {(player.abA != null || player.abB != null) && (
            <Chip active={false} onClick={player.clearAb}>{l.clear}</Chip>
          )}
        </Block>

        <Block icon={<Moon className="h-[18px] w-[18px]" />} title={l.sleep + (player.sleepRemaining != null ? ` · ${fmt(player.sleepRemaining)}` : "")}>
          <Chip active={player.sleepRemaining == null} onClick={() => player.setSleepMinutes(null)}>{l.off}</Chip>
          {SLEEPS.map((m) => (
            <Chip key={m} active={false} onClick={() => player.setSleepMinutes(m)}>{m} {l.min}</Chip>
          ))}
        </Block>

        <Block icon={<Waves className="h-[18px] w-[18px]" />} title={l.fade}>
          <Chip active={player.crossfade} onClick={() => player.setCrossfade(!player.crossfade)}>
            {player.crossfade ? "ON" : "OFF"}
          </Chip>
        </Block>

        <Block icon={<AudioLines className="h-[18px] w-[18px]" />} title={l.viz}>
          {VIZ.map((v) => (
            <Chip key={v} active={vizStyle === v} onClick={() => setVizStyle(v)}>{l.vizNames[v]}</Chip>
          ))}
        </Block>
      </motion.div>
    </motion.div>
  );
}

function Block({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-dim">{icon}</span>
        <span className="heading text-[14px]">{title}</span>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="pressable rounded-full px-3.5 py-2 text-[13px] font-bold"
      style={{
        background: active ? "var(--accent)" : "var(--panel-strong)",
        color: active ? "var(--on-accent)" : "var(--text-dim)",
      }}
    >
      {children}
    </button>
  );
}
