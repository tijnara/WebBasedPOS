```markdown
# Seaside WebBasedPOS

A comprehensive, web-based Point of Sale (POS) and inventory management application designed for water refilling stations and small retail businesses. Built with **Next.js**, **Supabase**, and **Zustand**.

## Project Overview

This repository contains a full-featured POS system that handles everything from the front-end sales interface to back-end inventory tracking and customer debt management.

### Key Components & Technologies
- **Framework**: Next.js (React)
- **Backend/Database**: Supabase (PostgreSQL)
- **State Management**: Zustand (for cart and auth persistence)
- **Data Fetching**: TanStack React Query
- **Styling**: Modern CSS with custom utility classes and responsive design
- **Testing**: Playwright for end-to-end flow validation
- **Charts**: Chart.js for business analytics

## Features

### 🛒 Point of Sale (POS)
- **Product Grid**: Responsive grid with categories and stock-level indicators.
- **Barcode Scanning**: Real-time product lookup via barcode scanner integration.
- **Custom Sales**: Ability to add non-catalog items directly to a sale.
- **Flexible Payments**: Supports Cash, GCash, Cards, and "Charge to Account" (Utang).

### 📦 Inventory Management
- **Stock Tracking**: Automatic stock decrement upon sale.
- **Bulk Conversion**: "Break Bulk" feature to convert parent items (e.g., a case) into individual units.
- **Reorder Alerts**: Dashboard notifications for items falling below minimum stock levels.
- **Loss Reporting**: Track and record spoilage, damage, or staff consumption.

### 👥 Customer & User Management
- **Credit Tracking (Utang)**: Manage customer balances with a built-in repayment system.
- **Role-Based Access**: Separate interfaces and permissions for Admin and Staff roles.
- **Session Persistence**: User sessions and cart data persist across page refreshes via local storage.

### 📊 Reporting & Analytics
- **Sales Trends**: Weekly and daily sales visualizations.
- **Performance Summaries**: Total revenue, customer growth, and top-selling product reports.
- **Inactive Customer Tracking**: Identify customers who haven't ordered within a specific period (e.g., 14 days).

## Directory Structure

- `pages/`: Next.js routes (Dashboard, POS, Inventory, History, Reports, etc.).
- `src/components/`: Reusable UI components, modals, and page layouts.
- `src/hooks/`: Custom React hooks for Supabase mutations and queries.
- `src/store/`: Zustand store logic for global state.
- `src/lib/`: API utilities and Supabase client configuration.
- `public/`: Assets including the Seaside brand logo and product placeholders.
- `tests/`: End-to-end testing scripts using Playwright.

## Configuration

To run this project, you must set up a Supabase project and provide the following environment variables in a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

```

### Database Functions

Several features (like stock decrement and credit updates) rely on Supabase RPC functions. Ensure your database includes:

* `decrement_stock`
* `update_customer_credit`
* `break_bulk_stock`

## Quickstart

1. **Install dependencies**:
```bash
npm install

```


2. **Run development server**:
```bash
npm run dev

```


3. **Run E2E tests**:
```bash
npx playwright test

```



## Project Roadmap / TODOs

* [ ] Implement actual thermal printer integration for receipts.
* [ ] Add CSV export functionality for all reports.
* [ ] Implement supplier management and purchase order tracking.
* [ ] Add multi-branch data synchronization support.

## License

Copyright © 2025 Seaside POS. SEASIDE™ is a trademark of Seaside, LLC.

```

```
