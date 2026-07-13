# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Seaside WebBasedPOS is a Next.js + Supabase point-of-sale, inventory, expense, debt, and staff-incentive management system for a water-refilling/retail business, plus a public-facing marketing landing page.

## Commands

```bash
npm run dev     # start Next.js dev server (http://localhost:3000)
npm run build   # production build
npm run start   # run production build
npm run lint    # next lint
```

There is no test script and no Jest config file, even though `jest`, `jest-environment-jsdom`, and `@testing-library/react` are installed as devDependencies and no test files currently exist. If asked to add tests, a `jest.config.js` needs to be created first.

Required env vars (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

No path aliases are configured (no `jsconfig.json`/`tsconfig.json`) — all imports are relative.

## Architecture

**Router**: Next.js Pages Router, rooted at `src/pages/` (not `src/app/` — the one folder under `src/app/` is stale/unused, ignore it).

**Route files are thin wrappers around page components** — this is the key structural pattern to know:
- `src/pages/expenses.js` — a route file, just imports and re-exports a component
- `src/components/pages/ExpensesPage.jsx` — the actual page component with all UI/business logic

When asked to change a "page," the real logic almost always lives in `src/components/pages/*.jsx`, not in `src/pages/*.js`.

Other `src/` directories:
- `src/components/` — besides `pages/`, organized by feature: `dashboard/`, `customers/`, `pos/`, `charts/`, `landing/`, `ui/`
- `src/hooks/` — ~33 custom hooks, one per data domain (e.g. `useExpenses`, `useCustomers`, `useProducts`), each wrapping Supabase queries/mutations in TanStack React Query
- `src/store/useStore.js` — single Zustand store for client state: current sale/cart, current customer, auth user, toasts, dark mode. Only `user` and `darkMode` are persisted to localStorage (key `pos_custom_user`)
- `src/lib/supabaseClient.js` — the one Supabase client singleton; import this rather than creating new clients
- `src/lib/api.js` — auth/login utilities
- `src/config/constants.js` — app-wide constants

**Data flow**: server state goes through React Query hooks in `src/hooks/`, calling Supabase directly (no separate API/backend layer — Supabase is the backend, with business logic living in Postgres RPC functions listed in the README, e.g. `decrement_stock`, `break_bulk_stock`, `calculate_staff_incentives`). Client/UI state goes through the single Zustand store. There is no React Context usage for global state.

**`src/pages/_app.js`** is the composition root: sets up `QueryClientProvider` (7-day `gcTime`, 5-min `staleTime`), an `AuthGate` that redirects unauthenticated users except on public routes (`/`, `/login`, `/terms`, `/privacy`, `/contact`, `/resources/*`), a 15-minute idle timeout that logs users out, and a `MutationCache` guard that blocks all writes when `user.isDemo` is true (demo mode is app-wide read-only, enforced centrally rather than per-mutation).

**Financial math** uses `currency.js` rather than raw floats/JS numbers — follow this convention wherever money is calculated or displayed.
