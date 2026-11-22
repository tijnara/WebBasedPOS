// src/components/landing/Hero.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useCustomers } from '../../hooks/useCustomers';
import { useStore } from '../../store/useStore';
import SafeWebGL from '../SafeWebGL';
import WaterStation3DModel from './WaterStation3DModel';
import RefillSimulatorGame from './RefillSimulatorGame';
import AnimatedLandingIcon from './AnimatedLandingIcon';

function WaterStation2DFallback({ darkMode, stationName, onPlaySim }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center px-4 py-2 text-center select-none">
            <div className="relative flex items-center justify-center mb-3">
                {/* Ambient Halo */}
                <div className="absolute w-36 h-36 rounded-full bg-cyan-400/20 dark:bg-cyan-500/15 blur-xl pointer-events-none" />

                {/* 2D Vector 20L Round Purified Water Jug */}
                <svg
                    className="w-36 h-40 sm:w-40 sm:h-44 drop-shadow-[0_14px_24px_rgba(14,165,233,0.25)]"
                    viewBox="0 0 160 185"
                    fill="none"
                >
                    <defs>
                        <linearGradient id="heroJugShell" x1="25" y1="20" x2="135" y2="170" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor={darkMode ? '#38bdf8' : '#e0f2fe'} stopOpacity="0.65" />
                            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.55" />
                        </linearGradient>
                        <linearGradient id="heroJugWater" x1="30" y1="62" x2="130" y2="170" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.9" />
                            <stop offset="55%" stopColor="#0ea5e9" stopOpacity="0.88" />
                            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.95" />
                        </linearGradient>
                    </defs>

                    {/* Sanitary Red/Blue Non-Spill Cap */}
                    <rect x="62" y="10" width="36" height="12" rx="4" fill="#0284c7" />
                    <rect x="75" y="10" width="10" height="16" rx="2" fill="#ef4444" />
                    <rect x="58" y="22" width="44" height="7" rx="3" fill="#38bdf8" />

                    {/* Molded Carry Handle */}
                    <path
                        d="M128 76C144 78 144 126 128 128"
                        stroke="#0284c7"
                        strokeWidth="8"
                        strokeLinecap="round"
                    />

                    {/* Jug Body */}
                    <path
                        d="M64 29H96C96 40 128 46 128 64V152C128 163 120 171 109 171H51C40 171 32 163 32 152V64C32 46 64 40 64 29Z"
                        fill="url(#heroJugShell)"
                        stroke={darkMode ? '#38bdf8' : '#0284c7'}
                        strokeWidth="2.5"
                    />

                    {/* Purified Water Fill */}
                    <path
                        d="M35 68C55 62 75 74 96 68C110 64 120 66 125 68V151C125 160 118 168 108 168H52C42 168 35 160 35 151V68Z"
                        fill="url(#heroJugWater)"
                    />

                    {/* Structural Ribs */}
                    <path d="M35 92C65 98 95 98 125 92" stroke="white" strokeOpacity="0.45" strokeWidth="2" />
                    <path d="M35 120C65 126 95 126 125 120" stroke="white" strokeOpacity="0.45" strokeWidth="2" />
                    <path d="M35 146C65 152 95 152 125 146" stroke="white" strokeOpacity="0.45" strokeWidth="2" />

                    {/* Glass Highlight */}
                    <rect x="42" y="58" width="7" height="96" rx="3.5" fill="white" fillOpacity="0.45" />
                </svg>

                {/* Center Station Emblem Badge */}
                <div className="absolute bottom-2 px-2.5 py-1 rounded-full bg-white/95 dark:bg-slate-900/95 border border-lime-300/80 dark:border-lime-700/60 shadow-sm flex items-center gap-1.5">
                    <img src="/seaside.png" alt="Seaside WRS" className="w-4 h-4 object-contain" />
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-100">
                        20.0L {stationName || 'Seaside'}
                    </span>
                </div>
            </div>

            <button
                type="button"
                onClick={onPlaySim}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 hover:bg-[#8DB600] hover:text-white dark:hover:bg-[#8DB600] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 text-[11px] font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
            >
                <AnimatedLandingIcon name="gamepad" size={14} strokeColor="currentColor" />
                <span>Launch Interactive Refill Simulator</span>
            </button>
        </div>
    );
}

