import { addMonths, format, set, subDays, subMonths } from "date-fns";
import type {
  Account,
  Category,
  Contribution,
  DashboardSeries,
  Goal,
  Transaction,
} from "../types";
import { mulberry32 } from "../utils/format";

const rand = mulberry32(20250814);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + rand() * (max - min);
const money = (min: number, max: number) => Math.round(between(min, max) * 100) / 100;

/* ------------------------------------------------------------------ */
/* Accounts                                                            */
/* ------------------------------------------------------------------ */

function spark(base: number, driftPct: number): number[] {
  const pts: number[] = [];
  let v = base / (1 + driftPct / 100);
  for (let i = 0; i < 12; i += 1) {
    v *= 1 + driftPct / 100 / 11 + between(-0.012, 0.014);
    pts.push(Math.round(v * 100) / 100);
  }
  pts[11] = base;
  return pts;
}

export const ACCOUNTS: Account[] = [
  {
    id: "acc-checking",
    name: "Everyday Checking",
    institution: "Meridian Bank ··4821",
    type: "checking",
    balance: 8542.3,
    currency: "USD",
    trendPct: 2.4,
    spark: spark(8542.3, 2.4),
  },
  {
    id: "acc-savings",
    name: "High-Yield Savings",
    institution: "Meridian Bank ··9034",
    type: "savings",
    balance: 24118.75,
    currency: "USD",
    trendPct: 4.1,
    spark: spark(24118.75, 4.1),
  },
  {
    id: "acc-invest",
    name: "Brokerage Portfolio",
    institution: "Northpeak Invest ··1177",
    type: "investment",
    balance: 47256.9,
    currency: "USD",
    trendPct: -1.2,
    spark: spark(47256.9, -1.2),
  },
];

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export const CATEGORIES: Category[] = [
  { id: "cat-housing", name: "Housing", color: "#64748B", icon: "home", monthlyBudget: 1450 },
  { id: "cat-groceries", name: "Groceries", color: "#059669", icon: "cart", monthlyBudget: 420 },
  { id: "cat-dining", name: "Dining Out", color: "#F5A623", icon: "cup", monthlyBudget: 260 },
  { id: "cat-transport", name: "Transport", color: "#0EA5E9", icon: "car", monthlyBudget: 180 },
  { id: "cat-utilities", name: "Utilities", color: "#8B5CF6", icon: "bolt", monthlyBudget: 210 },
  { id: "cat-entertainment", name: "Entertainment", color: "#EC4899", icon: "ticket", monthlyBudget: 150 },
  { id: "cat-shopping", name: "Shopping", color: "#F97066", icon: "bag", monthlyBudget: 240 },
  { id: "cat-health", name: "Health", color: "#14B8A6", icon: "pulse", monthlyBudget: 120 },
  { id: "cat-income", name: "Income", color: "#0D7E6E", icon: "arrowDown", monthlyBudget: 0 },
];

const MERCHANTS: Record<string, string[]> = {
  "cat-housing": ["Rent — Maple St. Apartment"],
  "cat-groceries": ["Whole Foods Market", "Trader Joe's", "Safeway", "Costco Wholesale"],
  "cat-dining": ["Blue Bottle Coffee", "Chipotle", "Ramen Underground", "Taqueria La Luz", "Sweetgreen"],
  "cat-transport": ["Uber", "Shell Gas Station", "Metro Transit Card", "Lyft", "City Parking"],
  "cat-utilities": ["PG&E Electricity", "Comcast Internet", "Water & Sewer", "Verizon Wireless"],
  "cat-entertainment": ["Netflix", "Spotify", "AMC Theatres", "Steam Games", "Museum Pass"],
  "cat-shopping": ["Amazon", "IKEA", "Uniqlo", "Best Buy", "REI Co-op"],
  "cat-health": ["CVS Pharmacy", "Kaiser Copay", "Equinox Gym", "Therapy — Dr. Chen"],
  "cat-income": ["Acme Corp Payroll", "Freelance — Product Design", "Dividends — VTI", "Interest Payment"],
};

const AMOUNT_RANGE: Record<string, [number, number]> = {
  "cat-housing": [1425, 1450],
  "cat-groceries": [18, 130],
  "cat-dining": [6, 72],
  "cat-transport": [9, 64],
  "cat-utilities": [32, 148],
  "cat-entertainment": [9, 42],
  "cat-shopping": [14, 210],
  "cat-health": [12, 145],
  "cat-income": [300, 900],
};

/* ------------------------------------------------------------------ */
/* Transactions — ~90 days, deterministic                              */
/* ------------------------------------------------------------------ */

const EXPENSE_WEIGHTS: Array<[string, number]> = [
  ["cat-groceries", 0.19],
  ["cat-dining", 0.2],
  ["cat-transport", 0.13],
  ["cat-shopping", 0.12],
  ["cat-entertainment", 0.12],
  ["cat-utilities", 0.08],
  ["cat-health", 0.06],
  ["cat-housing", 0.1],
];

function weightedCategory(): string {
  const r = rand();
  let acc = 0;
  for (const [id, w] of EXPENSE_WEIGHTS) {
    acc += w;
    if (r <= acc) return id;
  }
  return "cat-dining";
}

