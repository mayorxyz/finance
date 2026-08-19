import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAppDispatch,
  useAppSelector,
  pushToast,
  transactionAdded,
  transactionRemoved,
  submitTransaction,
} from "../redux/store";
import type { Goal, Transaction } from "../types";
import { cx, fmtCurrency, fmtCurrencyWhole, todayISO } from "../utils/format";
import { Icon } from "./icons";
import { RingGauge, Skeleton } from "./ui";

export function WidgetCard({
  title,
  caption,
  children,
  id,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
  id?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className="scroll-mt-24 rounded-xl border border-line bg-surface p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id={id ? `${id}-title` : undefined} className="text-[15px] font-bold tracking-tight text-ink">
            {title}
          </h2>
          {caption && <p className="mt-0.5 text-xs text-soft">{caption}</p>}
        </div>
        {collapsible && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            className="rounded-lg border border-line p-1.5 text-soft transition hover:bg-canvas hover:text-ink"
          >
            <Icon name={open ? "chevronUp" : "chevronDown"} className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
      </div>
      {(!collapsible || open) && <div className="mt-4">{children}</div>}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Quick Add                                                           */
/* ------------------------------------------------------------------ */

type Errors = Partial<Record<"description" | "amount" | "category" | "date", string>>;

export function QuickAddForm({ onDone }: { onDone?: () => void }) {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((s) => s.categories);
  const accounts = useAppSelector((s) => s.accounts);

  const [type, setType] = useState<"expense" | "income">("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("acc-checking");
  const [date, setDate] = useState(todayISO());
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const expenseCats = categories.allIds
    .map((id) => categories.byId[id])
    .filter((c) => c && c.id !== "cat-income");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    const parsed = Number(amount);
    if (description.trim().length < 2) next.description = "Enter at least 2 characters.";
    if (!amount || Number.isNaN(parsed) || parsed <= 0)
      next.amount = "Amount must be greater than zero.";
    if (parsed > 10_000_000) next.amount = "That looks too large — double-check it.";
    if (type === "expense" && !categoryId) next.category = "Pick a category.";
    if (!date) next.date = "A date is required.";
    else if (date > todayISO()) next.date = "Date can’t be in the future.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const tx: Transaction = {
      id: `tx-user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      accountId,
      categoryId: type === "income" ? "cat-income" : categoryId,
      description: description.trim(),
      merchant: description.trim(),
      amount: Math.round(parsed * 100) / 100,
      type,
      date,
      status: "pending",
    };

    // optimistic update, then persist through the mock API
    dispatch(transactionAdded(tx));
    setSubmitting(true);
    const result = await dispatch(submitTransaction(tx));
    setSubmitting(false);
    if (submitTransaction.fulfilled.match(result)) {
      dispatch(
        pushToast({
          kind: "success",
          message: `${type === "income" ? "Income" : "Expense"} of ${fmtCurrency(tx.amount)} added.`,
        }),
      );
      setDescription("");
      setAmount("");
      setCategoryId("");
      setErrors({});
      onDone?.();
    } else {
      dispatch(transactionRemoved(tx.id));
      dispatch(
        pushToast({ kind: "error", message: "Couldn’t save the transaction — it was reverted." }),
      );
    }
  };

  const inputCls = (bad?: string) =>
    cx(
      "w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-soft/70",
      bad
        ? "border-loss ring-2 ring-loss/15"
        : "border-line focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15",
    );

  const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-soft";

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {/* type segmented control */}
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-canvas p-1" role="group" aria-label="Transaction type">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={type === t}
            onClick={() => setType(t)}
            className={cx(
              "flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold transition-all",
              type === t ? "bg-surface text-ink shadow-sm" : "text-soft hover:text-ink",
            )}
          >
            <span className={cx("h-2 w-2 rounded-full", t === "expense" ? "bg-loss" : "bg-gain")} />
            {t === "expense" ? "Expense" : "Income"}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="qa-desc" className={labelCls}>
          Description
        </label>
        <input
          id="qa-desc"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={type === "income" ? "e.g. Freelance invoice #12" : "e.g. Groceries at Safeway"}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "qa-desc-err" : undefined}
          className={inputCls(errors.description)}
        />
        {errors.description && (
          <p id="qa-desc-err" className="mt-1 text-xs font-medium text-loss">
            {errors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="qa-amount" className={labelCls}>
            Amount
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-soft">
              $
            </span>
            <input
              id="qa-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={errors.amount ? "qa-amount-err" : undefined}
              className={cx(inputCls(errors.amount), "pl-7 font-mono tabular-nums")}
            />
          </div>
          {errors.amount && (
            <p id="qa-amount-err" className="mt-1 text-xs font-medium text-loss">
              {errors.amount}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="qa-date" className={labelCls}>
            Date
          </label>
          <input
            id="qa-date"
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? "qa-date-err" : undefined}
            className={cx(inputCls(errors.date), "font-mono")}
          />
          {errors.date && (
            <p id="qa-date-err" className="mt-1 text-xs font-medium text-loss">
              {errors.date}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="qa-cat" className={labelCls}>
          Category
        </label>
        <select
          id="qa-cat"
          value={type === "income" ? "cat-income" : categoryId}
          disabled={type === "income"}
          onChange={(e) => setCategoryId(e.target.value)}
          aria-invalid={Boolean(errors.category)}
          className={cx(inputCls(errors.category), "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m4%206%204%204%204-4%22/%3E%3C/svg%3E')] bg-[right_10px_center] bg-no-repeat pr-9 disabled:bg-canvas disabled:text-soft")}
        >
          {type === "income" ? (
            <option value="cat-income">Income</option>
          ) : (
            <>
              <option value="" disabled>
                Select a category…
              </option>
              {expenseCats.map(
                (c) =>
                  c && (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ),
              )}
            </>
          )}
        </select>
        {errors.category && (
          <p className="mt-1 text-xs font-medium text-loss">{errors.category}</p>
        )}
      </div>

      <div>
        <label htmlFor="qa-account" className={labelCls}>
          Account
        </label>
        <select
          id="qa-account"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className={cx(inputCls(), "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m4%206%204%204%204-4%22/%3E%3C/svg%3E')] bg-[right_10px_center] bg-no-repeat pr-9")}
        >
          {accounts.allIds.map((id) => (
            <option key={id} value={id}>
              {accounts.byId[id]?.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
              <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Saving…
          </>
        ) : (
          <>
            <Icon name="plus" className="h-4 w-4" strokeWidth={2.6} />
            Add {type === "income" ? "income" : "expense"}
          </>
        )}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Goals snapshot (compact rail widget)                                */
/* ------------------------------------------------------------------ */

export function GoalsSnapshot({ collapsible = false }: { collapsible?: boolean }) {
  const goals = useAppSelector((s) => s.goals);
  const navigate = useNavigate();

  if (goals.isLoading) {
    return (
      <WidgetCard title="Goals" caption="Loading snapshot…">
        <div className="space-y-4">
          <Skeleton className="mx-auto h-20 w-20 rounded-full" />
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-2 w-full rounded-full" />
          ))}
        </div>
      </WidgetCard>
    );
  }

  const list = goals.allIds.map((id) => goals.byId[id]).filter((g): g is Goal => Boolean(g));
  const totalSaved = list.reduce((s, g) => s + g.saved, 0);
  const totalTarget = list.reduce((s, g) => s + g.target, 0);
  const pct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
  const top = list
    .filter((g) => g.saved < g.target)
    .sort((a, b) => b.saved / b.target - a.saved / a.target)
    .slice(0, 2);

  return (
    <WidgetCard
      title="Goals"
      caption="Snapshot of your savings board"
      collapsible={collapsible}
    >
      <div className="flex flex-col items-center">
        <RingGauge pct={pct} size={88} stroke={10}>
          <span className="font-mono text-base font-bold tabular-nums text-ink">{pct}%</span>
        </RingGauge>
        <p className="mt-2 font-mono text-sm font-semibold tabular-nums text-ink">
          {fmtCurrencyWhole(totalSaved)}
          <span className="text-xs font-medium text-soft"> of {fmtCurrencyWhole(totalTarget)}</span>
        </p>
      </div>

      {top.length > 0 && (
        <ul className="mt-4 space-y-3">
          {top.map((g) => {
            const p = Math.min(100, Math.round((g.saved / g.target) * 100));
            return (
              <li key={g.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-ink">{g.name}</p>
                  <p className="font-mono text-[11px] tabular-nums text-soft">{p}%</p>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-gold-500 transition-all duration-700 ease-out"
                    style={{ width: `${p}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4">
        <button
          type="button"
          onClick={() => navigate("/goals")}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-line py-2 text-xs font-bold text-brand-700 transition hover:border-brand-200 hover:bg-brand-50 active:scale-[0.99]"
        >
          Open savings board
          <Icon name="chevronRight" className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
      </div>
    </WidgetCard>
  );
}

/* ------------------------------------------------------------------ */
/* Top categories                                                      */
/* ------------------------------------------------------------------ */

export function TopCategoriesWidget() {
  const transactions = useAppSelector((s) => s.transactions);
  const categories = useAppSelector((s) => s.categories);

  const rows = useMemo(() => {
    const monthKey = todayISO().slice(0, 7);
    const sums = new Map<string, number>();
    for (const id of transactions.allIds) {
      const tx = transactions.byId[id];
      if (!tx || tx.type !== "expense" || !tx.date.startsWith(monthKey)) continue;
      sums.set(tx.categoryId, (sums.get(tx.categoryId) ?? 0) + tx.amount);
    }
    const total = [...sums.values()].reduce((a, b) => a + b, 0);
    return [...sums.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([catId, value]) => ({
        cat: categories.byId[catId],
        value,
        share: total > 0 ? (value / total) * 100 : 0,
      }))
      .filter((r) => r.cat);
  }, [transactions, categories]);

  const max = rows[0]?.share ?? 1;

  return (
    <WidgetCard title="Top categories" caption="Where this month’s money went">
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-soft">No spending recorded this month yet.</p>
      ) : (
        <ul className="space-y-3.5">
          {rows.map(({ cat, value, share }) =>
            cat ? (
              <li key={cat.id} className="group rounded-lg p-1.5 -m-1.5 transition-colors hover:bg-canvas">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${cat.color}16`, color: `color-mix(in srgb, ${cat.color} 75%, #1A1F36)` }}
                  >
                    <Icon name={cat.icon} className="h-4 w-4" />
                  </span>
                  <p className="flex-1 truncate text-sm font-semibold text-ink">{cat.name}</p>
                  <p className="font-mono text-sm font-semibold tabular-nums text-ink">
                    {fmtCurrency(value)}
                  </p>
                </div>
                <div className="ml-[42px] mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${(share / max) * 100}%`, backgroundColor: cat.color }}
                  />
                </div>
              </li>
            ) : null,
          )}
        </ul>
      )}
    </WidgetCard>
  );
}
