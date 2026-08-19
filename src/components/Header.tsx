import { useEffect, useRef, useState } from "react";
import {
  useAppDispatch,
  useAppSelector,
  pushToast,
  initializeDashboard,
  resetDemo,
} from "../redux/store";
import { cx } from "../utils/format";
import { Icon } from "./icons";

export const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "analytics", label: "Analytics", icon: "chartPulse" },
  { id: "transactions", label: "Transactions", icon: "listIcon" },
  { id: "goals", label: "Goals", icon: "target" },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 shadow-sm">
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M9 7v18h14"
            stroke="#F8FAFB"
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="23" cy="10.5" r="2.6" fill="#F5A623" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[17px] font-extrabold tracking-tight text-ink">
            Ledgerline
          </span>
          <span className="mt-0.5 block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-soft">
            Finance OS
          </span>
        </span>
      )}
    </span>
  );
}

export function Header({
  active,
  onNavigate,
  onAdd,
  synced,
}: {
  active: string;
  onNavigate: (id: string) => void;
  onAdd: () => void;
  synced: boolean;
}) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const txState = useAppSelector((s) => s.transactions);
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const exportJson = () => {
    const txs = txState.allIds
      .map((id) => txState.byId[id])
      .filter(Boolean);
    const blob = new Blob([JSON.stringify(txs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ledgerline-transactions.json";
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
    dispatch(
      pushToast({ kind: "success", message: `Exported ${txs.length} transactions as JSON.` }),
    );
  };

  const handleReset = async () => {
    setMenuOpen(false);
    setResetting(true);
    await dispatch(resetDemo());
    await dispatch(initializeDashboard());
    setResetting(false);
    dispatch(
      pushToast({ kind: "info", message: "Demo data reset to its original state." }),
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      {/* signature ledger rule */}
      <div className="relative h-[3px] bg-brand-600">
        <div className="absolute right-0 top-0 h-full w-24 bg-gold-500" />
        <div className="absolute right-24 top-0 h-full w-3 bg-brand-900" />
      </div>

      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Primary" className="ml-8 hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active === item.id ? "true" : undefined}
              className={cx(
                "relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
                active === item.id
                  ? "text-brand-700"
                  : "text-soft hover:bg-canvas hover:text-ink",
              )}
            >
              {item.label}
              <span
                className={cx(
                  "absolute inset-x-3 -bottom-[13px] h-[3px] rounded-t-full bg-brand-600 transition-all duration-300",
                  active === item.id ? "opacity-100" : "scale-x-0 opacity-0",
                )}
              />
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5 sm:gap-3">
          <span
            className="hidden items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1.5 font-mono text-[11px] font-medium text-soft md:inline-flex"
            aria-live="polite"
          >
            <span
              className={cx("h-2 w-2 rounded-full", synced ? "bg-gain" : "bg-gold-500")}
              style={
                synced
                  ? { animation: "pulse-dot 2.2s ease-out infinite" }
                  : undefined
              }
            />
            {synced ? "Synced" : "Syncing…"}
          </span>

          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
          >
            <Icon name="plus" className="h-4 w-4" strokeWidth={2.4} />
            <span className="hidden sm:inline">Add</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white ring-2 ring-transparent transition hover:ring-brand-200"
            >
              {user.initials}
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
                style={{ animation: "menu-pop 0.18s ease-out both" }}
              >
                <div className="border-b border-line bg-canvas px-4 py-3">
                  <p className="text-sm font-bold text-ink">{user.name}</p>
                  <p className="mt-0.5 truncate font-mono text-xs text-soft">{user.email}</p>
                </div>
                <div className="p-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={exportJson}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-canvas"
                  >
                    <Icon name="download" className="h-4 w-4 text-soft" />
                    Export data (JSON)
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleReset}
                    disabled={resetting}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-canvas disabled:opacity-50"
                  >
                    <Icon
                      name="refresh"
                      className={cx("h-4 w-4 text-soft", resetting && "animate-spin")}
                    />
                    {resetting ? "Resetting…" : "Reset demo data"}
                  </button>
                </div>
                <p className="border-t border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-soft">
                  Demo build · data stored locally
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