export function buildTransactions(): Transaction[] {
  const txs: Transaction[] = [];
  let seq = 0;
  const today = new Date();

  const push = (
    daysAgo: number,
    categoryId: string,
    type: "income" | "expense",
    amount: number,
    accountId: string,
    status: "completed" | "pending" = "completed",
  ) => {
    seq += 1;
    txs.push({
      id: `tx-base-${seq}`,
      accountId,
      categoryId,
      type,
      amount,
      merchant: pick(MERCHANTS[categoryId]),
      description: pick(MERCHANTS[categoryId]),
      date: format(subDays(today, daysAgo), "yyyy-MM-dd"),
      status,
    });
  };

  for (let d = 89; d >= 0; d -= 1) {
    const dayOfMonth = subDays(today, d).getDate();

    // Paycheck on the 1st and 15th of each month.
    if (dayOfMonth === 1 || dayOfMonth === 15) {
      push(d, "cat-income", "income", 2380, "acc-checking");
    }

    // Rent on the 1st.
    if (dayOfMonth === 1) {
      push(d, "cat-housing", "expense", money(1440, 1450), "acc-checking");
    }

    // Utilities mid-month.
    if (dayOfMonth === 8 || dayOfMonth === 12) {
      push(d, "cat-utilities", "expense", money(34, 140), "acc-checking");
    }

    // Freelance income, a few times a month.
    if ((dayOfMonth === 6 || dayOfMonth === 20) && rand() > 0.35) {
      push(d, "cat-income", "income", money(320, 940), "acc-checking");
    }

    // Dividends / interest into investment & savings.
    if (dayOfMonth === 22) {
      push(d, "cat-income", "income", money(38, 96), "acc-invest");
    }
    if (dayOfMonth === 27) {
      push(d, "cat-income", "income", money(61, 84), "acc-savings");
    }

    // 0–3 everyday expenses.
    const n = rand() < 0.16 ? 0 : rand() < 0.62 ? 1 : rand() < 0.8 ? 2 : 3;
    for (let i = 0; i < n; i += 1) {
      const cat = weightedCategory();
      const [lo, hi] = AMOUNT_RANGE[cat];
      const account =
        cat === "cat-shopping" && rand() > 0.72 ? "acc-savings" : "acc-checking";
      push(d, cat, "expense", money(lo, hi), account);
    }
  }

  // Most recent few settle as pending.
  txs.slice(0, 4).forEach((t) => {
    if (t.type === "expense") t.status = "pending";
  });

  return txs.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/* ------------------------------------------------------------------ */
/* Goals & chart series                                                */
/* ------------------------------------------------------------------ */

function seedContributions(monthly: number, monthsBack: number, salt: number): Contribution[] {
  const rnd = mulberry32(900 + salt * 37);
  const out: Contribution[] = [];
  const today = new Date();
  for (let m = monthsBack; m >= 1; m -= 1) {
    const count = rnd() > 0.55 ? 2 : 1;
    for (let i = 0; i < count; i += 1) {
      const day = 3 + Math.floor(rnd() * 22);
      out.push({
        id: `c-seed-${salt}-${m}-${i}`,
        date: format(set(subMonths(today, m), { date: day }), "yyyy-MM-dd"),
        amount: Math.round((monthly / count) * (0.75 + rnd() * 0.5)),
      });
    }
  }
  // A fresh contribution early in the current month so pace math is live.
  out.push({
    id: `c-seed-${salt}-current`,
    date: format(today, "yyyy-MM-dd"),
    amount: Math.round(monthly * (0.35 + rnd() * 0.3)),
  });
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

const inMonths = (n: number) => format(addMonths(new Date(), n), "yyyy-MM-dd");

export const GOALS: Goal[] = [
  {
    id: "goal-efund",
    name: "Emergency Fund",
    icon: "piggy",
    color: "#0D7E6E",
    target: 15000,
    saved: 12650,
    monthlyPace: 350,
    deadline: inMonths(6),
    contributions: seedContributions(350, 9, 1),
  },
  {
    id: "goal-japan",
    name: "Japan Trip",
    icon: "ticket",
    color: "#F5A623",
    target: 4200,
    saved: 1900,
    monthlyPace: 300,
    deadline: inMonths(8),
    contributions: seedContributions(300, 6, 2),
  },
  {
    id: "goal-home",
    name: "Home Down Payment",
    icon: "home",
    color: "#64748B",
    target: 40000,
    saved: 11200,
    monthlyPace: 900,
    deadline: inMonths(30),
    contributions: seedContributions(900, 11, 3),
  },
  {
    id: "goal-macbook",
    name: "MacBook Pro",
    icon: "bolt",
    color: "#0EA5E9",
    target: 2499,
    saved: 2499,
    monthlyPace: 210,
    deadline: inMonths(1),
    contributions: seedContributions(210, 10, 4),
  },
];

export function buildSeries(): DashboardSeries {
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i -= 1) {
    months.push(format(subMonths(now, i), "MMM"));
  }

  const income = months.map((_, i) =>
    Math.round(4900 + i * 130 + between(-380, 620)),
  );
  const spending = months.map((_, i) =>
    Math.round(3300 + i * 62 + between(-420, 460)),
  );

  const investmentReturns = [
    { label: "US Stocks", value: 9.2 },
    { label: "Intl Stocks", value: 4.1 },
    { label: "Bonds", value: -1.8 },
    { label: "Real Estate", value: 6.4 },
    { label: "Crypto", value: -12.5 },
    { label: "T-Bills", value: 0.9 },
  ];

  const assets: number[] = [];
  const liabilities: number[] = [];
  let a = 76400;
  let l = 15600;
  for (let i = 0; i < 12; i += 1) {
    a *= 1 + between(-0.008, 0.026);
    l *= 1 - between(0.004, 0.014);
    assets.push(Math.round(a));
    liabilities.push(Math.round(l));
  }

  return {
    months,
    income,
    spending,
    investmentReturns,
    netWorth: { months, assets, liabilities },
  };
}
