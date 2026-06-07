import { motion } from "framer-motion";
import { Disc3, ListMusic, Search, SlidersHorizontal } from "lucide-react";
import type { TabId } from "../types";
import { useSettings } from "../context/SettingsContext";

const TABS: { id: TabId; icon: typeof Disc3 }[] = [
  { id: "player", icon: Disc3 },
  { id: "library", icon: ListMusic },
  { id: "search", icon: Search },
  { id: "settings", icon: SlidersHorizontal },
];

export function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  const { t } = useSettings();

  return (
    <>
      {/* Mobile: bottom bar */}
      <nav className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-3 lg:hidden">
        <div className="panel-strong pointer-events-auto flex items-center gap-1 rounded-full p-1.5 shadow-2xl">
          {TABS.map(({ id, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                className="pressable relative flex items-center gap-2 rounded-full px-4 py-2.5"
                style={{ color: isActive ? "var(--on-accent)" : "var(--text-dim)" }}
              >
                {isActive && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: "var(--accent)" }}
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
                  {isActive && <span className="text-[13px] font-bold">{t.tabs[id]}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop: side rail */}
      <nav className="fixed left-0 top-0 z-30 hidden h-full w-[88px] flex-col items-center justify-center gap-2 lg:flex">
        {TABS.map(({ id, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="pressable relative flex w-[68px] flex-col items-center gap-1.5 rounded-3xl py-3"
              style={{ color: isActive ? "var(--on-accent)" : "var(--text-dim)" }}
            >
              {isActive && (
                <motion.span
                  layoutId="tab-pill-side"
                  className="absolute inset-0 rounded-3xl"
                  style={{ background: "var(--accent)" }}
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <span className="relative z-10 flex flex-col items-center gap-1.5">
                <Icon className="h-[22px] w-[22px]" strokeWidth={2.4} />
                <span className="text-[11px] font-bold">{t.tabs[id]}</span>
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
