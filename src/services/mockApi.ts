import type { DashboardPayload, Goal, Transaction } from "../types";
import {
  ACCOUNTS,
  CATEGORIES,
  GOALS,
  buildSeries,
  buildTransactions,
} from "./mockData";

const LS_TX = "ledgerline.tx.v1";
const LS_DELETED = "ledgerline.deleted.v1";
const LS_GOALS = "ledgerline.goals.v1";

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — demo continues in memory */
  }
}

function simulateNetwork<T>(payload: T, min = 320, spread = 420): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(payload), min + Math.random() * spread);
  });
}

function mergeTransactions(): Transaction[] {
  const added = readLS<Transaction[]>(LS_TX, []);
  const deleted = readLS<string[]>(LS_DELETED, []);
  const baseline = buildTransactions().filter((t) => !deleted.includes(t.id));
  return [...added, ...baseline].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  );
}

function loadGoals(): Goal[] {
  return readLS<Goal[]>(LS_GOALS, GOALS);
}

export const api = {
  fetchDashboard(): Promise<DashboardPayload> {
    return simulateNetwork({
      accounts: ACCOUNTS,
      categories: CATEGORIES,
      transactions: mergeTransactions(),
      goals: loadGoals(),
      series: buildSeries(),
    });
  },

  async addTransaction(tx: Transaction): Promise<Transaction> {
    const added = readLS<Transaction[]>(LS_TX, []);
    const persisted: Transaction = { ...tx, status: "completed" };
    writeLS(LS_TX, [persisted, ...added.filter((t) => t.id !== tx.id)]);
    return simulateNetwork(persisted, 380, 360);
  },

  async deleteTransaction(id: string): Promise<{ id: string }> {
    const added = readLS<Transaction[]>(LS_TX, []).filter((t) => t.id !== id);
    writeLS(LS_TX, added);
    if (id.startsWith("tx-base-")) {
      const deleted = readLS<string[]>(LS_DELETED, []);
      writeLS(LS_DELETED, [...deleted, id]);
    }
    return simulateNetwork({ id }, 200, 220);
  },

  async contributeToGoal(goalId: string, amount: number): Promise<Goal[]> {
    const goals = loadGoals().map((g) =>
      g.id === goalId
        ? { ...g, saved: Math.min(g.target, g.saved + amount) }
        : g,
    );
    writeLS(LS_GOALS, goals);
    return simulateNetwork(goals, 240, 240);
  },

  resetDemoData(): Promise<{ ok: true }> {
    try {
      window.localStorage.removeItem(LS_TX);
      window.localStorage.removeItem(LS_DELETED);
      window.localStorage.removeItem(LS_GOALS);
    } catch {
      /* noop */
    }
    return simulateNetwork({ ok: true as const }, 240, 200);
  },
};
