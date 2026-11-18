// src/components/landing/LandingHero.jsx
import React from 'react';

const STATION_FEATURES = [
    {
        icon: 'analytics',
        text: 'Real-time Sales Analytics',
        path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    },
    {
        icon: 'inventory',
        text: 'Multi-warehouse Inventory',
        path: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
    },
    {
        icon: 'finance',
        text: 'Financial Reporting',
        path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    },
    {
        icon: 'customer',
        text: 'Customer Management',
        path: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
    },
    {
        icon: 'delivery',
        text: 'Delivery Tracking',
        path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    },
    {
        icon: 'social',
        text: 'Social Media Integration',
        path: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
    }
];

export default function LandingHero() {
    return (
        <div className="space-y-6">
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white drop-shadow-2xs">
                Seaside <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#659000] via-emerald-600 to-cyan-600 dark:from-[#8DB600] dark:via-emerald-400 dark:to-cyan-400 animate-gradient-x">
                    Sales
                </span>{' '}
                <br />
                System
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium max-w-lg leading-relaxed">
                Complete business management platform for modern water refilling stations. Streamline your operations from sales to delivery.
            </p>

            <div className="flex flex-col space-y-3 pt-2">
                {STATION_FEATURES.map((item) => (
                    <div
                        key={item.icon}
                        className="flex items-center space-x-3.5 text-slate-800 dark:text-slate-200"
                    >
                        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-md flex items-center justify-center border border-lime-500/25 dark:border-white/15 text-[#5f7d00] dark:text-[#a3d100] shadow-[0_2px_10px_rgba(141,182,0,0.12)] dark:shadow-[0_0_12px_rgba(141,182,0,0.12)]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2.5"
                                    d={item.path}
                                />
                            </svg>
                        </div>
                        <span className="font-bold text-xs sm:text-sm">{item.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}