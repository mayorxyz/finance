export type AccountType = "checking" | "savings" | "investment";

export interface Account {
  id: string;
  name: string;
  institution: string;
  type: AccountType;
  balance: number;
  currency: string;
  /** Month-over-month change, in percent. */
  trendPct: number;
  /** 12-point sparkline series. */
  spark: number[];
}

export type TxType = "income" | "expense";
export type TxStatus = "completed" | "pending";

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  merchant: string;
  categoryId: string;
  /** Always positive; direction comes from `type`. */
  amount: number;
  type: TxType;
  /** ISO date string (yyyy-MM-dd). */
  date: string;
  status: TxStatus;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  monthlyBudget: number;
}

export interface Contribution {
  id: string;
  /** ISO date string (yyyy-MM-dd). */
  date: string;
  amount: number;
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  color: string;
  target: number;
  saved: number;
  /** Planned monthly contribution, in dollars. */
  monthlyPace: number;
  /** ISO date string (yyyy-MM-dd). */
  deadline: string;
  contributions: Contribution[];
}

export interface DashboardSeries {
  months: string[];
  income: number[];
  spending: number[];
  investmentReturns: { label: string; value: number }[];
  netWorth: { months: string[]; assets: number[]; liabilities: number[] };
}

export interface DashboardPayload {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  goals: Goal[];
  series: DashboardSeries;
}

export interface Toast {
  id: string;
  kind: "success" | "error" | "info";
  message: string;
}

export type SortKey = "date" | "amount" | "description";
export type SortDir = "asc" | "desc";
export type TypeFilter = "all" | TxType;
