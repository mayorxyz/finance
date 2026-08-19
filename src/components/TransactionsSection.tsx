import {
  useAppDispatch,
  useAppSelector,
  selectVisibleTransactions,
  setPage,
  setSearch,
  setCategoryFilter,
  setTypeFilter,
  setSort,
  selectAccount,
  removeTransaction,
  pushToast,
  PAGE_SIZE,
} from "../redux/store";
import type { SortDir, SortKey, Transaction, TypeFilter } from "../types";
import { cx, fmtDate, fmtSigned } from "../utils/format";
import { Icon } from "./icons";
import { CategoryBadge, EmptyState, Reveal, Skeleton, StatusPill } from "./ui";

function SortTh({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = sortKey === k;
  return (
    <th
      scope="col"
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      className={cx("px-4 py-3 first:pl-5 last:pr-5", className)}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className="group inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-soft transition-colors hover:text-ink"
      >
        {label}
        <Icon
          name={active ? (sortDir === "asc" ? "sortAsc" : "sortDesc") : "sortNeutral"}
          className={cx(
            "h-3.5 w-3.5 transition-colors",
            active ? "text-brand-600" : "text-soft/50 group-hover:text-soft",
          )}
          strokeWidth={2.2}
        />
      </button>
    </th>
  );
}

export function TransactionsSection() {
  const dispatch = useAppDispatch();
  const txState = useAppSelector((s) => s.transactions);
  const categories = useAppSelector((s) => s.categories);
  const accounts = useAppSelector((s) => s.accounts);
  const selectedAccountId = useAppSelector((s) => s.ui.selectedAccountId);
  const visible = useAppSelector(selectVisibleTransactions);

  const { filters, sort, isLoading } = txState;
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const page = Math.min(txState.page, totalPages);
  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedAccount = selectedAccountId ? accounts.byId[selectedAccountId] : null;

  const clearAll = () => {
    dispatch(setSearch(""));
    dispatch(setCategoryFilter(null));
    dispatch(setTypeFilter("all"));
    dispatch(selectAccount(null));
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.categoryId || filters.type !== "all" || selectedAccountId,
  );

  const del = async (tx: Transaction) => {
    await dispatch(removeTransaction(tx.id));
    dispatch(pushToast({ kind: "info", message: `Deleted “${tx.description}”.` }));
  };

  const selectCls =
    "rounded-lg border border-line bg-surface py-2 pl-3 pr-8 text-sm font-medium text-ink shadow-sm outline-none transition appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m4%206%204%204%204-4%22/%3E%3C/svg%3E')] bg-[right_8px_center] bg-no-repeat focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15";

  return (
    <section id="transactions" aria-labelledby="transactions-title" className="scroll-mt-24">
      <Reveal>
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          {/* header + controls */}
          <div className="border-b border-line px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="transactions-title" className="text-xl font-extrabold tracking-tight text-ink">
                Recent transactions
              </h2>
              <p className="font-mono text-xs font-medium text-soft" aria-live="polite">
                {isLoading ? "Loading ledger…" : `${visible.length} of ${txState.allIds.length} shown`}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[180px] flex-1 sm:max-w-[240px]">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-soft"
                />
                <input
                  type="search"
                  value={filters.search}
                  onChange={(e) => dispatch(setSearch(e.target.value))}
                  placeholder="Search ledger…"
                  aria-label="Search transactions"
                  className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-soft/70 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15"
                />
              </div>

              <select
                value={filters.categoryId ?? ""}
                onChange={(e) => dispatch(setCategoryFilter(e.target.value || null))}
                aria-label="Filter by category"
                className={selectCls}
              >
                <option value="">All categories</option>
                {categories.allIds.map((id) => (
                  <option key={id} value={id}>
                    {categories.byId[id]?.name}
                  </option>
                ))}
              </select>

              <div
                className="flex rounded-lg border border-line bg-canvas p-0.5"
                role="group"
                aria-label="Filter by type"
              >
                {(
                  [
                    ["all", "All"],
                    ["income", "In"],
                    ["expense", "Out"],
                  ] as Array<[TypeFilter, string]>
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={filters.type === value}
                    onClick={() => dispatch(setTypeFilter(value))}
                    className={cx(
                      "rounded-md px-3 py-1.5 text-xs font-bold transition-all",
                      filters.type === value
                        ? "bg-surface text-ink shadow-sm"
                        : "text-soft hover:text-ink",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {selectedAccount && (
                <button
                  type="button"
                  onClick={() => dispatch(selectAccount(null))}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 py-1.5 pl-3 pr-2 text-xs font-bold text-brand-700 transition hover:bg-brand-100"
                >
                  <Icon name="wallet" className="h-3.5 w-3.5" />
                  {selectedAccount.name}
                  <Icon name="close" className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
              )}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-bold text-soft underline decoration-line underline-offset-4 transition hover:text-loss"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* loading */}
          {isLoading && (
            <div className="space-y-3 p-5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          )}

          {/* empty */}
          {!isLoading && visible.length === 0 && (
            <EmptyState
              title="No matching transactions"
              hint="Nothing in the ledger fits the current search and filters."
              actionLabel="Clear all filters"
              onAction={clearAll}
            />
          )}

          {/* desktop / tablet table */}
          {!isLoading && visible.length > 0 && (
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[680px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas/60 text-left">
                    <SortTh label="Date" k="date" sortKey={sort.key} sortDir={sort.dir} onSort={(k) => dispatch(setSort(k))} className="w-28" />
                    <SortTh label="Description" k="description" sortKey={sort.key} sortDir={sort.dir} onSort={(k) => dispatch(setSort(k))} />
                    <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-soft">
                      Category
                    </th>
                    <SortTh label="Amount" k="amount" sortKey={sort.key} sortDir={sort.dir} onSort={(k) => dispatch(setSort(k))} className="text-right [&>button]:flex-row-reverse" />
                    <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-soft">
                      Status
                    </th>
                    <th scope="col" className="w-12 px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody key={`${page}-${sort.key}-${sort.dir}`} className="anim-enter">
                  {pageItems.map((tx) => {
                    const cat = categories.byId[tx.categoryId];
                    const acc = accounts.byId[tx.accountId];
                    return (
                      <tr key={tx.id} className="group border-b border-line/70 transition-colors last:border-0 hover:bg-canvas/70">
                        <td className="whitespace-nowrap px-4 py-3 pl-5 font-mono text-xs tabular-nums text-soft">
                          {fmtDate(tx.date)}
                        </td>
                        <td className="max-w-[260px] px-4 py-3">
                          <p className="truncate font-semibold text-ink">{tx.description}</p>
                          <p className="mt-0.5 truncate font-mono text-[11px] text-soft">
                            {acc?.name ?? "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <CategoryBadge category={cat} />
                        </td>
                        <td
                          className={cx(
                            "whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-semibold tabular-nums",
                            tx.type === "income" ? "text-gain" : "text-loss",
                          )}
                        >
                          {fmtSigned(tx.type, tx.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={tx.status} />
                        </td>
                        <td className="px-4 py-3 pr-5 text-right">
                          <button
                            type="button"
                            aria-label={`Delete ${tx.description}`}
                            onClick={() => del(tx)}
                            className="rounded-md p-1.5 text-soft opacity-0 transition-all hover:bg-loss-soft hover:text-loss focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <Icon name="trash" className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* mobile card list */}
          {!isLoading && visible.length > 0 && (
            <div className="md:hidden">
              <ul key={`m-${page}-${sort.key}-${sort.dir}`} className="anim-enter">
                {pageItems.map((tx) => {
                  const cat = categories.byId[tx.categoryId];
                  const acc = accounts.byId[tx.accountId];
                  return (
                    <li key={tx.id}>
                      <article className="flex items-center gap-3 border-b border-line/70 px-4 py-3.5 transition-colors last:border-0 active:bg-canvas">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: `${cat?.color ?? "#94A3B8"}16`,
                            color: `color-mix(in srgb, ${cat?.color ?? "#94A3B8"} 75%, #1A1F36)`,
                          }}
                        >
                          <Icon name={cat?.icon ?? "tag"} className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{tx.description}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-soft">
                            {fmtDate(tx.date)} · {acc?.name.split(" ")[0] ?? "—"}
                            {tx.status === "pending" && (
                              <span className="ml-1.5 font-bold text-gold-700">· pending</span>
                            )}
                          </p>
                        </div>
                        <p
                          className={cx(
                            "shrink-0 font-mono text-sm font-semibold tabular-nums",
                            tx.type === "income" ? "text-gain" : "text-loss",
                          )}
                        >
                          {fmtSigned(tx.type, tx.amount)}
                        </p>
                      </article>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* pagination */}
          {!isLoading && visible.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
              <p className="font-mono text-xs tabular-nums text-soft">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, visible.length)} of{" "}
                {visible.length}
              </p>
              {totalPages > 1 && (
                <nav aria-label="Pagination" className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page === 1}
                    onClick={() => dispatch(setPage(page - 1))}
                    className="rounded-lg border border-line p-1.5 text-soft transition hover:bg-canvas hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Icon name="chevronLeft" className="h-4 w-4" strokeWidth={2.2} />
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Page ${i + 1}`}
                      aria-current={page === i + 1 ? "page" : undefined}
                      onClick={() => dispatch(setPage(i + 1))}
                      className={cx(
                        "h-8 w-8 rounded-lg font-mono text-xs font-bold tabular-nums transition-all",
                        page === i + 1
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-soft hover:bg-canvas hover:text-ink",
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={page === totalPages}
                    onClick={() => dispatch(setPage(page + 1))}
                    className="rounded-lg border border-line p-1.5 text-soft transition hover:bg-canvas hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Icon name="chevronRight" className="h-4 w-4" strokeWidth={2.2} />
                  </button>
                </nav>
              )}
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
