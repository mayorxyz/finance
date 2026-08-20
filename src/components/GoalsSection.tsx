import { useEffect, useState, type FormEvent } from "react";
import {
  addMonths,
  differenceInCalendarMonths,
  format,
  parseISO,
  subDays,
} from "date-fns";
import {
  useAppDispatch,
  useAppSelector,
  contributeToGoal,
  createGoal,
  deleteGoal,
  pushToast,
} from "../redux/store";
import type { Goal } from "../types";
import { cx, fmtCurrency, fmtCurrencyWhole, todayISO } from "../utils/format";
import { Icon } from "./icons";
import { EmptyState, Reveal, RingGauge, Skeleton } from "./ui";

/* ------------------------------------------------------------------ */
/* Stats engine                                                        */
/* ------------------------------------------------------------------ */

interface GoalStats {
  pct: number;
  remaining: number;
  funded: boolean;
  pastDue: boolean;
  neededPerMo: number;
  pace: number;
  projected: string | null;
  status: { label: string; cls: string; icon: string };
}

function computeStats(g: Goal): GoalStats {
  const funded = g.saved >= g.target;
  const remaining = Math.max(0, g.target - g.saved);
  const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
  const monthsLeft = differenceInCalendarMonths(parseISO(g.deadline), new Date());
  const pastDue = !funded && monthsLeft <= 0;
  const neededPerMo = !funded && monthsLeft > 0 ? remaining / monthsLeft : 0;

  const cutoff = format(subDays(new Date(), 90), "yyyy-MM-dd");
  const recent = g.contributions.filter((c) => c.date >= cutoff);
  const pace = recent.length > 0 ? recent.reduce((s, c) => s + c.amount, 0) / 3 : 0;

  let projected: string | null = null;
  if (funded) projected = "Complete";
  else if (pace > 0)
    projected = format(addMonths(new Date(), Math.ceil(remaining / pace)), "MMM yyyy");

  let status: GoalStats["status"];
  if (funded) status = { label: "Funded", cls: "bg-gold-100 text-gold-700", icon: "check" };
  else if (pastDue) status = { label: "Past due", cls: "bg-loss-soft text-loss", icon: "alert" };
  else if (neededPerMo > 0 && pace >= neededPerMo * 1.15)
    status = { label: "Ahead", cls: "bg-gain-soft text-gain", icon: "arrowUpRight" };
  else if (neededPerMo > 0 && pace >= neededPerMo * 0.8)
    status = { label: "On track", cls: "bg-brand-50 text-brand-700", icon: "trendLine" };
  else status = { label: "Behind", cls: "bg-loss-soft text-loss", icon: "arrowDownRight" };

  return { pct, remaining, funded, pastDue, neededPerMo, pace, projected, status };
}

/* ------------------------------------------------------------------ */
/* Goal card                                                           */
/* ------------------------------------------------------------------ */

