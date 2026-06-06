import { Moon, Sun, Languages, Film, AudioLines, Info, Check } from "lucide-react";
import type { ReactNode } from "react";
import type { BackgroundVideo } from "../types";
import { useSettings } from "../context/SettingsContext";

export function Settings({ videos }: { videos: BackgroundVideo[] }) {
  const { t, lang, setLang, theme, setTheme, background, setBackground, visualizer, setVisualizer } =
    useSettings();

  return (
    <div className="scroll-area mx-auto h-full w-full max-w-2xl overflow-y-auto px-4 pb-8 pt-2">
      <h2 className="heading mb-5 px-1 text-3xl">{t.settings.title}</h2>

      <Section title={t.settings.appearance}>
        <Row icon={<Moon className="h-[18px] w-[18px]" strokeWidth={2.4} />} label={t.settings.theme}>
          <Segmented
            options={[
              { value: "dark", label: t.settings.themeDark, icon: <Moon className="h-4 w-4" strokeWidth={2.6} /> },
              { value: "light", label: t.settings.themeLight, icon: <Sun className="h-4 w-4" strokeWidth={2.6} /> },
            ]}
            value={theme}
            onChange={(v) => setTheme(v as "dark" | "light")}
          />
        </Row>
        <Row icon={<Languages className="h-[18px] w-[18px]" strokeWidth={2.4} />} label={t.settings.language}>
          <Segmented
            options={[
              { value: "ru", label: "RU" },
              { value: "en", label: "EN" },
            ]}
            value={lang}
            onChange={(v) => setLang(v as "ru" | "en")}
          />
        </Row>
      </Section>

      <Section title={t.settings.background}>
        <Row icon={<Film className="h-[18px] w-[18px]" strokeWidth={2.4} />} label={t.settings.background}>
          <div className="text-faint text-xs">{t.settings.backgroundHint}</div>
        </Row>
        {videos.length === 0 ? (
          <p className="text-faint px-1 pb-1 text-sm">{t.settings.noVideos}</p>
        ) : (
          <div className="flex flex-wrap gap-2 px-1 pb-1">
            <Chip active={background === "auto"} onClick={() => setBackground("auto")}>
              {t.settings.backgroundAuto}
            </Chip>
            <Chip active={background === "off"} onClick={() => setBackground("off")}>
              {t.settings.backgroundNone}
            </Chip>
            {videos.map((v) => (
              <Chip key={v.id} active={background === v.id} onClick={() => setBackground(v.id)}>
                {v.name}
              </Chip>
            ))}
          </div>
        )}
      </Section>

      <Section title={t.settings.playback}>
        <Row icon={<AudioLines className="h-[18px] w-[18px]" strokeWidth={2.4} />} label={t.settings.visualizer}>
          <Toggle on={visualizer} onChange={setVisualizer} labelOn={t.on} labelOff={t.off} />
        </Row>
      </Section>

      <Section title={t.settings.about}>
        <div className="flex items-start gap-3 px-1 py-1">
          <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-dim" strokeWidth={2.4} />
          <p className="text-dim text-sm leading-relaxed">{t.settings.aboutText}</p>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-faint mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.16em]">
        {title}
      </h3>
      <div className="panel flex flex-col gap-1 rounded-3xl p-3">{children}</div>
    </div>
  );
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl px-2 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-dim">{icon}</span>
        <span className="heading text-[15px]">{label}</span>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; icon?: ReactNode }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-full p-1" style={{ background: "var(--panel-strong)" }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="pressable flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold"
            style={{
              background: active ? "var(--accent)" : "transparent",
              color: active ? "var(--on-accent)" : "var(--text-dim)",
            }}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="pressable flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold"
      style={{
        background: active ? "var(--accent)" : "var(--panel-strong)",
        color: active ? "var(--on-accent)" : "var(--text-dim)",
      }}
    >
      {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      {children}
    </button>
  );
}

function Toggle({
  on,
  onChange,
  labelOn,
  labelOff,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  labelOn: string;
  labelOff: string;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative flex h-8 w-[52px] items-center rounded-full px-1 transition-colors"
      style={{ background: on ? "var(--accent)" : "var(--border-strong)" }}
      aria-pressed={on}
      aria-label={on ? labelOn : labelOff}
    >
      <span
        className="h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ease-ios"
        style={{ transform: on ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}
