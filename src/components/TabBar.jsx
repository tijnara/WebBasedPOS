// src/components/TabBar.jsx
import React from 'react';
import { useRouter } from 'next/router';
import { cn } from './ui';
import { CartIcon, PackageIcon, ChartIcon, DocumentReportIcon } from './Icons';
import { Receipt } from 'lucide-react';

import { useStore } from '../store/useStore';

const links = [
    { name: 'POS', path: '/pos', icon: <CartIcon className="h-6 w-6" />, adminOnly: false },
    { name: 'Salary', path: '/salary-monitoring', icon: <Receipt className="h-6 w-6" />, adminOnly: true },
    { name: 'Inventory', path: '/inventory', icon: <PackageIcon className="h-6 w-6" />, adminOnly: false },
    { name: 'Dashboard', path: '/dashboard', icon: <ChartIcon className="h-6 w-6" />, adminOnly: false },
    { name: 'Sale History', path: '/history', icon: <ChartIcon className="h-6 w-6" />, adminOnly: false },
    { name: 'Expenses', path: '/expenses', icon: <Receipt className="h-6 w-6" />, adminOnly: false },
    { name: 'Report', path: '/report', icon: <DocumentReportIcon className="h-6 w-6" />, adminOnly: true },
];

export default function TabBar() {
    const router = useRouter();
    const user = useStore(s => s.user);

    // Don't show the tab bar on the login page AND landing page ('/')
    if (router.pathname === '/login' || router.pathname === '/') {
        return null;
    }

    const visibleLinks = links.filter(link => !link.adminOnly || (user && (user.role === 'Admin' || user.role === 'admin')));

    return (
        <div className="tab-bar">
            {visibleLinks.map(link => {
                const isActive = router.pathname === link.path;
                return (
                    <button
                        key={link.name}
                        onClick={() => router.push(link.path)}
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