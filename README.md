# Ledgerline Finance OS

Ledgerline is a personal finance dashboard built with React, TypeScript, Vite, Tailwind CSS, React Router, and Redux Toolkit. It provides a polished demo experience for tracking accounts, transactions, goals, spending categories, cash flow, and net worth.

This project is currently a **front-end demo**. It does not connect to a bank, brokerage, authentication provider, or remote database. Seed data is generated in the browser and user-created changes are stored in `localStorage`.

## Contents

- [Getting Started](#getting-started)
- [Available Commands](#available-commands)
- [Application Overview](#application-overview)
- [Project Structure](#project-structure)
- [How Data Flows](#how-data-flows)
- [State Management](#state-management)
- [Persistence and Demo Data](#persistence-and-demo-data)
- [Main User Flows](#main-user-flows)
- [Adding or Changing Features](#adding-or-changing-features)
- [Styling and UI Conventions](#styling-and-ui-conventions)
- [Troubleshooting](#troubleshooting)
- [Production Considerations](#production-considerations)

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- A modern browser with JavaScript and `localStorage` enabled

### Install and run

From the project root:

```bash
npm install
npm run dev
```

Vite serves the app at [http://localhost:3000](http://localhost:3000). The Vite server is configured with `strictPort: true`, so port `3000` must be available.

To create a production build:

```bash
npm run build
```

The output is written to `dist/`. Because the app uses `HashRouter`, the built site can be hosted from static storage without server-side route rewrites.

## Available Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies from `package.json` and `package-lock.json`. |
| `npm run dev` | Start the Vite development server on port `3000`. |
| `npm run typecheck` | Run TypeScript checking without emitting files. |
| `npm run build` | Typecheck through the Vite build and create the production bundle. |

There is currently no automated test script in `package.json`. Before opening a pull request, run at least `npm run typecheck` and `npm run build`, then manually exercise the affected flow in the browser.

## Application Overview

The app has four routed pages:

| Route | Page | Responsibility |
| --- | --- | --- |
| `/` | Overview | Account balances, monthly totals, recent transactions, quick add, goals snapshot, and top categories. |
| `/analytics` | Analytics | KPI summary plus charts for income, spending, allocation, investment returns, and net worth. |
| `/transactions` | Transactions | Searchable, filterable, sortable, paginated transaction list with delete actions. |
| `/goals` | Goals | Savings goals, progress, contributions, goal creation, and goal deletion. |

Navigation uses hash URLs in the browser, for example `/#/analytics`. `HashRouter` is configured in `src/App.tsx`.

The desktop layout uses a fixed sidebar. Smaller screens use the header and mobile tab bar. The shared Add action is handled in `Shell` and either scrolls to the Overview quick-add widget or opens the add sheet, depending on the current route and viewport.

## Project Structure

```text
.
├── index.html                 Vite HTML entry point
├── package.json               Scripts and dependencies
├── tsconfig.json              TypeScript configuration
├── vite.config.js             Vite, React, Tailwind, and dev-server setup
├── src/
│   ├── main.tsx               React DOM bootstrap and global CSS import
│   ├── App.tsx                Redux provider, router, shell, routes, add sheet
│   ├── types.ts               Shared domain and UI TypeScript types
│   ├── index.css              Tailwind theme tokens, global styles, animations
│   ├── components/
│   │   ├── Header.tsx          Responsive header, navigation, account menu
│   │   ├── Sidebar.tsx         Desktop navigation, Add action, account menu
│   │   ├── MobileTabBar.tsx    Mobile navigation and Add action
│   │   ├── ui.tsx              Shared UI primitives such as Reveal and Skeleton
│   │   ├── widgets.tsx         WidgetCard, QuickAddForm, goals, category widgets
│   │   ├── icons.tsx           Icon name mapping and icon rendering
│   │   ├── BalanceSection.tsx  Account balance presentation
│   │   ├── ChartsSection.tsx   Chart.js and Recharts visualizations
│   │   ├── GoalsSection.tsx    Goals board UI and goal actions
│   │   └── TransactionsSection.tsx Transaction table UI
│   ├── pages/
│   │   ├── OverviewPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── TransactionsPage.tsx
│   │   └── GoalsPage.tsx
│   ├── redux/
│   │   └── store.ts            Store, slices, thunks, selectors, typed hooks
│   ├── services/
│   │   ├── mockApi.ts          Browser persistence and simulated API methods
│   │   └── mockData.ts          Seed accounts, categories, goals, transactions, charts
│   └── utils/
│       └── format.ts            Currency, date, class-name, and random helpers
└── README.md
```

## How Data Flows

The startup flow is:

1. `src/main.tsx` mounts `App` and imports the global stylesheet.
2. `App` wraps the UI in the Redux `Provider` and `HashRouter`.
3. `Shell` dispatches `initializeDashboard()` once on mount.
4. The thunk calls `api.fetchDashboard()` in `src/services/mockApi.ts`.
5. The mock API combines generated baseline data with browser-persisted additions and deletions.
6. Redux stores the returned normalized data in the relevant slices.
7. Pages select the data and render their sections and widgets.

The mock API deliberately adds a short artificial delay. This allows loading skeletons, optimistic updates, and error/recovery paths to be exercised during development.

When a user adds a transaction:

1. `QuickAddForm` validates the fields.
2. It creates a `Transaction` object and dispatches `transactionAdded` immediately.
3. `submitTransaction` calls `api.addTransaction` and writes the transaction to `localStorage`.
4. On success, the transaction status becomes `completed` and a toast is shown.
5. On failure, the optimistic transaction is removed and an error toast is shown.

Goal contributions, goal creation, and goal deletion use the same general optimistic-update pattern. The relevant thunks are `contributeToGoal`, `createGoal`, and `deleteGoal` in `src/redux/store.ts`.

## State Management

Redux state is configured in `src/redux/store.ts`. The store contains these slices:

| Slice | Contains |
| --- | --- |
| `auth` | Demo user identity used by the account menus. |
| `accounts` | Account records and loading state. |
| `categories` | Category records and display metadata. |
| `charts` | The generated analytics series. |
| `goals` | Goals, contributions, loading state, and optimistic goal updates. |
| `transactions` | Normalized transactions, filters, sorting, pagination, and loading state. |
| `ui` | Sidebar state, add-sheet state, selected account, and toast messages. |

Use the typed hooks exported by the store:

```tsx
const dispatch = useAppDispatch();
const goals = useAppSelector((state) => state.goals);
```

Do not access the untyped React Redux hooks in components. Add new cross-page state to the appropriate slice; keep temporary form state local to the component that owns the form.

Useful selectors include:

- `selectVisibleTransactions`: applies account, search, category, type, and sort filters.
- `selectMonthTotals`: calculates current-month income and spending.

Amounts are stored as positive numbers. Transaction direction is represented by `type`, which is either `income` or `expense`.

## Persistence and Demo Data

### Browser storage keys

`src/services/mockApi.ts` uses these keys:

| Key | Contents |
| --- | --- |
| `ledgerline.tx.v1` | User-added transactions. |
| `ledgerline.deleted.v1` | IDs of deleted baseline transactions. |
| `ledgerline.goals.v1` | The current goal list and contribution history. |

The baseline accounts, categories, and chart series are not persisted. They are recreated from source each time. Baseline transactions are generated for roughly 90 days by `buildTransactions()`, using a deterministic random generator with dates relative to the current day.

The account menu's **Reset demo data** action removes all three storage keys, then reloads the dashboard state. To reset manually, open browser developer tools and run:

```js
localStorage.removeItem("ledgerline.tx.v1");
localStorage.removeItem("ledgerline.deleted.v1");
localStorage.removeItem("ledgerline.goals.v1");
location.reload();
```

`mockApi.ts` catches storage failures and continues in memory. This makes the demo usable in restricted browser contexts, but changes will not survive a reload in that case.

### Changing seed data

Edit `src/services/mockData.ts` when changing the demo dataset:

- `ACCOUNTS` controls account names, balances, institutions, trends, and sparklines.
- `CATEGORIES` controls category IDs, names, colors, icons, and budgets.
- `buildTransactions()` controls generated transaction rules and merchants.
- `GOALS` controls initial savings goals.
- `buildSeries()` controls analytics chart series.

Keep IDs stable when possible. Components and persisted records use IDs to connect transactions to accounts and categories.

## Main User Flows

### Add a transaction

Use the Add button in the sidebar, header, or mobile tab bar. On the Overview desktop layout, it focuses the inline Quick Add widget. In other contexts it opens the add sheet.

`QuickAddForm` requires:

- A description with at least two characters
- An amount greater than zero and no greater than `10,000,000`
- A category for expenses
- A date that is not in the future
- An account

Income transactions automatically use the `cat-income` category.

### Filter and sort transactions

The Transactions page stores search, category, type, sort, and page settings in the transactions slice. Filter changes reset the page to `1`. If a new filter or sort option is added, update the slice action and the selector that consumes it.

### Manage goals

Goals can be contributed to, created, and deleted. Goal progress is capped at the target. Contributions are stored with an ISO date and amount and are limited by the current goal update logic to the most recent 40 entries.

### Export data

The account menu exports the currently stored transaction list as `ledgerline-transactions.json`. This is a client-side download and does not include accounts, goals, or chart data.

## Adding or Changing Features

### Add a new route

1. Create a page in `src/pages/`.
2. Add a lazy import and `<Route>` in `src/App.tsx`.
3. Add a matching item to `NAV_ITEMS` in `src/components/Header.tsx`.
4. Confirm the active navigation ID matches the route.
5. Add loading UI if the page uses lazy-loaded or asynchronous content.

### Add a new persisted entity

1. Add the entity interface to `src/types.ts`.
2. Add seed data to `src/services/mockData.ts` if the demo needs initial records.
3. Add a local-storage key and read/write functions in `src/services/mockApi.ts`.
4. Add API methods and async thunks in `src/redux/store.ts`.
5. Add a normalized slice or extend the appropriate existing slice.
6. Add optimistic rollback behavior when the UI updates before persistence.
7. Add a reset path in `resetDemoData()`.

### Add a reusable UI component

Shared primitives belong in `src/components/ui.tsx`. Domain widgets belong in `src/components/widgets.tsx` or the nearest domain-specific section. Prefer existing helpers such as `WidgetCard`, `Reveal`, `Skeleton`, `RingGauge`, `Icon`, `cx`, and the currency formatting functions before introducing another abstraction.

### Add an icon

Icons are centralized in `src/components/icons.tsx`. Add the icon to the existing name/type mapping there, then use it with `<Icon name="..." />`. Do not scatter inline icon implementations through feature components unless the icon is genuinely one-off.

## Styling and UI Conventions

The project uses Tailwind CSS v4 through the Vite plugin. Design tokens are declared in the `@theme` block in `src/index.css`, including:

- `canvas`, `surface`, `ink`, `soft`, and `line` neutrals
- `brand-*` teal colors
- `gold-*` accent colors
- `gain-*` and `loss-*` semantic colors
- Shared small, medium, and large shadows

Use the existing tokens instead of adding arbitrary hex values to components. Global animations and reduced-motion behavior also live in `src/index.css`.

The interface is responsive:

- `lg` layouts use the fixed desktop sidebar.
- Smaller layouts use the responsive header and bottom tab bar.
- The add sheet works as a bottom sheet on small screens and a centered dialog on larger screens.

When changing a layout, check at least a narrow mobile viewport and a desktop viewport. Preserve accessible labels, `aria-current`, `aria-expanded`, `aria-invalid`, and dialog semantics on interactive controls.

## Troubleshooting

### The app does not start

- Confirm Node.js is installed with `node --version`.
- Run `npm install` again if dependencies are missing.
- Check whether another process is using port `3000`; the Vite config requires that exact port.

### The screen is empty or shows old data

Open the browser console for errors, then reset the demo storage keys listed above. A stale persisted goal or transaction shape may also need to be removed after changing its TypeScript interface.

### TypeScript errors after a data-model change

Run:

```bash
npm run typecheck
```

Check every consumer of the changed interface, especially selectors, mock API normalization, forms, and table/chart components.

### A route fails after static deployment

Use the hash URL format, such as `/#/goals`. This project uses `HashRouter`, so the hosting platform does not need SPA history fallback configuration.

### Changes disappear after refresh

Only transactions added through the mock API and goals saved through the mock API are persisted. Accounts, categories, and chart series are seed data and are rebuilt on startup.

## Production Considerations

This repository is not production-ready for real financial data. Before using it with real users, the next implementation should address:

- Authentication and authorization
- A server-side database and API instead of browser-only storage
- Bank and brokerage integrations with secure token handling
- Server-side validation and audit history
- Encryption and privacy controls for financial data
- Reliable error reporting, retries, and offline behavior
- Automated unit, integration, and end-to-end tests
- Accessibility testing and browser compatibility testing
- Real currency, locale, timezone, and rounding rules
- Deployment configuration, environment variables, and CI checks

Never put banking credentials, private API keys, or production secrets in this repository or in Vite client-side environment variables. Anything bundled into the browser should be treated as public.

## Development Checklist

Before handing work to the next person or opening a pull request:

```bash
npm run typecheck
npm run build
```

Then verify the affected route, loading state, success state, validation errors, failure or rollback state, responsive layout, and demo reset behavior. Keep changes focused and update this README when the project architecture or setup process changes.
