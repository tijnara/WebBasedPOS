```markdown
# Seaside WebBasedPOS

A comprehensive, web-based Point of Sale (POS), inventory management, expense tracking, staff incentives, and public-facing landing page designed specifically for water refilling stations and small retail businesses. Built with **Next.js**, **Supabase**, and modern React best practices.

## Project Overview

This repository contains a full-featured business management system that handles everything from the front-end sales interface to back-end inventory tracking, customer debt management, shift tracking, staff payouts, expense management, and a dynamic public landing page. Whether you're managing a small retail shop or a water refilling station, Seaside POS provides all the tools needed to streamline operations and maximize profitability.

### Key Components & Technologies
- **Framework**: Next.js (React - Pages Router)
- **Backend/Database**: Supabase (PostgreSQL & Storage)
- **State Management**: Zustand (for cart and auth persistence)
- **Data Fetching**: TanStack React Query
- **Styling & UI**: Tailwind CSS with custom utility classes, Framer Motion for animations
- **Hardware Integration**: `react-zxing` for device camera barcode scanning
- **Charts & Formatting**: Chart.js for business analytics, `currency.js` for reliable financial math
- **Forms & Validation**: React Hook Form for efficient form handling
- **Real-time Communication**: Supabase Realtime for live updates

## Features

### 🏪 Public Landing Page & CMS
- **Dynamic Front-End**: Responsive landing page with Framer Motion animations.
- **Content Management**: Admins can update business settings (name, links, location map) and manage the image gallery directly from the dashboard.
- **SEO & Content Hub**: Built-in `/resources` section containing SEO-optimized articles about water safety and health.
- **Monetization Ready**: Integrated support for Google AdSense, PropellerAds, and `ads.txt`.
- **Page Analytics**: Track page views and visitor engagement with integrated analytics.

### 🛒 Point of Sale (POS)
- **Mobile-First POS**: Fully responsive POS interface with a sliding Cart Drawer and Mobile Cart Bar for smaller screens.
- **Barcode Scanning**: Real-time product lookup via device camera integration (ZXing).
- **Custom Sales & Discounts**: Add non-catalog items on the fly and apply percentage or fixed discounts to line items.
- **Flexible Payments**: Supports Cash (with exact change calculator), GCash, Cards, and "Charge to Account" (Utang).
- **Transaction History**: Complete audit trail of all sales with timestamps and operator details.

### ⏰ Shift Management (Z-Reading)
- **Cash Drawer Tracking**: Staff must declare starting cash upon login.
- **Z-Reading / End Shift**: Tracks expected cash vs. actual cash, automatically calculating shortages or overages upon shift closure.
- **Shift Reports**: Detailed shift summaries with breakdown by payment method and sales category.

### 📦 Inventory Management
- **Stock Tracking & Adjustments**: Automatic stock decrement upon sale and increment upon deletion/refund.
- **Bulk Conversion**: "Break Bulk" feature to convert parent items (e.g., a case) into individual units (e.g., bottles).
- **Spoilage & Loss Reporting**: Track and record damages, theft, or staff consumption.
- **Reorder Alerts**: Dashboard notifications for items falling below minimum stock levels.
- **Stock History**: Complete audit trail of all inventory movements with timestamps.

### 👥 Customer & User Management
- **Credit Tracking (Utang)**: Manage customer balances with a built-in repayment system.
- **Role-Based Access**: Separate interfaces and permissions for Admin and Staff roles.
- **Inactive Customer Tracking**: Identify and re-engage customers who haven't ordered within a specific period (e.g., 14 days).
- **Customer Profiles**: Detailed customer information with transaction history and payment status.
- **Demo Mode**: Built-in mock data generation allowing users to test the POS and Admin features without polluting the live database.

### 💰 Financial Management & Expense Tracking
- **Expense Categories**: Create and manage expense categories with daily recurring options.
- **Expense Logging**: Record all business expenses with dates, amounts, descriptions, and categorization.
- **Auto-Sync Recurring Expenses**: Daily recurring expenses are automatically created and synced.
- **Financial Reports**: View expenses by category, date range, and time period.
- **Cash Flow Tracking**: Monitor incoming revenue vs. outgoing expenses for better financial insights.

### 🎯 Staff Incentives & Payouts
- **Weekly Incentive Calculations**: Automatically calculate staff incentives based on sales performance.
- **Payout Management**: Record and track staff payouts with detailed history and date tracking.
- **Pagination & Filtering**: Efficiently browse through large incentive histories with server-side pagination.
- **Incentive Ledger**: Complete audit trail of all incentive calculations and payouts.
- **Performance Metrics**: Track individual staff member performance and payout contributions.

## Directory Structure

- `pages/`: Next.js routes (Public Landing, Dashboard, POS, Inventory, History, Reports, Expenses, Incentives, and `/resources` for SEO).
- `src/components/`: Reusable UI components, page layouts, charts, and modals.
- `src/hooks/`: Custom React hooks for Supabase mutations, queries, debouncing, and data management.
- `src/store/`: Zustand store logic for global state and shopping cart.
- `src/lib/`: API utilities and Supabase client configuration.
- `public/`: Assets including brand logos, placeholders, `ads.txt`, `robots.txt`, and service worker configuration.
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

**Expenses & Incentives:**
* `get_expense_summary`
* `calculate_staff_incentives`

## Quickstart

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
Create a `.env.local` file with your Supabase credentials (see Configuration section above).

3. **Run development server**:
```bash
npm run dev
```

4. **Access the application**:
- POS Interface: `http://localhost:3000/pos`
- Admin Dashboard: `http://localhost:3000/dashboard`
- Landing Page: `http://localhost:3000`

