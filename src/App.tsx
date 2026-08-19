import { Suspense, lazy, useEffect, useState } from "react";
import { Provider } from "react-redux";
import {
  store,
  useAppDispatch,
  useAppSelector,
  initializeDashboard,
  setAddSheet,
} from "./redux/store";
import { prefersReducedMotion } from "./utils/format";
import { Icon } from "./components/icons";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { BalanceSection } from "./components/BalanceSection";
import { TransactionsSection } from "./components/TransactionsSection";
import { QuickAddForm, GoalsSnapshot, TopCategoriesWidget, WidgetCard } from "./components/widgets";
import { Skeleton, ToastHost } from "./components/ui";

const ChartsSection = lazy(() => import("./components/ChartsSection"));
const GoalsSection = lazy(() => import("./components/GoalsSection"));

function GoalsFallback() {
  return (
    <section aria-label="Goals loading" className="space-y-5">
      <Skeleton className="h-5 w-40" />
      <div className="grid gap-5 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            <Skeleton className="mt-5 h-6 w-2/5" />
            <Skeleton className="mt-3 h-2.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

function ChartsFallback() {
  return (
    <section aria-label="Analytics loading" className="grid gap-5 lg:grid-cols-2 lg:gap-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-2 h-3 w-1/4" />
          <Skeleton className="mt-5 h-[190px] w-full rounded-lg" />
        </div>
      ))}
    </section>
  );
}

function AddSheet() {
  const open = useAppSelector((s) => s.ui.addSheetOpen);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch(setAddSheet(false));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, dispatch]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] sm:hidden">
      <div
        className="absolute inset-0 bg-ink/50"
        aria-hidden="true"
        onClick={() => dispatch(setAddSheet(false))}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface px-5 pb-8 pt-3 shadow-lg"
        style={{ animation: "sheet-up 0.32s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" aria-hidden="true" />
        <div className="mb-4 flex items-center justify-between">
          <h2 id="sheet-title" className="text-lg font-extrabold tracking-tight text-ink">
            Add transaction
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => dispatch(setAddSheet(false))}
            className="rounded-lg p-2 text-soft transition hover:bg-canvas hover:text-ink"
          >
            <Icon name="close" className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <QuickAddForm onDone={() => dispatch(setAddSheet(false))} />
      </div>
    </div>
  );
}

function Shell() {
  const dispatch = useAppDispatch();
  const [synced, setSynced] = useState(false);
  const [active, setActive] = useState("overview");

  useEffect(() => {
    let alive = true;
    dispatch(initializeDashboard()).then(() => {
      if (alive) setSynced(true);
    });
    return () => {
      alive = false;
    };
  }, [dispatch]);

  /* scroll-spy — reads live DOM so lazy/loaded swaps never break it */
  useEffect(() => {
    const ids = ["overview", "analytics", "goals", "transactions"];
    let raf = 0;
    const compute = () => {
      raf = 0;
      const probe = window.innerHeight * 0.38;
      let current = "overview";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        if (rect.top <= probe) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [synced]);

  const navigate = (id: string) => {
    const el = document.getElementById(id) ?? document.getElementById(`${id}-rail`);
    el?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  };

  const handleAdd = () => {
    if (window.matchMedia("(min-width: 1280px)").matches) {
      const el = document.getElementById("quick-add-rail");
      el?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
      if (el) {
        el.classList.remove("flash-once");
        void el.offsetWidth;
        el.classList.add("flash-once");
      }
    } else if (window.matchMedia("(min-width: 768px)").matches) {
      const el = document.getElementById("quick-add-flow");
      el?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
      if (el) {
        el.classList.remove("flash-once");
        void el.offsetWidth;
        el.classList.add("flash-once");
      }
    } else {
      dispatch(setAddSheet(true));
    }
  };

  return (
    <div className="min-h-screen">
      <Header active={active} onNavigate={navigate} onAdd={handleAdd} synced={synced} />
      <Sidebar active={active} onNavigate={navigate} />

      <div className="lg:pl-[200px]">
        <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start xl:gap-6">
            {/* primary column */}
            <div className="min-w-0 space-y-10">
              <BalanceSection />

              {/* mobile primary CTA */}
              <button
                type="button"
                onClick={handleAdd}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-brand-700 active:scale-[0.99] sm:hidden"
              >
                <Icon name="plus" className="h-5 w-5" strokeWidth={2.4} />
                Add transaction
              </button>

              <Suspense fallback={<ChartsFallback />}>
                <ChartsSection />
              </Suspense>

              <Suspense fallback={<GoalsFallback />}>
                <GoalsSection />
              </Suspense>

              <TransactionsSection />

              {/* widgets flow into the main column below xl */}
              <div className="grid gap-5 md:grid-cols-2 xl:hidden">
                <WidgetCard
                  id="quick-add-flow"
                  title="Quick add"
                  caption="Logs straight into your ledger"
                >
                  <QuickAddForm />
                </WidgetCard>
                <div className="space-y-5">
                  <GoalsSnapshot collapsible onViewAll={() => navigate("goals")} />
                  <TopCategoriesWidget />
                </div>
              </div>
            </div>

            {/* right widget rail — desktop */}
            <aside
              aria-label="Widgets"
              className="thin-scroll sticky top-[84px] hidden max-h-[calc(100vh-100px)] space-y-5 overflow-y-auto pb-2 xl:block"
            >
              <WidgetCard id="quick-add-rail" title="Quick add" caption="Logs straight into your ledger">
                <QuickAddForm />
              </WidgetCard>
              <GoalsSnapshot onViewAll={() => navigate("goals")} />
              <TopCategoriesWidget />
            </aside>
          </div>

          <footer className="mt-14 border-t border-line pt-6 text-center">
            <p className="font-mono text-[11px] leading-relaxed text-soft">
              Ledgerline · demo build — synthetic data, persisted in your browser.
              <br className="sm:hidden" /> Nothing leaves this device.
            </p>
          </footer>
        </main>
      </div>

      <AddSheet />
      <ToastHost />
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Shell />
    </Provider>
  );
}
