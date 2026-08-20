import {
  configureStore,
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type {
  Account,
  Category,
  DashboardSeries,
  Goal,
  SortDir,
  SortKey,
  Toast,
  Transaction,
  TypeFilter,
} from "../types";
import { api } from "../services/mockApi";
import type { Contribution } from "../types";
import { todayISO } from "../utils/format";

export const PAGE_SIZE = 20;

export interface ContributeArg {
  goalId: string;
  amount: number;
  contributionId: string;
  prevSaved: number;
}

function byId<T extends { id: string }>(list: T[]): Record<string, T> {
  return Object.fromEntries(list.map((item) => [item.id, item]));
}

/* ------------------------------------------------------------------ */
/* Thunks                                                              */
/* ------------------------------------------------------------------ */

export const initializeDashboard = createAsyncThunk(
  "dashboard/initialize",
  () => api.fetchDashboard(),
);

export const submitTransaction = createAsyncThunk(
  "transactions/submit",
  (tx: Transaction) => api.addTransaction(tx),
);

export const removeTransaction = createAsyncThunk(
  "transactions/remove",
  (id: string) => api.deleteTransaction(id),
);

export const contributeToGoal = createAsyncThunk(
  "goals/contribute",
  async (arg: ContributeArg, { getState }) => {
    const state = getState() as RootState;
    const goal = state.goals.byId[arg.goalId];
    if (!goal) throw new Error("Goal not found");
    const contribution: Contribution = {
      id: arg.contributionId,
      date: todayISO(),
      amount: arg.amount,
    };
    const updated: Goal = {
      ...goal,
      saved: Math.min(goal.target, goal.saved + arg.amount),
      contributions: [contribution, ...goal.contributions].slice(0, 40),
    };
    const next = state.goals.allIds.map((id) =>
      id === arg.goalId ? updated : state.goals.byId[id],
    );
    await api.saveGoals(next);
    return { goalId: arg.goalId, saved: updated.saved };
  },
);

export const createGoal = createAsyncThunk(
  "goals/create",
  async (goal: Goal, { getState }) => {
    const state = getState() as RootState;
    const next = [goal, ...state.goals.allIds.map((id) => state.goals.byId[id])];
    await api.saveGoals(next);
    return goal;
  },
);

export const deleteGoal = createAsyncThunk(
  "goals/delete",
  async (goal: Goal, { getState }) => {
    const state = getState() as RootState;
    const next = state.goals.allIds
      .filter((id) => id !== goal.id)
      .map((id) => state.goals.byId[id]);
    await api.saveGoals(next);
    return goal;
  },
);

export const resetDemo = createAsyncThunk("demo/reset", () =>
  api.resetDemoData(),
);

/* ------------------------------------------------------------------ */
/* Slices                                                              */
/* ------------------------------------------------------------------ */

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: { name: "Mayor B", email: "mayor.b@meridian.dev", initials: "MB" },
    isLoading: false,
  },
  reducers: {},
});

const accountsSlice = createSlice({
  name: "accounts",
  initialState: {
    byId: {} as Record<string, Account>,
    allIds: [] as string[],
    isLoading: true,
  },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(initializeDashboard.pending, (s) => {
      s.isLoading = true;
    });
    b.addCase(initializeDashboard.fulfilled, (s, a) => {
      s.byId = byId(a.payload.accounts);
      s.allIds = a.payload.accounts.map((x) => x.id);
      s.isLoading = false;
    });
  },
});

const categoriesSlice = createSlice({
  name: "categories",
  initialState: {
    byId: {} as Record<string, Category>,
    allIds: [] as string[],
  },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(initializeDashboard.fulfilled, (s, a) => {
      s.byId = byId(a.payload.categories);
      s.allIds = a.payload.categories.map((x) => x.id);
    });
  },
});

const chartsSlice = createSlice({
  name: "charts",
  initialState: { data: null as DashboardSeries | null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(initializeDashboard.fulfilled, (s, a) => {
      s.data = a.payload.series;
    });
  },
});