function GoalCard({
  goal,
  onContribute,
  onDelete,
}: {
  goal: Goal;
  onContribute: (g: Goal, amount: number) => void;
  onDelete: (g: Goal) => void;
}) {
  const s = computeStats(goal);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 2600);
    return () => window.clearTimeout(t);
  }, [armed]);

  const last = goal.contributions[0];

  return (
    <article className="group relative flex flex-col rounded-xl border border-line bg-surface p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md sm:p-5">
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:w-11"
          style={{
            backgroundColor: `${goal.color}14`,
            color: `color-mix(in srgb, ${goal.color} 78%, #1A1F36)`,
          }}
        >
          <Icon name={goal.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold tracking-tight text-ink">{goal.name}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-soft">
            <Icon name="calendar" className="h-3.5 w-3.5" />
            Due {format(parseISO(goal.deadline), "MMM yyyy")}
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{fmtCurrencyWhole(goal.monthlyPace)}/mo plan</span>
          </p>
        </div>
        <span
          className={cx(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold sm:px-2.5 sm:py-1 sm:text-[11px]",
            s.status.cls,
          )}
        >
          <Icon name={s.status.icon} className="h-3 w-3" strokeWidth={2.4} />
          {s.status.label}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xl font-bold leading-none tabular-nums text-ink sm:text-[22px]">
            {fmtCurrency(goal.saved)}
          </p>
          <p className="mt-1 text-xs text-soft">
            of <span className="font-mono tabular-nums">{fmtCurrencyWhole(goal.target)}</span> target
          </p>
        </div>
        <p
          className={cx(
            "font-mono text-base font-bold tabular-nums sm:text-lg",
            s.funded ? "text-gain" : "text-brand-600",
          )}
        >
          {s.pct}%
        </p>
      </div>

      {/* progress with milestone ticks */}
      <div
        className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={s.pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${goal.name} progress`}
      >
        <div
          className={cx(
            "h-full rounded-full transition-all duration-700 ease-out",
            s.funded ? "bg-gain" : "bg-gold-500",
          )}
          style={{ width: `${s.pct}%` }}
        />
        {[25, 50, 75].map((m) => (
          <span
            key={m}
            className="absolute inset-y-0 w-px bg-white/80"
            style={{ left: `${m}%` }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Stacks vertically on mobile, side-by-side on desktop */}
      <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-canvas p-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-soft">Projected</p>
          <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-ink">
            {s.projected ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-soft">Needed / mo</p>
          <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
            <span className={cx(s.funded ? "text-soft" : s.pace >= s.neededPerMo ? "text-gain" : "text-loss")}>
              {s.funded ? "—" : fmtCurrencyWhole(s.neededPerMo)}
            </span>
            {!s.funded && (
              <span className="ml-1 text-[11px] font-medium text-soft">
                · pace {fmtCurrencyWhole(s.pace)}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3.5">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2" role="group" aria-label={`Contribute to ${goal.name}`}>
          {[25, 50, 100].map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={s.funded}
              onClick={() => onContribute(goal, amt)}
              aria-label={`Contribute $${amt} to ${goal.name}`}
              className="rounded-md border border-line px-1.5 py-1 font-mono text-[11px] font-bold tabular-nums text-brand-700 transition hover:border-brand-200 hover:bg-brand-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line disabled:hover:bg-transparent sm:px-2 sm:text-xs"
            >
              +${amt}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {last && (
            <p className="hidden font-mono text-[11px] tabular-nums text-soft sm:block">
              +{fmtCurrencyWhole(last.amount)} · {format(parseISO(last.date), "MMM d")}
            </p>
          )}
          <button
            type="button"
            onClick={() => (armed ? onDelete(goal) : setArmed(true))}
            aria-label={armed ? `Confirm removing ${goal.name}` : `Remove ${goal.name}`}
            className={cx(
              "rounded-md p-1.5 transition active:scale-95",
              armed
                ? "bg-loss text-white shadow-sm"
                : "text-soft hover:bg-loss-soft hover:text-loss",
            )}
          >
            <Icon name={armed ? "check" : "trash"} className="h-4 w-4" strokeWidth={2.1} />
          </button>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* New goal modal                                                      */
/* ------------------------------------------------------------------ */

const GOAL_ICONS = [
  { icon: "piggy", color: "#0D7E6E" },
  { icon: "target", color: "#F5A623" },
  { icon: "home", color: "#64748B" },
  { icon: "car", color: "#0EA5E9" },
  { icon: "ticket", color: "#EC4899" },
  { icon: "bolt", color: "#F59E0B" },
  { icon: "bag", color: "#F97066" },
  { icon: "coins", color: "#059669" },
  { icon: "pulse", color: "#14B8A6" },
  { icon: "wallet", color: "#8B5CF6" },
];

function NewGoalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState(format(addMonths(new Date(), 6), "yyyy-MM-dd"));
  const [monthly, setMonthly] = useState("");
  const [initial, setInitial] = useState("");
  const [iconIdx, setIconIdx] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const tomorrow = format(addDaysSafe(1), "yyyy-MM-dd");
  const targetNum = Number(target);
  const monthlyNum = Number(monthly);
  const estimate =
    targetNum > 0 && monthlyNum > 0
      ? `${Math.ceil(targetNum / monthlyNum)} months at ${fmtCurrencyWhole(monthlyNum)}/mo`
      : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Give it a name (2+ characters).";
    if (!target || Number.isNaN(targetNum) || targetNum <= 0)
      next.target = "Target must be greater than zero.";
    if (!deadline) next.deadline = "Pick a deadline.";
    else if (deadline < tomorrow) next.deadline = "Deadline must be in the future.";
    if (monthly && (Number.isNaN(monthlyNum) || monthlyNum < 0))
      next.monthly = "Monthly plan can’t be negative.";
    const initialNum = initial ? Number(initial) : 0;
    if (initial && (Number.isNaN(initialNum) || initialNum < 0))
      next.initial = "Deposit can’t be negative.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const now = Date.now();
    const choice = GOAL_ICONS[iconIdx];
    const goal: Goal = {
      id: `goal-user-${now}`,
      name: name.trim(),
      icon: choice.icon,
      color: choice.color,
      target: Math.round(targetNum * 100) / 100,
      saved: initialNum,
      monthlyPace: Math.round(monthlyNum || 0),
      deadline,
      contributions:
        initialNum > 0
          ? [{ id: `c-init-${now}`, date: todayISO(), amount: initialNum }]
          : [],
    };
    dispatch(createGoal(goal));
    dispatch(pushToast({ kind: "success", message: `"${goal.name}" added to your board.` }));
    setName("");
    setTarget("");
    setMonthly("");
    setInitial("");
    setIconIdx(0);
    onClose();
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
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink/50" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-goal-title"
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-surface p-4 shadow-lg sm:max-w-md sm:rounded-2xl sm:p-6"
        style={{ animation: "sheet-up 0.3s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 id="new-goal-title" className="text-lg font-extrabold tracking-tight text-ink">
              New savings goal
            </h2>
            <p className="mt-0.5 text-xs text-soft">Set a target and we’ll track the pace for you.</p>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            autoFocus
            className="rounded-lg p-2 text-soft transition hover:bg-canvas hover:text-ink"
          >
            <Icon name="close" className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={submit} noValidate className="space-y-4">
          <div>
            <label htmlFor="ng-name" className={labelCls}>Goal name</label>
            <input
              id="ng-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Patagonia trek"
              aria-invalid={Boolean(errors.name)}
              className={inputCls(errors.name)}
            />
            {errors.name && <p className="mt-1 text-xs font-medium text-loss">{errors.name}</p>}
          </div>

          {/* Stacks vertically on mobile so inputs don't cramp */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ng-target" className={labelCls}>Target</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-soft">$</span>
                <input
                  id="ng-target"
                  type="number"
                  inputMode="decimal"
                  step="1"
                  min="0"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="5,000"
                  aria-invalid={Boolean(errors.target)}
                  className={cx(inputCls(errors.target), "pl-7 font-mono tabular-nums")}
                />
              </div>
              {errors.target && <p className="mt-1 text-xs font-medium text-loss">{errors.target}</p>}
            </div>
            <div>
              <label htmlFor="ng-deadline" className={labelCls}>Deadline</label>
              <input
                id="ng-deadline"
                type="date"
                value={deadline}
                min={tomorrow}
                onChange={(e) => setDeadline(e.target.value)}
                aria-invalid={Boolean(errors.deadline)}
                className={cx(inputCls(errors.deadline), "font-mono")}
              />
              {errors.deadline && <p className="mt-1 text-xs font-medium text-loss">{errors.deadline}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ng-monthly" className={labelCls}>Monthly plan</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-soft">$</span>
                <input
                  id="ng-monthly"
                  type="number"
                  inputMode="decimal"
                  step="1"
                  min="0"
                  value={monthly}
                  onChange={(e) => setMonthly(e.target.value)}
                  placeholder="250"
                  className={cx(inputCls(errors.monthly), "pl-7 font-mono tabular-nums")}
                />
              </div>
              {errors.monthly && <p className="mt-1 text-xs font-medium text-loss">{errors.monthly}</p>}
            </div>
            <div>
              <label htmlFor="ng-initial" className={labelCls}>
                Starting amount <span className="normal-case text-soft/70">(optional)</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-soft">$</span>
                <input
                  id="ng-initial"
                  type="number"
                  inputMode="decimal"
                  step="1"
                  min="0"
                  value={initial}
                  onChange={(e) => setInitial(e.target.value)}
                  placeholder="0"
                  className={cx(inputCls(errors.initial), "pl-7 font-mono tabular-nums")}
                />
              </div>
              {errors.initial && <p className="mt-1 text-xs font-medium text-loss">{errors.initial}</p>}
            </div>
          </div>

          {estimate && (
            <p className="rounded-lg bg-brand-50 px-3 py-2 font-mono text-xs font-medium text-brand-700">
              ≈ {estimate}, before any growth.
            </p>
          )}

          <fieldset>
            <legend className={labelCls}>Icon</legend>
            <div className="grid grid-cols-5 gap-2">
              {GOAL_ICONS.map((opt, i) => (
                <button
                  key={opt.icon}
                  type="button"
                  onClick={() => setIconIdx(i)}
                  aria-pressed={iconIdx === i}
                  aria-label={`Icon ${i + 1}`}
                  className={cx(
                    "flex items-center justify-center rounded-lg border p-2.5 transition-all active:scale-95",
                    iconIdx === i
                      ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600/20"
                      : "border-line hover:border-brand-200 hover:bg-canvas",
                  )}
                >
                  <span style={{ color: opt.color }} className="flex">
                    <Icon name={opt.icon} className="h-5 w-5" />
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.99]"
          >
            <Icon name="target" className="h-4 w-4" strokeWidth={2.2} />
            Create goal
          </button>
        </form>
      </div>
    </div>
  );
}

function addDaysSafe(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export default function GoalsSection() {
  const dispatch = useAppDispatch();
  const goals = useAppSelector((s) => s.goals);
  const [modalOpen, setModalOpen] = useState(false);

  const list = goals.allIds.map((id) => goals.byId[id]).filter((g): g is Goal => Boolean(g));
  const totalSaved = list.reduce((s, g) => s + g.saved, 0);
  const totalTarget = list.reduce((s, g) => s + g.target, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
  const fundedCount = list.filter((g) => g.saved >= g.target).length;

  const handleContribute = (g: Goal, amount: number) => {
    const willFund = Math.min(g.target, g.saved + amount) >= g.target;
    dispatch(
      contributeToGoal({
        goalId: g.id,
        amount,
        contributionId: `c-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
        prevSaved: g.saved,
      }),
    ).then((res) => {
      if (contributeToGoal.fulfilled.match(res)) {
        dispatch(
          pushToast({
            kind: "success",
            message: willFund
              ? `Goal reached — ${g.name} is fully funded!`
              : `Contributed ${fmtCurrencyWhole(amount)} to ${g.name}.`,
          }),
        );
      } else {
        dispatch(pushToast({ kind: "error", message: "Contribution failed — the change was reverted." }));
      }
    });
  };

  const handleDelete = (g: Goal) => {
    dispatch(deleteGoal(g)).then((res) => {
      if (deleteGoal.fulfilled.match(res)) {
        dispatch(pushToast({ kind: "info", message: `Removed "${g.name}" from your board.` }));
      } else {
        dispatch(pushToast({ kind: "error", message: "Couldn’t remove the goal — try again." }));
      }
    });
  };

  if (goals.isLoading) {
    return (
      <section id="goals" aria-label="Savings goals" className="scroll-mt-24">
        <Skeleton className="h-5 w-40" />
        <div className="mt-5 grid gap-5 md:grid-cols-2">
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

  return (
    <section id="goals" aria-labelledby="goals-title" className="scroll-mt-24">
      <Reveal>
        {/* Stacks vertically on mobile, side-by-side on desktop */}
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">
              Savings board
            </h1>
            <div className="space-y-1">
              <h2 className="text-base md:text-lg font-semibold text-ink">
                Goals
              </h2>
              <p className="text-sm md:text-base text-soft leading-relaxed max-w-2xl">
                Milestones, contribution pace and projected completion fund them in one tap.
              </p>
            </div>
          </div>
          {list.length > 0 && (
            <div className="flex items-center gap-4 rounded-xl border border-line bg-surface px-4 py-3 shadow-sm sm:px-5 sm:py-4">
              <RingGauge pct={overallPct} size={76} stroke={9}>
                <span className="font-mono text-sm font-bold tabular-nums text-ink">{overallPct}%</span>
              </RingGauge>
              <div>
                <p className="font-mono text-base font-bold leading-tight tabular-nums text-ink sm:text-lg">
                  {fmtCurrencyWhole(totalSaved)}
                  <span className="ml-1.5 text-xs font-medium text-soft">
                    of {fmtCurrencyWhole(totalTarget)}
                  </span>
                </p>
                <p className="mt-1 text-xs text-soft">
                  <span className="font-semibold text-gold-700">{fundedCount} funded</span>
                  {" · "}
                  {list.length - fundedCount} in progress
                </p>
              </div>
            </div>
          )}
        </header>
      </Reveal>

      {list.length === 0 ? (
        <div className="mt-6 rounded-xl border border-line bg-surface shadow-sm">
          <EmptyState
            title="No goals yet"
            hint="Create your first savings goal and start tracking pace toward it."
            actionLabel="New goal"
            onAction={() => setModalOpen(true)}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {list.map((g, i) => (
            <Reveal key={g.id} delay={i * 80}>
              <GoalCard goal={g} onContribute={handleContribute} onDelete={handleDelete} />
            </Reveal>
          ))}
          <Reveal delay={list.length * 80}>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex h-full min-h-[220px] w-full flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-line bg-canvas/50 text-soft transition-all duration-300 hover:border-brand-500 hover:bg-brand-50/60 hover:text-brand-700 active:scale-[0.99]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-current/30 bg-surface shadow-sm">
                <Icon name="plus" className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <span className="text-sm font-bold">New goal</span>
              <span className="text-xs">Pick a target, set a pace, ship it</span>
            </button>
          </Reveal>
        </div>
      )}

      <NewGoalModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}