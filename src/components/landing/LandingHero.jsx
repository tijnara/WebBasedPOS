// src/components/landing/LandingHero.jsx
import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import AnimatedLandingIcon from './AnimatedLandingIcon';

const STATION_FEATURES = [
    {
        id: 'analytics',
        iconName: 'activity',
        text: 'Real-time Sales Analytics'
    },
    {
        id: 'inventory',
        iconName: 'folder',
        text: 'Multi-warehouse Inventory'
    },
    {
        id: 'finance',
        iconName: 'calendar',
        text: 'Financial Reporting'
    },
    {
        id: 'customer',
        iconName: 'userPlus',
        text: 'Customer Management'
    },
    {
        id: 'delivery',
        iconName: 'home',
        text: 'Delivery Tracking'
    },
    {
        id: 'social',
        iconName: 'share',
        text: 'Social Media Integration'
    }
];

export default function LandingHero() {
    const darkMode = useStore((s) => s.darkMode);
    const [hoveredIndex, setHoveredIndex] = useState(-1);
    const [hoverTick, setHoverTick] = useState(0);

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
                {STATION_FEATURES.map((item, idx) => (
                    <div
                        key={item.id}
                        onMouseEnter={() => {
                            setHoveredIndex(idx);
                            setHoverTick((t) => t + 1);
                        }}
                        onMouseLeave={() => setHoveredIndex(-1)}
                        className="group flex items-center space-x-3.5 text-slate-800 dark:text-slate-200 transition-transform duration-200 hover:translate-x-1"
                    >
                        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/85 dark:bg-white/10 backdrop-blur-md flex items-center justify-center border border-lime-500/25 dark:border-white/15 text-[#5f7d00] dark:text-[#a3d100] shadow-[0_2px_10px_rgba(141,182,0,0.12)] dark:shadow-[0_0_12px_rgba(141,182,0,0.12)] group-hover:border-[#8DB600]/60 transition-colors">
                            <AnimatedLandingIcon
                                name={item.iconName}
                                size={20}
                                strokeColor={darkMode ? '#a3d100' : '#5f7d00'}
                                triggerKey={hoveredIndex === idx ? hoverTick : 0}
                            />
                        </div>
                        <span className="font-bold text-xs sm:text-sm group-hover:text-[#5f7d00] dark:group-hover:text-[#a3d100] transition-colors">
                            {item.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}