const goalsSlice = createSlice({
  name: "goals",
  initialState: {
    byId: {} as Record<string, Goal>,
    allIds: [] as string[],
    isLoading: true,
  },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(initializeDashboard.pending, (s) => {
      s.isLoading = true;
    });
    b.addCase(initializeDashboard.fulfilled, (s, a) => {
      s.byId = byId(a.payload.goals);
      s.allIds = a.payload.goals.map((x) => x.id);
      s.isLoading = false;
    });
    /* contribute — optimistic on pending, authoritative on fulfilled, rollback on rejected */
    b.addCase(contributeToGoal.pending, (s, a) => {
      const g = s.byId[a.meta.arg.goalId];
      if (!g) return;
      g.saved = Math.min(g.target, g.saved + a.meta.arg.amount);
      g.contributions = [
        { id: a.meta.arg.contributionId, date: todayISO(), amount: a.meta.arg.amount },
        ...g.contributions,
      ];
    });
    b.addCase(contributeToGoal.fulfilled, (s, a) => {
      const g = s.byId[a.payload.goalId];
      if (g) g.saved = a.payload.saved;
    });
    b.addCase(contributeToGoal.rejected, (s, a) => {
      const g = s.byId[a.meta.arg.goalId];
      if (!g) return;
      g.saved = a.meta.arg.prevSaved;
      g.contributions = g.contributions.filter(
        (c) => c.id !== a.meta.arg.contributionId,
      );
    });
    /* create — optimistic insert */
    b.addCase(createGoal.pending, (s, a) => {
      s.byId[a.meta.arg.id] = a.meta.arg;
      s.allIds = [a.meta.arg.id, ...s.allIds];
    });
    b.addCase(createGoal.rejected, (s, a) => {
      delete s.byId[a.meta.arg.id];
      s.allIds = s.allIds.filter((id) => id !== a.meta.arg.id);
    });
    /* delete — optimistic removal, restore on failure */
    b.addCase(deleteGoal.pending, (s, a) => {
      delete s.byId[a.meta.arg.id];
      s.allIds = s.allIds.filter((id) => id !== a.meta.arg.id);
    });
    b.addCase(deleteGoal.rejected, (s, a) => {
      s.byId[a.meta.arg.id] = a.meta.arg;
      s.allIds = [a.meta.arg.id, ...s.allIds];
    });
  },
});

interface TxState {
  byId: Record<string, Transaction>;
  allIds: string[];
  isLoading: boolean;
  filters: { search: string; categoryId: string | null; type: TypeFilter };
  sort: { key: SortKey; dir: SortDir };
  page: number;
}