## Troubleshooting

### Database Connection Issues
- Verify your Supabase URL and anon key are correct in `.env.local`
- Ensure your Supabase project is active and not paused
- Check Row-Level Security (RLS) policies are properly configured

### Barcode Scanner Not Working
- Ensure HTTPS or localhost (for development)
- Check browser camera permissions
- Verify `react-zxing` is properly installed and imported

### Missing Features or Empty Data
- Run database migrations if upgrading from an older version
- Verify all required RPC functions are created in your Supabase database
- Check that storage buckets (`products`, `gallery`) exist and are public

### Performance Issues
- Enable pagination for large datasets (already implemented for incentives and inventory)
- Use TanStack React Query's cache settings appropriately
- Consider database indexes on frequently queried columns

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes and test thoroughly
3. Commit with clear, descriptive messages
4. Push to your branch and create a Pull Request
5. Ensure all tests pass before requesting review

### Code Standards
- Use consistent naming conventions (camelCase for variables/functions, PascalCase for components)
- Add comments for complex logic
- Keep components modular and reusable
- Write meaningful commit messages

## Project Roadmap / TODOs

### Completed ✅
* [x] Expense tracking and categorization
* [x] Staff incentives and payout management
* [x] Daily recurring expenses with auto-sync
* [x] Pagination for large datasets
* [x] Enhanced UI/UX improvements

### In Progress 🔄
* [ ] CSV export functionality for all reports and inventory lists
* [ ] Real-time inventory sync across multiple devices

### Planned Features 📋
* [ ] Implement actual thermal printer hardware integration
* [ ] Supplier management and purchase order tracking
* [ ] Multi-branch data synchronization support
* [ ] Advanced analytics and business intelligence dashboards
* [ ] Mobile app companion (React Native)
* [ ] SMS notifications for low stock and customer balances
* [ ] Barcode label generation and printing
* [ ] Advanced customer segmentation and targeting

## License

Copyright © 2025 Seaside POS. SEASIDE™ is a trademark of Seaside, LLC.

## Support

For issues, questions, or feature requests, please open an issue on the [GitHub repository](https://github.com/tijnara/WebBasedPOS).

---

**Live Demo**: [https://seasidepos.vercel.app](https://seasidepos.vercel.app)
```