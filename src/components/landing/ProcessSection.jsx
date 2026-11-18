// src/components/landing/ProcessSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';

const PumpIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="38" width="32" height="4" rx="2" fill={`url(#${gradId})`} />
        <rect x="20" y="42" width="8" height="6" fill={`url(#${gradId})`} />
        <path d="M18 16h12v22H18z" fill={`url(#${gradId})`} />
        <path d="M14 10h20v6H14z" rx="2" fill={`url(#${gradId})`} />
        <path d="M28 14l14-8l2 4l-14 8z" fill={`url(#${gradId})`} />
        <path d="M10 22h8v6h-8z" rx="1" fill={`url(#${gradId})`} />
        <path d="M14 28c0 0-4 4-4 8c0 2.2 1.8 4 4 4s4-1.8 4-4c0-4-4-8-4-8z" fill={`url(#${gradId})`} />
    </svg>
);

const FilterIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="8" width="40" height="6" rx="3" fill={`url(#${gradId})`} />
        <path d="M8 14h8v24H8z" fill={`url(#${gradId})`} />
        <path d="M20 14h8v24h-8z" fill={`url(#${gradId})`} />
        <path d="M32 14h8v24h-8z" fill={`url(#${gradId})`} />
        <circle cx="24" cy="11" r="5" fill="#fff" stroke={`url(#${gradId})`} strokeWidth="2" />
    </svg>
);

const MineralsIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M24 8C24 8 10 24 10 34C10 41.732 16.268 48 24 48C31.732 48 38 41.732 38 34C38 24 24 8 24 8Z"
            fill={`url(#${gradId})`}
            opacity="0.8"
        />
        <path d="M24 26v10M19 31h10" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        <circle cx="42" cy="28" r="3" fill={`url(#${gradId})`} />
    </svg>
);

const QualityIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6h12v4h-12z" fill={`url(#${gradId})`} />
        <path
            d="M14 10h20l2 4v32c0 2-2 2-2 2H14c0 0-2 0-2-2V14l2-4z"
            fill={`url(#${gradId})`}
            opacity="0.6"
        />
        <circle cx="34" cy="34" r="12" fill="#fff" stroke={`url(#${gradId})`} strokeWidth="3" />
        <path
            d="M29 34l3 3l6-6"
            stroke={`url(#${gradId})`}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const STEPS = [
    {
        num: '01',
        icon: PumpIcon,
        title: 'Deep-Well Source Collection',
        description:
            'Selected from protected deep-well aquifers in Labrador, ensuring the highest grade natural raw source before processing starts.'
    },
    {
        num: '02',
        icon: FilterIcon,
        title: '21-Stage Micro-Reverse Osmosis',
        description:
            'Multi-layer activated carbon, sediment membranes, and dual RO vessels strip dissolved solids, bacteria, and particulates.'
    },
    {
        num: '03',
        icon: MineralsIcon,
        title: 'Essential Remineralization',
        description:
            'Crucial electrolytes (calcium and magnesium) are infused back to optimize pH balance and deliver a smooth, crisp flavor.'
    },
    {
        num: '04',
        icon: QualityIcon,
        title: 'Food-Grade Ozone Sterilization',
        description:
            'Every jug undergoes 3-step high-pressure bottle sanitization prior to contact-free seal capping.'
    }
];

export function Process() {
    return (
        <section id="process" className="py-12 lg:py-16 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/85 dark:bg-slate-900/80 border border-lime-300/80 dark:border-white/15 text-[#5f7d00] dark:text-[#a3d100] text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-md">
                        <Filter className="w-3.5 h-3.5 text-[#8DB600]" />
                        21-Stage Quality Protocol
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        Our Purification{' '}
                        <span className="bg-gradient-to-r from-[#659000] via-emerald-500 to-cyan-500 dark:from-[#a3d100] dark:to-cyan-400 bg-clip-text text-transparent">
                            Standard
                        </span>
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium mt-3">
                        From raw source to final sealed container, each step is monitored to ensure pure drinking water for your home.
                    </p>
                </div>

                {/* 4 Process Cards with Animated Water-Flow Conduit Line on Desktop */}
                <div className="relative mb-12">
                    <div
                        aria-hidden="true"
                        className="hidden lg:block absolute top-14 inset-x-16 h-1 rounded-full bg-gradient-to-r from-[#8DB600]/30 via-cyan-400/50 to-[#8DB600]/30 overflow-hidden z-0"
                    >
                        <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#8DB600] to-cyan-400 animate-shimmer" />
                    </div>

                    <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {STEPS.map((step, index) => {
                            const Icon = step.icon;
                            const gradId = `proc-grad-${index}`;

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-40px' }}
                                    transition={{ duration: 0.45, delay: index * 0.1 }}
                                    whileHover={{ y: -6 }}
                                    className="group relative bg-white/85 dark:bg-slate-900/75 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-xs hover:shadow-xl hover:border-[#8DB600]/70 dark:hover:border-[#a3d100]/50 transition-colors duration-300 flex flex-col justify-between"
                                >
                                    <svg width="0" height="0" className="absolute">
                                        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#8DB600" />
                                            <stop offset="100%" stopColor="#06b6d4" />
                                        </linearGradient>
                                    </svg>

                                    <div>
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lime-50 to-cyan-50 dark:from-lime-950/70 dark:to-cyan-950/50 border border-lime-200/80 dark:border-white/15 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-2xs">
                                                <Icon gradId={gradId} />
                                            </div>
                                            <span className="text-2xl font-black text-slate-200 dark:text-slate-700 group-hover:text-[#8DB600]/60 transition-colors">
                                                {step.num}
                                            </span>
                                        </div>

                                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#659000] dark:group-hover:text-[#a3d100] transition-colors leading-snug">
                                            {step.title}
                                        </h3>

                                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Stat Counters Banner */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-slate-900/75 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 shadow-sm text-center"
                >
                    <div>
                        <div className="text-3xl sm:text-4xl font-black text-[#659000] dark:text-[#a3d100]">
                            21
                        </div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                            Filtration Stages
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl sm:text-4xl font-black text-cyan-600 dark:text-cyan-400">
                            99.9%
                        </div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                            Micro-Purity Rating
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl sm:text-4xl font-black text-[#659000] dark:text-[#a3d100]">
                            Daily
                        </div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                            TDS / pH Logged
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                            100%
                        </div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                            Sanitary Approved
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export default Process;