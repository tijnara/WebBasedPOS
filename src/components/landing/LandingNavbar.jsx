// src/components/landing/LandingNavbar.jsx
import React from 'react';
import Link from 'next/link';
import AnimatedLandingIcon from './AnimatedLandingIcon';

export default function LandingNavbar({
                                          activeCard,
                                          onToggleContact,
                                          darkMode,
                                          toggleDarkMode
                                      }) {
    return (
        <nav className="relative z-30 flex justify-between items-center px-4 py-3 sm:px-6 sm:py-4 lg:px-12 max-w-7xl mx-auto w-full">
            {/* Animated Seaside Brand Badge & Wordmark */}
            <div className="group relative flex items-center space-x-2.5 sm:space-x-3.5 font-extrabold text-xl sm:text-2xl tracking-tight select-none seaside-brand-enter">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border-2 border-[#8DB600]/60 dark:border-[#a3d100]/60 seaside-brand-ripple"
                />

                <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/85 dark:bg-white/10 backdrop-blur-xl border border-white/95 dark:border-white/20 p-1.5 flex items-center justify-center overflow-hidden shrink-0 seaside-tile-glow transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 seaside-brand-sheen"
                    />
                    <img
                        src="/seaside.png"
                        alt="Seaside Logo"
                        className="relative z-10 w-full h-full object-contain seaside-palm-breeze"
                    />
                </div>

                <div className="relative overflow-hidden seaside-wordmark-enter">
                    <span className="relative z-10 inline-block text-green-900 dark:text-white font-black drop-shadow-2xs tracking-tight">
                        Seaside
                    </span>
                </div>
            </div>

            {/* Right Navigation Links & Theme Toggle */}
            <div className="flex items-center space-x-4 sm:space-x-6 md:space-x-8 text-sm font-semibold tracking-wide relative z-30">
                <div className="relative flex items-center group">
                    {/* Horizontal Guest Callout Pill (Positioned to the LEFT of About so it never overlaps Volt below) */}
                    <Link
                        href="/about"
                        className="hidden xl:flex items-center gap-2 mr-2.5 px-3 py-1.5 rounded-full bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-lime-500/35 dark:border-lime-400/25 shadow-sm hover:border-[#8DB600]/70 dark:hover:border-lime-400/50 transition-all duration-300 cursor-pointer"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8DB600] dark:bg-lime-400 animate-pulse shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#5f7d00] dark:text-[#a3d100] whitespace-nowrap">
                            For Our Guests:
                        </span>
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            Learn about Seaside Station
                        </span>
                        <div className="rotate-90 flex items-center justify-center shrink-0">
                            <AnimatedLandingIcon
                                name="arrowUp"
                                size={14}
                                strokeColor={darkMode ? '#a3d100' : '#659000'}
                                loop
                            />
                        </div>
                    </Link>

                    <Link
                        href="/about"
                        className="text-slate-700 hover:text-[#5f7d00] dark:text-white/85 dark:hover:text-white transition-colors duration-300 cursor-pointer font-bold relative z-10 px-2 py-1"
                    >
                        About
                    </Link>
                </div>

                <button
                    type="button"
                    onClick={onToggleContact}
                    className="inline-flex items-center gap-1.5 text-slate-700 hover:text-[#5f7d00] dark:text-white/85 dark:hover:text-[#8DB600] transition-colors duration-200 cursor-pointer outline-none font-bold"
                >
                    <AnimatedLandingIcon
                        name={activeCard === 'contact' ? 'lock' : 'mail'}
                        size={17}
                        strokeColor="currentColor"
                    />
                    <span>{activeCard === 'contact' ? 'Login' : 'Contact'}</span>
                </button>

                {typeof toggleDarkMode === 'function' && (
                    <button
                        type="button"
                        onClick={toggleDarkMode}
                        className="p-2 rounded-xl bg-white/75 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200/80 dark:border-white/15 text-slate-700 dark:text-slate-200 shadow-2xs backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle color theme"
                    >
                        {darkMode ? (
                            <AnimatedLandingIcon name="sun" size={18} strokeColor="#fbbf24" />
                        ) : (
                            <AnimatedLandingIcon name="moon" size={18} strokeColor="#334155" />
                        )}
                    </button>
                )}
            </div>
        </nav>
    );
}