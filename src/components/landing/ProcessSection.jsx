import React from 'react';
import { motion } from 'framer-motion';

// 1. Source Water Collection (Deep Well Pump)
const PumpIcon = ({ gradId }) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ground */}
        <rect x="8" y="38" width="32" height="4" rx="2" fill={`url(#${gradId})`} />
        {/* Pipe going down */}
        <rect x="20" y="42" width="8" height="6" fill={`url(#${gradId})`} />
        {/* Main Body */}
        <path d="M18 16h12v22H18z" fill={`url(#${gradId})`} />
        {/* Top Cap */}
        <path d="M14 10h20v6H14z" rx="2" fill={`url(#${gradId})`} />
        {/* Handle */}
        <path d="M28 14l14-8l2 4l-14 8z" fill={`url(#${gradId})`} />
        {/* Spout */}
        <path d="M10 22h8v6h-8z" rx="1" fill={`url(#${gradId})`} />
        {/* Water Drop */}
        <path d="M14 28c0 0-4 4-4 8c0 2.2 1.8 4 4 4s4-1.8 4-4c0-4-4-8-4-8z" fill={`url(#${gradId})`} />
    </svg>
);

// 2. 21-Stage Filtration (Multi-cylinder water filters)
const FilterIcon = ({ gradId }) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Top Pipe */}
        <rect x="4" y="8" width="40" height="6" rx="3" fill={`url(#${gradId})`} />
        {/* Filter 1 */}
        <path d="M8 14h8v24H8z" fill={`url(#${gradId})`} />
        <path d="M10 38h4v4h-4z" fill={`url(#${gradId})`} opacity="0.6" />
        {/* Filter 2 */}
        <path d="M20 14h8v24h-8z" fill={`url(#${gradId})`} />
        <path d="M22 38h4v4h-4z" fill={`url(#${gradId})`} opacity="0.6" />
        {/* Filter 3 */}
        <path d="M32 14h8v24h-8z" fill={`url(#${gradId})`} />
        <path d="M34 38h4v4h-4z" fill={`url(#${gradId})`} opacity="0.6" />
        {/* Pressure Gauge */}
        <circle cx="24" cy="11" r="5" fill="#fff" stroke={`url(#${gradId})`} strokeWidth="2" />
        <path d="M24 11l-2-2" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// 3. Remineralization (Water drop + Minerals + Plus sign)
const MineralsIcon = ({ gradId }) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Big Water Drop */}
        <path d="M24 8C24 8 10 24 10 34C10 41.732 16.268 48 24 48C31.732 48 38 41.732 38 34C38 24 24 8 24 8Z" fill={`url(#${gradId})`} opacity="0.8" />
        {/* Plus Sign inside */}
        <path d="M24 26v10M19 31h10" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        {/* Minerals orbiting (Diamonds/Hexagons) */}
        <path d="M36 10l4-4l4 4l-4 4z" fill={`url(#${gradId})`} />
        <path d="M12 12l3-3l3 3l-3 3z" fill={`url(#${gradId})`} />
        <path d="M4 26l2-2l2 2l-2 2z" fill={`url(#${gradId})`} />
        <circle cx="42" cy="28" r="3" fill={`url(#${gradId})`} />
    </svg>
);

