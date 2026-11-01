// src/components/TabBar.jsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
import {
    CartIcon,
    ChartIcon,
    DocumentReportIcon
} from './Icons';
import { Receipt, History, Menu } from 'lucide-react';

export default function TabBar() {
    const router = useRouter();
    const user = useStore(state => state.user);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Comprehensive Admin / Owner resolution
    const isAdmin = Boolean(
        user && (
            user.isadmin === true ||
            user.isAdmin === true ||
            user.role?.toLowerCase() === 'admin' ||
            user.role?.name?.toLowerCase() === 'admin'
        )
    );
    const isDemo = Boolean(user?.isDemo);

    // Primary 4 Tabs based on role
    const primaryTabs = [
        {
            name: 'POS',
            path: '/pos',
            icon: CartIcon
        },
        {
            name: 'Dashboard',
            path: '/dashboard',
            icon: ChartIcon
        },
        {
            name: 'Expenses',
            path: '/expenses',
            icon: Receipt
        },
        {
            name: (isAdmin || isDemo) ? 'Report' : 'History',
            path: (isAdmin || isDemo) ? '/report' : '/history',
            icon: (isAdmin || isDemo) ? DocumentReportIcon : History
        }
    ];

    // Check if user is on a secondary page accessed via the drawer
    const isMoreActive = mounted && !primaryTabs.some(tab => router.pathname === tab.path);

    // Triggers the off-canvas drawer
    const handleOpenMore = () => {
        const hamburgerBtn = document.querySelector('[aria-label="Open Navigation Drawer"]');
        if (hamburgerBtn) {
            hamburgerBtn.click();
        } else {
            window.dispatchEvent(new CustomEvent('open-mobile-drawer'));
        }
    };

    if (!mounted) return null;

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 h-16 px-2 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
            aria-label="Mobile Bottom Navigation"
        >
            <div className="flex items-center justify-around h-full max-w-md mx-auto">
                {/* 4 Core Operational Tabs */}
                {primaryTabs.map(item => {
                    const isActive = router.pathname === item.path;
                    const IconComponent = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.path}
                            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-150 group select-none ${
                                isActive
                                    ? 'text-[#5f7d00] dark:text-lime-400 font-extrabold'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-semibold'
                            }`}
                        >
                            <div className={`p-1 rounded-lg transition-transform duration-150 ${isActive ? 'scale-110 bg-lime-50 dark:bg-lime-950/40' : 'group-active:scale-95'}`}>
                                <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                            </div>
                            <span className="text-[10px] leading-tight tracking-tight text-center mt-0.5">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}

                {/* 5th Tab: Drawer Trigger */}
                <button
                    type="button"
                    onClick={handleOpenMore}
                    className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-150 group select-none ${
                        isMoreActive
                            ? 'text-[#5f7d00] dark:text-lime-400 font-extrabold'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-semibold'
                    }`}
                    aria-label="More Navigation Options"
                >
                    <div className={`p-1 rounded-lg transition-transform duration-150 ${isMoreActive ? 'scale-110 bg-lime-50 dark:bg-lime-950/40' : 'group-active:scale-95'}`}>
                        <Menu className={`w-5 h-5 ${isMoreActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                    </div>
                    <span className="text-[10px] leading-tight tracking-tight text-center mt-0.5">
                        More
                    </span>
                </button>
            </div>
        </nav>
    );
}