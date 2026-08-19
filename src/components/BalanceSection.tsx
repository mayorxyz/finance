import { useRef, useState } from "react";
import { format } from "date-fns";
import {
  useAppDispatch,
  useAppSelector,
  selectAccount,
  selectMonthTotals,
} from "../redux/store";
import type { Account } from "../types";
import { cx, fmtCurrency } from "../utils/format";
import { Icon } from "./icons";
import { Reveal, Skeleton, Sparkline, TrendPill, useCountUp } from "./ui";

const TYPE_META: Record<Account["type"], { icon: string; tint: string }> = {
  checking: { icon: "wallet", tint: "bg-brand-50 text-brand-600" },
  savings: { icon: "piggy", tint: "bg-gold-100 text-gold-700" },
  investment: { icon: "trendLine", tint: "bg-canvas text-ink border border-line" },
};

function BalanceCard({
  account,
  selected,
  onSelect,
  delay,
}: {
  account: Account;
  selected: boolean;
  onSelect: () => void;
  delay: number;
}) {
  const display = useCountUp(account.balance);
  const meta = TYPE_META[account.type];
  const up = account.trendPct >= 0;

  return (
    <Reveal delay={delay}>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`${account.name}, balance ${fmtCurrency(account.balance)}. ${
          selected ? "Currently filtering the ledger." : "Select to filter the ledger."
        }`}
        className={cx(
          "group relative w-full rounded-xl border bg-surface p-5 text-left shadow-sm transition-all duration-300",
          selected
            ? "border-brand-600 shadow-md ring-2 ring-brand-600/25"
            : "border-line hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cx(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                meta.tint,
              )}
            >
              <Icon name={meta.icon} className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-ink">{account.name}</span>
              <span className="mt-0.5 block font-mono text-[11px] text-soft">
                {account.institution}
              </span>
            </span>
          </div>
          <span
            className={cx(
              "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide transition-opacity",
              selected
                ? "bg-brand-600 text-white opacity-100"
                : "bg-brand-50 text-brand-700 opacity-0 group-hover:opacity-100",
            )}
          >
            {selected ? "Filtering" : "Tap to filter"}
          </span>
        </div>

        <p className="mt-4 font-mono text-[26px] font-semibold leading-none tabular-nums tracking-tight text-ink">
          {fmtCurrency(display)}
        </p>

        <div className="mt-4 flex items-end justify-between gap-3">
          <span className="flex items-center gap-2">
            <TrendPill pct={account.trendPct} />
            <span className="text-[11px] font-medium text-soft">vs last mo</span>
          </span>
          <Sparkline
            data={account.spark}
            color={up ? "#059669" : "#DC2626"}
            className="h-8 w-24 shrink-0"
          />
        </div>
      </button>
    </Reveal>
  );
}

function CarouselDots({
  count,
  active,
  onDot,
}: {
  count: number;
  active: number;
  onDot: (i: number) => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-center gap-1.5" role="tablist" aria-label="Accounts">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={active === i}
          aria-label={`Account ${i + 1}`}
          onClick={() => onDot(i)}
          className={cx(
            "h-1.5 rounded-full transition-all duration-300",
            active === i ? "w-5 bg-brand-600" : "w-1.5 bg-line hover:bg-brand-200",
          )}
        />
      ))}
    </div>
  );
}

export function BalanceSection() {
  const dispatch = useAppDispatch();
  const accounts = useAppSelector((s) => s.accounts);
  const selectedId = useAppSelector((s) => s.ui.selectedAccountId);
  const user = useAppSelector((s) => s.auth.user);
  const { income, spending } = useAppSelector(selectMonthTotals);

  const [dot, setDot] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const total = accounts.allIds.reduce((s, id) => s + (accounts.byId[id]?.balance ?? 0), 0);
  const totalDisplay = useCountUp(total);
  const savingsRate = income > 0 ? Math.round(((income - spending) / income) * 100) : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || !el.children.length) return;
    const child = el.children[0] as HTMLElement;
    const step = child.offsetWidth + 16;
    setDot(Math.min(accounts.allIds.length - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  };

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el || !el.children[i]) return;
    const child = el.children[i] as HTMLElement;
    el.scrollTo({
      left: child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2,
      behavior: "smooth",
    });
    setDot(i);
  };

  const list = accounts.allIds.map((id) => accounts.byId[id]).filter(Boolean) as Account[];

  return (
    <section id="overview" aria-labelledby="overview-title" className="scroll-mt-24">
      {/* greeting */}
      <Reveal className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-soft">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
          <h1 id="overview-title" className="mt-1.5 text-[26px] font-extrabold leading-tight tracking-tight text-ink sm:text-[30px]">
            {greeting}, {user.name.split(" ")[0]}
          </h1>
        </div>
        <p className="rounded-full border border-line bg-surface px-3.5 py-1.5 font-mono text-xs font-medium text-soft shadow-sm">
          Ledger · last 90 days
        </p>
      </Reveal>

      {/* net-worth strip */}
      <Reveal delay={60} className="mt-6">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border border-line bg-surface px-5 py-4 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-soft">
              Net balance · {accounts.allIds.length} accounts
            </p>
            <p className="mt-1 font-mono text-[32px] font-bold leading-none tabular-nums tracking-tight text-ink">
              {fmtCurrency(totalDisplay)}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-x-7 gap-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-soft">Income · MTD</p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-gain">
                +{fmtCurrency(income)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-soft">Spending · MTD</p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-loss">
                &minus;{fmtCurrency(spending)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-soft">Savings rate</p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-gold-700">
                {savingsRate}%
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* loading */}
      {accounts.isLoading && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              </div>
              <Skeleton className="mt-5 h-7 w-1/2" />
              <Skeleton className="mt-4 h-3 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* mobile carousel */}
      {!accounts.isLoading && (
        <div className="mt-5 sm:hidden">
          <div
            ref={trackRef}
            onScroll={onScroll}
            className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1"
          >
            {list.map((acc) => (
              <div key={acc.id} className="w-[86%] shrink-0 snap-center">
                <BalanceCard
                  account={acc}
                  selected={selectedId === acc.id}
                  onSelect={() =>
                    dispatch(selectAccount(selectedId === acc.id ? null : acc.id))
                  }
                  delay={0}
                />
              </div>
            ))}
          </div>
          <CarouselDots count={list.length} active={dot} onDot={goTo} />
        </div>
      )}

      {/* tablet / desktop grid */}
      {!accounts.isLoading && (
        <div className="mt-5 hidden gap-5 sm:grid sm:grid-cols-2 xl:grid-cols-3">
          {list.map((acc, i) => (
            <BalanceCard
              key={acc.id}
              account={acc}
              selected={selectedId === acc.id}
              onSelect={() => dispatch(selectAccount(selectedId === acc.id ? null : acc.id))}
              delay={i * 70}
            />
          ))}
        </div>
      )}
    </section>
  );
}
