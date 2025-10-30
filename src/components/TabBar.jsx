// src/components/TabBar.jsx
import React from 'react';
import { useRouter } from 'next/router';
import { cn } from './ui';
import { CartIcon, PackageIcon, UserIcon, ChartIcon, UsersIcon } from './Icons'; // Import icons

// Define the navigation links for the tab bar
const links = [
    { name: 'POS', path: '/', icon: <CartIcon className="h-6 w-6" /> },
    { name: 'Products', path: '/product-management', icon: <PackageIcon className="h-6 w-6" /> },
    { name: 'Customer', path: '/customer-management', icon: <UserIcon className="h-6 w-6" /> },
    { name: 'Dashboard', path: '/dashboard', icon: <ChartIcon className="h-6 w-6" /> },
    { name: 'Sale History', path: '/history', icon: <ChartIcon className="h-6 w-6" /> },
    { name: 'Users', path: '/user-management', icon: <UsersIcon className="h-6 w-6" /> },
];

export default function TabBar() {
    const router = useRouter();

    return (
        // This component uses the .tab-bar class defined in globals.css
        // The CSS handles showing it on mobile and hiding it on desktop (md)
        <div className="tab-bar">
            {links.map(link => {
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