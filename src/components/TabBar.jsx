// src/components/TabBar.jsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
import {
    CartIcon,
    ChartIcon,
    DocumentReportIcon,
    UserIcon
} from './Icons';
import { Receipt } from 'lucide-react';

export default function TabBar() {
    const router = useRouter();
    const user = useStore(state => state.user);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Comprehensive Admin Check
    const isAdmin = Boolean(
        user && (
            user.isadmin === true ||
            user.isAdmin === true ||
            user.role?.toLowerCase() === 'admin'
        )
    );
    const isDemo = Boolean(user?.isDemo);

    const navItems = [
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
            name: 'Salary',
            path: '/salary-monitoring',
            icon: UserIcon,
            adminOnly: true
        },
        {
            name: 'Expenses',
            path: '/expenses',
            icon: Receipt
        },
        {
            name: 'Report',
            path: '/report',
            icon: DocumentReportIcon,
            adminOnly: true
        }
    ];

    // Filter items based on authorization
    const visibleItems = navItems.filter(item => {
        if (item.adminOnly) {
            return mounted && (isAdmin || isDemo);
        }
        return true;
    });

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-40 h-16 px-1 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
            aria-label="Mobile Bottom Navigation"
        >
            <div className="flex items-center justify-around h-full max-w-lg mx-auto">
                {visibleItems.map(item => {
                    const isActive = router.pathname === item.path;
                    const IconComponent = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.path}
                            className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-lg transition-colors group select-none ${
                                isActive
                                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
                            }`}
                        >
                            <div className={`p-1 rounded-md transition-transform duration-150 ${isActive ? 'scale-110' : 'group-active:scale-95'}`}>
                                <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                            </div>
                            <span className="text-[10px] leading-tight tracking-tight truncate max-w-[54px] text-center mt-0.5">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}