const transactionsSlice = createSlice({
  name: "transactions",
  initialState: {
    byId: {},
    allIds: [],
    isLoading: true,
    filters: { search: "", categoryId: null, type: "all" },
    sort: { key: "date", dir: "desc" },
    page: 1,
  } as TxState,
  reducers: {
    setSearch(s, a: PayloadAction<string>) {
      s.filters.search = a.payload;
      s.page = 1;
    },
    setCategoryFilter(s, a: PayloadAction<string | null>) {
      s.filters.categoryId = a.payload;
      s.page = 1;
    },
    setTypeFilter(s, a: PayloadAction<TypeFilter>) {
      s.filters.type = a.payload;
      s.page = 1;
    },
    setSort(s, a: PayloadAction<SortKey>) {
      if (s.sort.key === a.payload) {
        s.sort.dir = s.sort.dir === "desc" ? "asc" : "desc";
      } else {
        s.sort.key = a.payload;
        s.sort.dir = a.payload === "date" ? "desc" : "desc";
      }
      s.page = 1;
    },
    setPage(s, a: PayloadAction<number>) {
      s.page = a.payload;
    },
    transactionAdded(s, a: PayloadAction<Transaction>) {
      s.byId[a.payload.id] = a.payload;
      s.allIds = [a.payload.id, ...s.allIds];
      s.page = 1;
    },
    transactionFinalized(s, a: PayloadAction<string>) {
      const tx = s.byId[a.payload];
      if (tx) tx.status = "completed";
    },
    transactionRemoved(s, a: PayloadAction<string>) {
      delete s.byId[a.payload];
      s.allIds = s.allIds.filter((id) => id !== a.payload);
    },
  },
  extraReducers: (b) => {
    b.addCase(initializeDashboard.pending, (s) => {
      s.isLoading = true;
    });
    b.addCase(initializeDashboard.fulfilled, (s, a) => {
      s.byId = byId(a.payload.transactions);
      s.allIds = a.payload.transactions.map((x) => x.id);
      s.isLoading = false;
      s.page = 1;
    });
    b.addCase(submitTransaction.fulfilled, (s, a) => {
      const tx = s.byId[a.payload.id];
      if (tx) tx.status = "completed";
    });
    b.addCase(removeTransaction.fulfilled, (s, a) => {
      delete s.byId[a.payload.id];
      s.allIds = s.allIds.filter((id) => id !== a.payload.id);
    });
  },
});

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    sidebarOpen: false,
    addSheetOpen: false,
    selectedAccountId: null as string | null,
    toasts: [] as Toast[],
  },
  reducers: {
    setSidebar(s, a: PayloadAction<boolean>) {
      s.sidebarOpen = a.payload;
    },
    setAddSheet(s, a: PayloadAction<boolean>) {
      s.addSheetOpen = a.payload;
    },
    selectAccount(s, a: PayloadAction<string | null>) {
      s.selectedAccountId = a.payload;
    },
    pushToast(s, a: PayloadAction<Omit<Toast, "id">>) {
      s.toasts = [
        ...s.toasts.slice(-3),
        { ...a.payload, id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
      ];
    },
    dismissToast(s, a: PayloadAction<string>) {
      s.toasts = s.toasts.filter((t) => t.id !== a.payload);
    },
  },
});

export const {
  setSearch,
  setCategoryFilter,
  setTypeFilter,
  setSort,
  setPage,
  transactionAdded,
  transactionFinalized,
  transactionRemoved,
} = transactionsSlice.actions;

export const {
  setSidebar,
  setAddSheet,
  selectAccount,
  pushToast,
  dismissToast,
} = uiSlice.actions;

/* ------------------------------------------------------------------ */
/* Store & typed hooks                                                 */
/* ------------------------------------------------------------------ */

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    accounts: accountsSlice.reducer,
    categories: categoriesSlice.reducer,
    charts: chartsSlice.reducer,
    goals: goalsSlice.reducer,
    transactions: transactionsSlice.reducer,
    ui: uiSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

export function selectVisibleTransactions(state: RootState): Transaction[] {
  const { byId, allIds, filters, sort } = state.transactions;
  const { selectedAccountId } = state.ui;
  const q = filters.search.trim().toLowerCase();

  const list = allIds
    .map((id) => byId[id])
    .filter((tx): tx is Transaction => Boolean(tx))
    .filter((tx) => !selectedAccountId || tx.accountId === selectedAccountId)
    .filter((tx) => !filters.categoryId || tx.categoryId === filters.categoryId)
    .filter((tx) => filters.type === "all" || tx.type === filters.type)
    .filter(
      (tx) =>
        !q ||
        tx.description.toLowerCase().includes(q) ||
        tx.merchant.toLowerCase().includes(q),
    );

  const dir = sort.dir === "asc" ? 1 : -1;
  list.sort((a, b) => {
    if (sort.key === "amount") {
      const av = a.type === "income" ? a.amount : -a.amount;
      const bv = b.type === "income" ? b.amount : -b.amount;
      return (av - bv) * dir;
    }
    if (sort.key === "description") {
      return a.description.localeCompare(b.description) * dir;
    }
    return a.date.localeCompare(b.date) * dir;
  });
  return list;
}

export function selectMonthTotals(state: RootState): {
  income: number;
  spending: number;
} {
  const nowKey = new Date().toISOString().slice(0, 7);
  let income = 0;
  let spending = 0;
  for (const id of state.transactions.allIds) {
    const tx = state.transactions.byId[id];
    if (!tx || !tx.date.startsWith(nowKey)) continue;
    if (tx.type === "income") income += tx.amount;
    else spending += tx.amount;
  }
  return { income, spending };
}
