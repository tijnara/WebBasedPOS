# Seaside WebBasedPOS

A web-based point-of-sale and operations platform for Seaside Water Refilling Station in Labrador, Pangasinan. The application combines sales, inventory, customer accounts, staff operations, reporting, and the public-facing business website.

**Live site:** [seasidepos.vercel.app](https://seasidepos.vercel.app)

## What the application includes

### Sales and inventory
- POS with a responsive interface, cart management, product search, and barcode scanning using the device camera.
- Cash, GCash, card, and customer-credit payment workflows.
- Product and inventory management, stock adjustments, bulk conversion, and inventory history.
- Sales history and reporting, including sales and product summaries.

### Customers and staff operations
- Customer profiles, account balances, debt tracking, and repayment workflows.
- User and role management, with administrator and staff experiences.
- Shift and salary monitoring, staff incentives, and activity logs.
- Maintenance and vehicle tracking, including global vehicle alerts.
- Demo mode for exploring the application with read-only data.

### Business website and administration
- Public landing, about, contact, gallery, privacy, terms, and resource/article pages.
- Admin pages for products, customers, users, settings, gallery, and article management.
- Expense tracking, dashboard analytics, and report pages.
- Responsive layouts, dark-mode support, and a web app manifest/service worker.

## Technology

- **Application:** Next.js 16, React 19, Pages Router
- **Backend:** Supabase JavaScript client, PostgreSQL, Storage, and database RPCs
- **Client state:** Zustand
- **Data fetching/cache:** TanStack React Query
- **UI:** Tailwind CSS, Framer Motion, Radix UI, and Lucide icons
- **Charts and money formatting:** Chart.js, Recharts, and `currency.js`
- **Other integrations:** `react-zxing`, Vercel Analytics and Speed Insights
- **Testing dependencies:** Jest and React Testing Library

## Repository layout

- `src/pages/` — Next.js routes and API routes
- `src/components/` — shared UI and feature components
- `src/hooks/` — application hooks
- `src/lib/` — Supabase client and application API helpers
- `src/store/` — Zustand state, including cart and session state
- `src/utils/` — shared utilities
- `src/__tests__/` — Jest tests
- `supabase/migrations/` — checked-in database migrations
- `supabase_schema.sql` — base database schema and SQL functions
- `public/` — static assets and web app files
- `styles/` — global and feature styles

## Getting started

### Requirements

- Node.js and npm
- A Supabase project configured with the database objects and storage used by the app

### Install and run

```bash
npm install
cp .env.example .env.local
```

Set the Supabase project values in `.env.local` (see below), then start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Public pages include `/` and `/about`; the POS is at `/pos`, and the dashboard is at `/dashboard`.

Other available package scripts:

```bash
npm run build
npm run start
npm run lint
```

The repository currently has Jest and React Testing Library dependencies and tests under `src/__tests__/`, but no `test` script is declared in `package.json`.

## Configuration and Supabase

The client expects these public environment variables:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Use the Supabase project URL and publishable/anon key. Never put a service-role key or other secret in a `NEXT_PUBLIC_` variable or browser code.

The repository includes a base schema in `supabase_schema.sql` and incremental SQL files in `supabase/migrations/`. Review and apply the schema/migrations to a Supabase project as appropriate for its current state; do not blindly re-run schema changes against a production database. The application calls database RPCs for some operations, so confirm that the functions expected by the current application code are installed. Set up the `products` and `gallery` Storage buckets if using product images or the public gallery.

### Important security notice

The checked-in [security review](SECURITY-REVIEW.md) documents high-severity concerns in the current database schema, including plaintext password handling in the custom user table and overly permissive policies. It also notes that the client calls a `create_new_user` RPC that is not present in the checked-in schema/migrations. Do not treat the existing custom authentication or database policies as production-secure; resolve and independently verify these findings before deploying with real user or business data. Keep Row Level Security and least-privilege authorization enabled and tested for every exposed table and storage bucket.

## Development notes

- Follow the repository guidance in [`AGENTS.md`](AGENTS.md) when working on this project.
- Use `currency.js` (or an equivalent precise money representation) for currency calculations.
- Keep shared application/cart state changes within the existing Zustand store patterns.
- Validate inputs and enforce authorization in trusted backend/database logic; client-side checks are not a security boundary.
- Demo mode is intended to be read-only; the application blocks mutation attempts in its UI/data layer.

## Contributing

1. Create a focused feature branch.
2. Make changes consistent with the existing Pages Router, component, hook, and store patterns.
3. Run the relevant checks (`npm run lint`, `npm run build`, and applicable tests).
4. Open a pull request describing the change, how it was verified, and any required database or environment updates.

For bug reports and feature requests, [open an issue](https://github.com/tijnara/WebBasedPOS/issues).

## License

Copyright © 2025 Seaside POS. SEASIDE™ is a trademark of Seaside, LLC.
