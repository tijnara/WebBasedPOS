# Project Context & Rules: Seaside WebBasedPOS

## Tech Stack
- **Framework:** Next.js (Pages Router - located in `/pages`).
- **Styling:** Tailwind CSS + Global CSS variables (located in `styles/globals.css`).
- **Database/Backend:** Supabase (PostgreSQL RPCs & Storage).
- **State Management:** Zustand (for Auth, Cart, and Toast persistence).
- **Icons:** Lucide React and custom SVG components in `src/components/Icons.jsx`.

## UI & Branding Rules
- **Primary Brand Color:** Apple Green (`#8DB600`).
- **Sidebar Theme:**
    - Background: White (`#ffffff`).
    - Text Color: Black (`#000000`).
    - Hover/Active State: Background `Apple Green` (`#8DB600`), Text `White` (`#ffffff`).
- **Responsiveness:** Always ensure components are wrapped with or utilize the `.responsive-page` class. Use `md:hidden` or `hidden md:block` for device-specific layouts.

## Coding Standards
- **Components:** Use functional components with Hooks. Keep UI components in `src/components/` and page-level logic in `src/components/pages/`.
- **Data Fetching:** Prioritize TanStack React Query for all server-state interactions.
- **Financial Logic:** Use `currency.js` for any calculations involving prices, totals, or balances to avoid floating-point errors.
- **Real-time:** Implement Supabase Realtime subscriptions where relevant (e.g., Inventory, Notes).

## File Structure Reference
- Hooks: `src/hooks/` (Use these for mutations and queries).
- Store: `src/store/useStore.js`.
- Shared UI: `src/components/ui.js` (Button, Input, Card, Dialog).
- Assets: `/public` for brand imagery.