// src/components/TabBar.jsx
import React from 'react';
import { useRouter } from 'next/router';
import { cn } from './ui';
import { CartIcon, PackageIcon, UserIcon, ChartIcon, UsersIcon, DocumentReportIcon } from './Icons'; // Import icons

import { useStore } from '../store/useStore';

// Define the navigation links for the tab bar
const links = [
    { name: 'POS', path: '/', icon: <CartIcon className="h-6 w-6" />, adminOnly: false },
    { name: 'Products', path: '/product-management', icon: <PackageIcon className="h-6 w-6" />, adminOnly: false },
    { name: 'Inventory', path: '/inventory', icon: <PackageIcon className="h-6 w-6" />, adminOnly: false },
    { name: 'Customer', path: '/customer-management', icon: <UserIcon className="h-6 w-6" />, adminOnly: false },
    { name: 'Dashboard', path: '/dashboard', icon: <ChartIcon className="h-6 w-6" />, adminOnly: false },
    { name: 'Sale History', path: '/history', icon: <ChartIcon className="h-6 w-6" />, adminOnly: false },
    { name: 'Users', path: '/user-management', icon: <UsersIcon className="h-6 w-6" />, adminOnly: true },
    { name: 'Report', path: '/report', icon: <DocumentReportIcon className="h-6 w-6" />, adminOnly: true },
];

export default function TabBar() {
    const router = useRouter();
    const user = useStore(s => s.user);

    // Don't show the tab bar on the login page
    if (router.pathname === '/login') {
        return null;
    }

    const visibleLinks = links.filter(link => !link.adminOnly || (user && (user.role === 'Admin' || user.role === 'admin')));

    return (
        // This component uses the .tab-bar class defined in globals.css
        // The CSS handles showing it on mobile and hiding it on desktop (md)
        <div className="tab-bar">
            {visibleLinks.map(link => {
                // Check if the current route matches the link path
                const isActive = router.pathname === link.path;
                return (
                    <button
                        key={link.name}
                        onClick={() => router.push(link.path)}
                        // Use cn utility to conditionally apply the 'active' class
                        className={cn('tab-bar-item', { 'active': isActive })}
                    >
                        {link.icon}
                        <span>{link.name}</span>
                    </button>
                );
            })}
        </div>
    );
}