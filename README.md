```markdown
# Seaside WebBasedPOS

A comprehensive, web-based Point of Sale (POS), inventory management, and public-facing landing page designed specifically for water refilling stations and small retail businesses. Built with **Next.js**, **Supabase**, and **Zustand**.

## Project Overview

This repository contains a full-featured system that handles everything from the front-end sales interface to back-end inventory tracking, customer debt management, shift tracking, and a dynamic public landing page with SEO-optimized resources.

### Key Components & Technologies
- **Framework**: Next.js (React - Pages Router)
- **Backend/Database**: Supabase (PostgreSQL & Storage)
- **State Management**: Zustand (for cart and auth persistence)
- **Data Fetching**: TanStack React Query
- **Styling & UI**: Tailwind CSS with custom utility classes, Framer Motion for animations
- **Hardware Integration**: `react-zxing` for device camera barcode scanning
- **Charts & Formatting**: Chart.js for business analytics, `currency.js` for reliable financial math

## Features

### 🏪 Public Landing Page & CMS
- **Dynamic Front-End**: Responsive landing page with Framer Motion animations.
- **Content Management**: Admins can update business settings (name, links, location map) and manage the image gallery directly from the dashboard.
- **SEO & Content Hub**: Built-in `/resources` section containing SEO-optimized articles about water safety and health.
- **Monetization Ready**: Integrated support for Google AdSense and `ads.txt`.

### 🛒 Point of Sale (POS)
- **Mobile-First POS**: Fully responsive POS interface with a sliding Cart Drawer and Mobile Cart Bar for smaller screens.
- **Barcode Scanning**: Real-time product lookup via device camera integration (ZXing).
- **Custom Sales & Discounts**: Add non-catalog items on the fly and apply percentage or fixed discounts to line items.
- **Flexible Payments**: Supports Cash (with exact change calculator), GCash, Cards, and "Charge to Account" (Utang).

### ⏰ Shift Management (Z-Reading)
- **Cash Drawer Tracking**: Staff must declare starting cash upon login.
- **Z-Reading / End Shift**: Tracks expected cash vs. actual cash, automatically calculating shortages or overages upon shift closure.

### 📦 Inventory Management
- **Stock Tracking & Adjustments**: Automatic stock decrement upon sale and increment upon deletion/refund.
- **Bulk Conversion**: "Break Bulk" feature to convert parent items (e.g., a case) into individual units (e.g., bottles).
- **Spoilage & Loss Reporting**: Track and record damages, theft, or staff consumption.
- **Reorder Alerts**: Dashboard notifications for items falling below minimum stock levels.

### 👥 Customer & User Management
- **Credit Tracking (Utang)**: Manage customer balances with a built-in repayment system.
- **Role-Based Access**: Separate interfaces and permissions for Admin and Staff roles.
- **Inactive Customer Tracking**: Identify and re-engage customers who haven't ordered within a specific period (e.g., 14 days).
- **Demo Mode**: Built-in mock data generation allowing users to test the POS and Admin features without polluting the live database.

## Directory Structure

- `pages/`: Next.js routes (Public Landing, Dashboard, POS, Inventory, History, Reports, and `/resources` for SEO).
- `src/components/`: Reusable UI components, page layouts, charts, and modals.
- `src/hooks/`: Custom React hooks for Supabase mutations, queries, and debouncing.
- `src/store/`: Zustand store logic for global state and shopping cart.
- `src/lib/`: API utilities and Supabase client configuration.
- `public/`: Assets including brand logos, placeholders, and `ads.txt`/`robots.txt`.
- `styles/`: Global CSS and Tailwind configurations.

## Configuration

To run this project, you must set up a Supabase project and provide the following environment variables in a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Storage
Ensure you create the following public storage buckets in your Supabase project:
* `products`: For storing product imagery.
* `gallery`: For the public landing page image carousel and business logo.

### Database Functions (RPCs)
This application heavily relies on PostgreSQL RPC functions for atomicity and complex queries. Ensure your database includes:

**Inventory & Sales:**
* `decrement_stock`
* `increment_stock`
* `break_bulk_stock`
* `update_customer_credit`

**Analytics & Reporting:**
* `get_sales_by_date_summary`
* `get_top_products_summary`
* `get_new_customers_by_date_summary`
* `get_inactive_customers`

**Landing Page Tracking:**
* `increment_page_view`
* `get_page_views`

## Quickstart

1. **Install dependencies**:
```bash
npm install
```

2. **Run development server**:
```bash
npm run dev
```

## Project Roadmap / TODOs

* [ ] Implement actual thermal printer hardware integration (currently stubbed).
* [ ] Add CSV export functionality for all reports and inventory lists.
* [ ] Implement supplier management and purchase order tracking.
* [ ] Add multi-branch data synchronization support.

## License

Copyright © 2025 Seaside POS. SEASIDE™ is a trademark of Seaside, LLC.
```