// 4. Quality Testing & Refilling (Magnifying glass & Checkmark over 5-Gal Jug)
const QualityIcon = ({ gradId }) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 5-Gal Jug */}
        <path d="M18 6h12v4h-12z" fill={`url(#${gradId})`} />
        <path d="M14 10h20l2 4v32c0 2-2 2-2 2H14c0 0-2 0-2-2V14l2-4z" fill={`url(#${gradId})`} opacity="0.6" />
        {/* Ribs on jug */}
        <path d="M14 20h20M14 28h20" stroke="#fff" strokeWidth="2" />
        {/* Testing Clipboard / Checkmark overlay */}
        <circle cx="34" cy="34" r="12" fill="#fff" stroke={`url(#${gradId})`} strokeWidth="3" />
        <path d="M29 34l3 3l6-6" stroke={`url(#${gradId})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export function Process() {
    const steps = [
        {
            icon: PumpIcon,
            title: 'Source Water Collection',
            description: 'We carefully select and collect water from reliable deep well sources, ensuring a clean starting point for our purification process.',
        },
        {
            icon: FilterIcon,
            title: '21-Stage Filtration',
            description: 'Our advanced reverse osmosis system uses 21 stages to remove impurities, contaminants, and unwanted particles.',
        },
        {
            icon: MineralsIcon,
            title: 'Remineralization',
            description: 'Essential minerals are carefully reintroduced to create perfectly balanced, healthy drinking water.',
        },
        {
            icon: QualityIcon,
            title: 'Quality Testing & Refilling',
            description: 'Every batch is tested for purity and taste before being securely refilled into sanitized containers for your family to enjoy.',
        },
    ];

    return (
        <section id="process" className="py-24 bg-white relative overflow-hidden font-sans responsive-page">

            {/* Replicated Faint Dotted Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(#e5e7eb 1.5px, transparent 1.5px)',
                    backgroundSize: '48px 48px'
                }}></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Section Header */}
                <div className="text-center mb-24">
                    <h2 className="text-[3rem] sm:text-[4.5rem] lg:text-[6rem] font-bold text-[#0f172a] mb-8 tracking-tight leading-none drop-shadow-sm">
                        OUR <span style={{
                        background: 'linear-gradient(to right, #8DB600, #0d9488)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        color: 'transparent'
                    }}>PURIFICATION PROCESS</span>
                    </h2>
                    <p className="text-xl lg:text-[22px] text-gray-500 max-w-3xl mx-auto font-light leading-relaxed">
                        From source to your jug, every step is designed to deliver the cleanest,<br className="hidden md:block" /> healthiest water possible.
                    </p>
                </div>

                {/* Process Steps with 3D Hover Animation - FIXED: Increased gap to gap-8 lg:gap-10 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-16">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const gradId = `process-grad-${index}`;

                        return (
                            <div
                                key={index}
                                className="group bg-white p-8 rounded-[2rem] flex flex-col items-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_rgba(20,184,166,0.15)] transition-all duration-500 border border-gray-100 hover:border-teal-200 relative"
                            >
                                {/* Hide the SVG gradient definition */}
                                <svg width="0" height="0" className="absolute">
                                    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                                        {/* Alternating gradient colors for variety */}
                                        <stop offset="0%" stopColor={index % 2 === 0 ? '#009b70' : '#84cc16'} />
                                        <stop offset="100%" stopColor={index % 2 === 0 ? '#84cc16' : '#009b70'} />
                                    </linearGradient>
                                </svg>

                                {/* Animated 3D Floating Icon Container */}
                                <motion.div
                                    className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 z-10"
                                    style={{
                                        boxShadow: 'inset 0 -8px 12px rgba(0,0,0,0.1), inset 0 4px 8px rgba(255,255,255,0.9), 0 15px 25px rgba(20, 184, 166, 0.4)'
                                    }}
                                    animate={{ y: [0, -12, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
                                    whileHover={{ scale: 1.1, rotateZ: 5 }}
                                >
                                    <div className="transform scale-110 drop-shadow-md">
                                        {/* Injecting the custom SVG icon with its dynamic gradient ID */}
                                        <Icon gradId={gradId} />
                                    </div>
                                </motion.div>

                                {/* Title */}
                                <h3 className="text-[1.1rem] font-bold text-gray-900 mb-4 group-hover:text-teal-600 transition-colors">
                                    {step.title}
                                </h3>

                                {/* Description */}
                                <p className="text-gray-500 text-[15px] leading-relaxed font-medium">
                                    {step.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom Stats Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 bg-white/50 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="text-center">
                        <div className="text-[2.5rem] font-extrabold text-[#009b70] mb-1">21</div>
                        <div className="text-gray-500 text-sm font-medium tracking-wide">Filtration Stages</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[2.5rem] font-extrabold text-[#009b70] mb-1">99.9%</div>
                        <div className="text-gray-500 text-sm font-medium tracking-wide">Purity Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[2.5rem] font-extrabold text-[#009b70] mb-1">24/7</div>
                        <div className="text-gray-500 text-sm font-medium tracking-wide">Quality Monitoring</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[2.5rem] font-extrabold text-[#009b70] mb-1">100%</div>
                        <div className="text-gray-500 text-sm font-medium tracking-wide">Customer Satisfaction</div>
                    </div>
                </div>

            </div>

            <br></br>
            <br></br>
        </section>
    );
}

export default Process;