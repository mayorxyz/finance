import { useEffect, useRef } from "react";
import {
  useAppDispatch,
  useAppSelector,
  setSidebar,
  selectMonthTotals,
} from "../redux/store";
import { cx, fmtCurrencyWhole } from "../utils/format";
import { Icon } from "./icons";
import { Logo, NAV_ITEMS } from "./Header";

function BudgetMeter() {
  const categories = useAppSelector((s) => s.categories);
  const { spending } = useAppSelector(selectMonthTotals);
  const budget = categories.allIds.reduce(
    (sum, id) => sum + (categories.byId[id]?.monthlyBudget ?? 0),
    0,
  );
  if (!budget) return null;
  const pct = Math.min(100, Math.round((spending / budget) * 100));
  const warn = pct > 85;

  return (
    <div className="mx-4 rounded-xl border border-line bg-canvas p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-soft">
          Monthly budget
        </p>
        <Icon name="wallet" className="h-4 w-4 text-brand-600" />
      </div>
      <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-ink">
        {fmtCurrencyWhole(spending)}
        <span className="text-xs font-medium text-soft"> / {fmtCurrencyWhole(budget)}</span>
      </p>
      <div
        className="mt-2.5 h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Monthly budget used"
      >
        <div
          className={cx(
            "h-full rounded-full transition-all duration-700 ease-out",
            warn ? "bg-gold-500" : "bg-brand-600",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={cx("mt-2 font-mono text-[11px] font-medium", warn ? "text-gold-700" : "text-soft")}>
        {pct}% used{warn ? " — pacing high" : " — on track"}
      </p>
    </div>
  );
}

export function Sidebar({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate: (id: string) => void;
}) {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.sidebarOpen);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch(setSidebar(false));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, dispatch]);

  const nav = (id: string) => {
    onNavigate(id);
    dispatch(setSidebar(false));
  };

  const inner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-4 pt-5 lg:hidden">
        <Logo />
        <button
          ref={closeRef}
          type="button"
          aria-label="Close menu"
          onClick={() => dispatch(setSidebar(false))}
          className="rounded-lg p-2 text-soft transition hover:bg-canvas hover:text-ink"
        >
          <Icon name="close" className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <nav aria-label="Sections" className="flex-1 overflow-y-auto px-3 pt-4 lg:pt-6">
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

      <div className="space-y-4 pb-5">
        <BudgetMeter />
        <p className="px-5 font-mono text-[10px] leading-relaxed text-soft">
          v2.4.1 · demo dataset
          <br />
          persisted in localStorage
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed rail */}
      <aside
        aria-label="Sidebar"
        className="fixed bottom-0 left-0 top-[67px] z-30 hidden w-[200px] border-r border-line bg-surface lg:block"
      >
        {inner}
      </aside>

      {/* Mobile / tablet drawer */}
      <div
        className={cx(
          "fixed inset-0 z-40 bg-ink/50 transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
        onClick={() => dispatch(setSidebar(false))}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cx(
          "fixed bottom-0 left-0 top-0 z-50 w-[248px] border-r border-line bg-surface shadow-lg transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
      >
        {inner}
      </aside>
    </>
  );
}
