// src/components/navbar/navConfig.js
import React from 'react';
import {
    CartIcon,
    PackageIcon,
    UserIcon,
    ChartIcon,
    UsersIcon,
    GalleryIcon,
    SettingsIcon,
    DocumentReportIcon,
    MailIcon
} from '../Icons';
import { Landmark, Receipt, TestTube, History } from 'lucide-react';

export const navCategoriesSource = [
    {
        category: null,
        links: [
            { name: 'Dashboard', path: '/dashboard', icon: <ChartIcon className="h-5 w-5 menu-icon" /> },
        ]
    },
    {
        category: 'Sales & Operations',
        links: [
            { name: 'POS', path: '/pos', icon: <CartIcon className="h-5 w-5 menu-icon" /> },
            { name: 'Sale History', path: '/history', icon: <ChartIcon className="h-5 w-5 menu-icon" /> },
            { name: 'Customer', path: '/customer-management', icon: <UserIcon className="h-5 w-5 menu-icon" /> },
            { name: 'Maintenance', path: '/maintenance', icon: <SettingsIcon className="h-5 w-5 menu-icon" /> },
        ]
    },
    {
        category: 'Catalog & Inventory',
        links: [
            { name: 'Products', path: '/product-management', icon: <PackageIcon className="h-5 w-5 menu-icon" /> },
            { name: 'Inventory', path: '/inventory', icon: <PackageIcon className="h-5 w-5 menu-icon" /> },
            { name: 'Gallery', path: '/gallery-management', icon: <GalleryIcon className="h-5 w-5 menu-icon" />, adminOnly: true, hideInDemo: true },
        ]
    },
    {
        category: 'Finance & Analytics',
        links: [
            { name: 'Expenses', path: '/expenses', icon: <Receipt className="h-6 w-6" /> },
            { name: 'Salary', path: '/salary-monitoring', icon: <UserIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
            { name: 'Debt Management', path: '/debt-management', icon: <Landmark className="h-6 w-6" />, adminOnly: true },
            { name: 'Report', path: '/report', icon: <ChartIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
            { name: 'Mock Sales', path: '/mock-sales-report', icon: <TestTube className="h-6 w-6" />, adminOnly: true },
        ]
    },
    {
        category: 'Administration & Content',
        links: [
            { name: 'Users', path: '/user-management', icon: <UsersIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
            { name: 'Staff Approvals', path: '/admin/user-approvals', icon: <UsersIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
            { name: 'Articles', path: '/article-management', icon: <DocumentReportIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
            { name: 'Activity Logs', path: '/activity-logs', icon: <History className="h-5 w-5 menu-icon" />, adminOnly: true },
            { name: 'Page Settings', path: '/settings', icon: <SettingsIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
            { name: 'Messages', path: '/Messages', icon: <MailIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
        ]
    },
];

export default navCategoriesSource;