export default function Hero({ settings }) {
    const { data: customersData, isLoading } = useCustomers();
    const darkMode = useStore((s) => s.darkMode);

    // Stage Mode: '3d-model' | 'game'
    const [stageView, setStageView] = useState('3d-model');
    const [hoveredHighlight, setHoveredHighlight] = useState(-1);
    const [highlightTick, setHighlightTick] = useState(0);

    // Animated Count-Up for Served Customers
    const targetCount = customersData?.totalCount || 133;
    const [displayCount, setDisplayCount] = useState(0);

    useEffect(() => {
        if (isLoading) return;
        let frameId;
        const duration = 1200;
        const start = performance.now();

        const tick = (now) => {
            const elapsed = now - start;
            const progress = Math.min(1, elapsed / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayCount(Math.round(eased * targetCount));
            if (progress < 1) {
                frameId = requestAnimationFrame(tick);
            }
        };

        frameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameId);
    }, [targetCount, isLoading]);

    const formattedCount = new Intl.NumberFormat('en-US', {
        notation: targetCount >= 10000 ? 'compact' : 'standard',
        compactDisplay: 'short'
    }).format(displayCount || targetCount);

    const rawBusinessName = (settings?.business_name || 'Seaside').trim();
    const stationBadgeLabel = /station$/i.test(rawBusinessName)
        ? rawBusinessName
        : `${rawBusinessName} Station`;

    const rawTds = (settings?.tds_reading || '002 PPM').trim();
    const formattedTdsBadge = /^tds:/i.test(rawTds)
        ? rawTds
        : `TDS: ${rawTds} • 21-STAGE`;

    const jugPriceLabel = (settings?.jug_price_range || '₱20-₱30 / Jug').trim();
    const heroTagline = (settings?.hero_tagline || 'Always Fresh, Cold & Pure').trim();

    // Framer Motion 3D Spring Tilt for Showcase Stage
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 180, damping: 22 });
    const springY = useSpring(mouseY, { stiffness: 180, damping: 22 });
    const rotateX = useTransform(springY, [-0.5, 0.5], [7, -7]);
    const rotateY = useTransform(springX, [-0.5, 0.5], [-7, 7]);

    const handleStageMove = (e) => {
        if (stageView === 'game') {
            mouseX.set(0);
            mouseY.set(0);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
        mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    const handleStageLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    const keyHighlights = [
        'Advanced 21-stage reverse osmosis multi-barrier purification',
        'Naturally remineralized for crisp taste and optimal body hydration',
        'Eco-friendly bottle reuse & automated container sterilization'
    ];

    return (
        <section id="home" className="relative pt-6 pb-12 lg:pt-10 lg:pb-20 overflow-hidden bg-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
                    {/* LEFT COLUMN: Value Proposition */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:col-span-7 flex flex-col space-y-6 text-left"
                    >
                        {/* Location Pill with Live Looping Explore Compass */}
                        <div className="inline-flex items-center gap-2 w-max px-3.5 py-1.5 rounded-full bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-lime-300/80 dark:border-white/15 shadow-xs">
                            <span className="flex h-2 w-2 rounded-full bg-[#8DB600] animate-ping" />
                            <AnimatedLandingIcon
                                name="explore"
                                size={18}
                                strokeColor={darkMode ? '#a3d100' : '#659000'}
                                loop
                            />
                            <span className="text-xs font-bold uppercase tracking-wider text-lime-900 dark:text-lime-300">
                                {settings?.physical_address
                                    ? `${settings.physical_address}'s Pure Hydration`
                                    : "Labrador, Pangasinan's Pure Hydration"}
                            </span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
                            {settings?.hero_title ? (
                                settings.hero_title
                            ) : (
                                <>
                                    Your Family&apos;s Health,{' '}
                                    <span className="bg-gradient-to-r from-[#659000] via-emerald-500 to-cyan-500 dark:from-[#a3d100] dark:via-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                                        Flowing Crystal Clear
                                    </span>{' '}
                                    from Seaside.
                                </>
                            )}
                        </h1>

                        {/* Subheading */}
                        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-xl">
                            {settings?.hero_subtitle ||
                                'We combine commercial-grade 21-stage reverse osmosis filtration with warm local care, delivering 100% pure, remineralized drinking water straight to your home and business.'}
                        </p>

                        {/* Staggered Highlight Cards with Animated Checkmarks */}
                        <div className="space-y-2.5 max-w-xl pt-1">
                            {keyHighlights.map((text, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 + i * 0.1, duration: 0.45 }}
                                    whileHover={{ x: 5 }}
                                    onMouseEnter={() => {
                                        setHoveredHighlight(i);
                                        setHighlightTick((t) => t + 1);
                                    }}
                                    onMouseLeave={() => setHoveredHighlight(-1)}
                                    className="flex items-center gap-3.5 p-3 sm:px-4 rounded-2xl bg-white/85 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-2xs hover:border-[#8DB600]/70 dark:hover:border-lime-400/50 transition-colors"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-lime-100 dark:bg-lime-950/70 text-[#659000] dark:text-[#a3d100] flex items-center justify-center shrink-0 border border-lime-200/70 dark:border-lime-800/50">
                                        <AnimatedLandingIcon
                                            name="checkmark"
                                            size={18}
                                            strokeColor={darkMode ? '#a3d100' : '#659000'}
                                            triggerKey={hoveredHighlight === i ? highlightTick : 0}
                                        />
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                                        {text}
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
                            <a
                                href="#location"
                                style={{
                                    background:
                                        'linear-gradient(135deg, #8DB600 0%, #65a30d 55%, #0d9488 100%)',
                                    color: '#ffffff'
                                }}
                                className="relative overflow-hidden inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-extrabold text-sm shadow-md shadow-lime-600/25 border border-lime-300/40 hover:scale-[1.02] active:scale-95 transition-all group"
                            >
                                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-shimmer" />
                                <span>Visit Station</span>
                                <AnimatedLandingIcon name="arrowRight" size={18} strokeColor="#ffffff" />
                            </a>
                            <a
                                href="#services"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/85 hover:bg-white dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-white/15 font-bold text-sm shadow-2xs backdrop-blur-md transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <span>View Refill Options</span>
                            </a>
                        </div>

                        {/* Trust Badges with Live Animated Icons */}
                        <div className="pt-4 flex flex-wrap items-center gap-3 border-t border-slate-200/80 dark:border-white/10">
                            <div className="flex items-center gap-2 bg-white/85 dark:bg-slate-900/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-white/10 shadow-2xs">
                                <AnimatedLandingIcon
                                    name="heart"
                                    size={18}
                                    strokeColor={darkMode ? '#a3d100' : '#659000'}
                                    loop
                                />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                                    {formattedCount}+ Served
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/85 dark:bg-slate-900/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-white/10 shadow-2xs">
                                <AnimatedLandingIcon
                                    name="checkmark"
                                    size={18}
                                    strokeColor={darkMode ? '#34d399' : '#059669'}
                                    loop
                                />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    Sanitary DOH Standards
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/85 dark:bg-slate-900/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-white/10 shadow-2xs">
                                <AnimatedLandingIcon
                                    name="infinity"
                                    size={18}
                                    strokeColor={darkMode ? '#22d3ee' : '#0891b2'}
                                    loop
                                />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    Zero Plastic Waste Model
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT COLUMN: Interactive 3D WebGL Water Containers & Refill Mini-Game Stage */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        className="lg:col-span-5 flex justify-center relative perspective-[1200px]"
                        onMouseMove={handleStageMove}
                        onMouseLeave={handleStageLeave}
                    >
                        <motion.div
                            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
                            className="relative w-full max-w-lg lg:max-w-none rounded-[2rem] bg-white/75 dark:bg-slate-900/70 backdrop-blur-2xl p-4 sm:p-5 border border-white/90 dark:border-white/15 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.16),0_0_35px_rgba(141,182,0,0.14)] dark:shadow-[0_24px_65px_-15px_rgba(0,0,0,0.85),0_0_35px_rgba(56,189,248,0.12)] flex flex-col justify-between overflow-hidden min-h-[430px] sm:min-h-[480px]"
                        >
                            {/* Top Specular Rim */}
                            <div
                                className="absolute top-0 inset-x-10 h-[2px] rounded-full opacity-85"
                                style={{
                                    background:
                                        'linear-gradient(90deg, transparent, #8DB600, #06b6d4, transparent)'
                                }}
                            />

                            {/* Dot Grid & Caustic Glow */}
                            <div className="absolute inset-0 bg-[radial-gradient(#8DB600_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
                            <div className="absolute inset-0 bg-radial from-cyan-400/15 via-transparent to-transparent pointer-events-none" />

                            {/* Top Stage Controls & Live Water Telemetry */}
                            <div className="relative z-20 flex flex-wrap items-center justify-between gap-2">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 dark:bg-cyan-400/15 border border-cyan-500/25 text-cyan-800 dark:text-cyan-300 text-[10px] font-mono font-bold">
                                    <AnimatedLandingIcon
                                        name="activity"
                                        size={14}
                                        strokeColor={darkMode ? '#67e8f9' : '#0e7490'}
                                        loop
                                    />
                                    <span className="truncate">{formattedTdsBadge}</span>
                                </div>

                                {/* 3D Jug vs Refill Sim Switcher */}
                                <div className="flex bg-slate-200/80 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-300/60 dark:border-white/10 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setStageView('3d-model')}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                                            stageView === '3d-model'
                                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-[#a3d100] shadow-2xs'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <AnimatedLandingIcon name="box" size={13} strokeColor="currentColor" />
                                        <span>3D Jug</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStageView('game')}
                                        className={`relative px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                                            stageView === 'game'
                                                ? 'bg-[#8DB600] text-white shadow-2xs'
                                                : 'text-slate-700 dark:text-lime-300 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <AnimatedLandingIcon name="gamepad" size={13} strokeColor="currentColor" />
                                        <span>Refill Sim</span>
                                        {stageView !== 'game' && (
                                            <span className="flex h-1.5 w-1.5 rounded-full bg-[#8DB600] animate-ping ml-0.5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Noticeable Interactive Refill Simulation Notice Banner */}
                            <AnimatePresence initial={false}>
                                {stageView === '3d-model' && (
                                    <motion.button
                                        type="button"
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.25 }}
                                        onClick={() => setStageView('game')}
                                        className="relative z-20 mt-2.5 w-full text-left group overflow-hidden rounded-2xl p-2.5 sm:px-3.5 bg-gradient-to-r from-[#8DB600]/18 via-emerald-500/12 to-cyan-500/18 dark:from-[#8DB600]/22 dark:via-emerald-500/15 dark:to-cyan-500/20 hover:from-[#8DB600]/28 hover:to-cyan-500/28 border border-[#8DB600]/65 dark:border-[#a3d100]/55 shadow-[0_6px_20px_-6px_rgba(141,182,0,0.45)] transition-all cursor-pointer active:scale-[0.99]"
                                    >
                                        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-shimmer" />

                                        <div className="relative z-10 flex items-center justify-between gap-2.5">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-xl bg-[#8DB600] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                                    <AnimatedLandingIcon name="gamepad" size={18} strokeColor="#ffffff" />
                                                </div>
                                                <div className="min-w-0 leading-tight">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[11px] font-black text-slate-900 dark:text-white truncate">
                                                            Try Refilling the Containers!
                                                        </span>
                                                        <span className="hidden sm:inline-block text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-[#8DB600]/20 text-[#5f7d00] dark:text-[#a3d100] border border-[#8DB600]/40 shrink-0">
                                                            Mini-Game
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate mt-0.5">
                                                        Sanitize, fill to 20.0L &amp; snap the cap to score points
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#8DB600] group-hover:bg-[#7ca000] text-white text-[10px] font-black shadow-xs shrink-0 transition-colors">
                                                <span>Play</span>
                                                <AnimatedLandingIcon name="arrowRight" size={14} strokeColor="#ffffff" />
                                            </span>
                                        </div>
                                    </motion.button>
                                )}
                            </AnimatePresence>

                            {/* Center Interactive Viewport */}
                            <div className="relative z-10 w-full flex-1 flex items-center justify-center my-auto py-1">
                                <AnimatePresence mode="wait">
                                    {stageView === '3d-model' && (
                                        <motion.div
                                            key="webgl-3d-jug"
                                            initial={{ opacity: 0, scale: 0.92 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.92 }}
                                            transition={{ duration: 0.3 }}
                                            className="w-full h-[275px] sm:h-[305px] relative"
                                        >
                                            <SafeWebGL
                                                fallback={
                                                    <WaterStation2DFallback
                                                        darkMode={darkMode}
                                                        stationName={rawBusinessName}
                                                        onPlaySim={() => setStageView('game')}
                                                    />
                                                }
                                            >
                                                <WaterStation3DModel
                                                    darkMode={darkMode}
                                                    stationName={rawBusinessName}
                                                    tdsLabel={formattedTdsBadge}
                                                />
                                            </SafeWebGL>
                                        </motion.div>
                                    )}

                                    {stageView === 'game' && (
                                        <motion.div
                                            key="refill-simulator-game"
                                            initial={{ opacity: 0, scale: 0.94 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.94 }}
                                            transition={{ duration: 0.25 }}
                                            className="w-full h-[305px] sm:h-[345px]"
                                        >
                                            <RefillSimulatorGame
                                                darkMode={darkMode}
                                                stationName={rawBusinessName}
                                                tdsLabel={formattedTdsBadge}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Floating Price & Station Pill */}
                            <div className="relative z-20 bg-white/90 dark:bg-slate-950/85 backdrop-blur-xl border border-lime-300/60 dark:border-white/15 rounded-2xl p-3 shadow-md flex items-center justify-between gap-2 mt-auto">
                                <div className="min-w-0">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-[#659000] dark:text-[#a3d100] truncate">
                                        {stationBadgeLabel}
                                    </div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                        {heroTagline}
                                    </div>
                                </div>
                                <span className="text-xs font-black px-3 py-1.5 bg-gradient-to-r from-lime-100 to-emerald-100 dark:from-lime-950/80 dark:to-emerald-950/80 text-[#5f7d00] dark:text-[#a3d100] rounded-xl border border-lime-300/70 dark:border-lime-700/50 shadow-2xs shrink-0">
                                    {jugPriceLabel}
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}