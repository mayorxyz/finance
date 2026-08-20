import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAppDispatch,
  useAppSelector,
  pushToast,
  initializeDashboard,
  resetDemo,
} from "../redux/store";
import { cx } from "../utils/format";
import { Icon } from "./icons";
import { Logo, NAV_ITEMS } from "./Header";

export function Sidebar({ 
  active, 
  onAdd, 
  synced 
}: { 
  active: string; 
  onAdd: () => void; 
  synced: boolean; 
}) {
  const dispatch = useAppDispatch();
  const routerNavigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const txState = useAppSelector((s) => s.transactions);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside or pressing Escape
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

  const nav = (id: string) => {
    const item = NAV_ITEMS.find((i) => i.id === id);
    if (item) routerNavigate(item.path);
  };

  return (
    <aside
      aria-label="Sidebar"
      className="fixed bottom-0 left-0 top-0 z-30 hidden w-[200px] border-r border-line bg-surface lg:flex lg:flex-col"
    >
      {/* Signature ledger rule at the top */}
      <div className="relative h-[3px] w-full bg-brand-600 flex-shrink-0">
        <div className="absolute right-0 top-0 h-full w-24 bg-gold-500" />
        <div className="absolute right-24 top-0 h-full w-3 bg-brand-900" />
      </div>

      <div className="flex h-full flex-col overflow-hidden">
        {/* Logo: Ledgerline Finance OS */}
        <div className="px-5 pb-4 pt-5 flex-shrink-0">
          <Logo />
        </div>

        {/* Navigation Items */}
        <nav aria-label="Sections" className="flex-1 overflow-y-auto px-3 pt-2">
          <p className="px-3 pb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-soft">
            Workspace
          </p>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => nav(item.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={cx(
                      "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-soft hover:bg-canvas hover:text-ink",
                    )}
                  >
                    <span
                      className={cx(
                        "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600 transition-all duration-300",
                        isActive ? "opacity-100" : "scale-y-0 opacity-0",
                      )}
                    />
                    <Icon
                      name={item.icon}
                      className={cx(
                        "h-[18px] w-[18px] transition-colors",
                        isActive ? "text-brand-600" : "text-soft group-hover:text-ink",
                      )}
                    />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Actions: Sync, Add, Profile */}
        <div className="mt-auto border-t border-line p-3 space-y-2.5 flex-shrink-0">

          {/* Add Button */}
          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
          >
            <Icon name="plus" className="h-4 w-4" strokeWidth={2.4} />
            <span>Add</span>
          </button>

          {/* User Profile Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
              className="flex w-full items-center gap-2 rounded-lg p-1.5 transition hover:bg-canvas"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-900 text-[11px] font-bold text-white flex-shrink-0">
                {user.initials}
              </span>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-bold text-ink truncate leading-tight">{user.name}</p>
                <p className="text-[10px] text-soft truncate leading-tight">{user.email}</p>
              </div>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-line bg-surface shadow-lg z-50"
                style={{ animation: "menu-pop 0.18s ease-out both" }}
              >
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
    </aside>
  );
}