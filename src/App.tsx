import { Suspense, lazy, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  store,
  useAppDispatch,
  useAppSelector,
  initializeDashboard,
  setAddSheet,
} from "./redux/store";
import { prefersReducedMotion } from "./utils/format";
import { Icon } from "./components/icons";
import { Header, NAV_ITEMS } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { MobileTabBar } from "./components/MobileTabBar";
import { QuickAddForm } from "./components/widgets";
import { Skeleton, ToastHost } from "./components/ui";

const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const TransactionsPage = lazy(() => import("./pages/TransactionsPage"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));

function PageFallback() {
  return (
    <div className="space-y-6" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-44" />
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="mt-4 h-7 w-2/3" />
            <Skeleton className="mt-3 h-3 w-1/3" />
          </div>
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
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
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-ink/50"
        aria-hidden="true"
        onClick={() => dispatch(setAddSheet(false))}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface px-5 pb-8 pt-3 shadow-lg sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:px-6 sm:pt-5"
        style={{ animation: "sheet-up 0.32s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden="true" />
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
  const location = useLocation();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    let alive = true;
    dispatch(initializeDashboard()).then(() => {
      if (alive) setSynced(true);
    });
    return () => {
      alive = false;
    };
  }, [dispatch]);

  /* fresh scroll position on every page change */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  const active =
    NAV_ITEMS.find((n) => n.path === location.pathname)?.id ?? "overview";

  const handleAdd = () => {
    const desktop = window.matchMedia("(min-width: 1280px)").matches;
    if (desktop && location.pathname === "/") {
      const el = document.getElementById("quick-add-rail");
      el?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "center",
      });
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
      <div className="lg:hidden">
        <Header onAdd={handleAdd} synced={synced} />
      </div>
      <Sidebar active={active} />

      <div className="lg:pl-[200px]">
        <main className="mx-auto max-w-[1400px] px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>

          <footer className="mt-14 border-t border-line pt-6 text-center">
            <p className="font-mono text-[11px] leading-relaxed text-soft">
              Ledgerline · demo build — synthetic data, persisted in your browser.
              <br className="sm:hidden" /> Nothing leaves this device.
            </p>
          </footer>
        </main>
      </div>

      <MobileTabBar onAdd={handleAdd} />
      <AddSheet />
      <ToastHost />
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <HashRouter>
        <Shell />
      </HashRouter>
    </Provider>
  );
}
