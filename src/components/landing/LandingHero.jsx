// src/components/landing/LandingHero.jsx
import React from 'react';
import {
    Activity,
    Warehouse,
    FileSpreadsheet,
    UserPlus,
    Truck,
    Share2
} from 'lucide-react';

const FEATURES = [
    { icon: Activity, label: 'Real-time Sales Analytics' },
    { icon: Warehouse, label: 'Multi-warehouse Inventory' },
    { icon: FileSpreadsheet, label: 'Financial Reporting' },
    { icon: UserPlus, label: 'Customer Management' },
    { icon: Truck, label: 'Delivery Tracking' },
    { icon: Share2, label: 'Social Media Integration' }
];

export default function LandingHero({ store, settings }) {
    const businessName = store?.name || settings?.business_name || 'Seaside';
    const subtitle =
        store?.branding?.heroSubtitle ||
        settings?.hero_subtitle ||
        'Complete business management platform for modern water refilling stations. Streamline your operations from sales to delivery.';

    return (
        <div className="hidden lg:flex flex-col justify-center space-y-6 select-none pr-4">
            <div>
                <h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-[1.06] text-slate-900 dark:text-white">
                    {businessName}
                    <span className="block text-emerald-500 dark:text-[#10b981]">
                        Sales
                    </span>
                    <span className="block">System</span>
                </h1>

                <p className="mt-4 text-sm xl:text-base text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed font-medium">
                    {subtitle}
                </p>
            </div>

            <ul className="space-y-2.5 pt-1">
                {FEATURES.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3.5 group">
                        <div className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-[#659000] dark:text-[#a3e635] shadow-2xs group-hover:border-[#8DB600]/60 transition-colors shrink-0">
                            <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs xl:text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                            {label}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}