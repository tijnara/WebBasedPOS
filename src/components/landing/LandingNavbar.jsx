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
        <nav className="relative z-30 flex items-center justify-between gap-2 px-3.5 py-2.5 sm:px-6 sm:py-3.5 lg:px-12 max-w-7xl mx-auto w-full">
            {/* Animated Seaside Brand Badge & Wordmark */}
            <div className="group relative flex items-center space-x-2 sm:space-x-3 font-extrabold text-lg sm:text-2xl tracking-tight select-none seaside-brand-enter shrink-0">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 w-9 h-9 sm:w-11 sm:h-11 rounded-2xl border-2 border-[#8DB600]/60 dark:border-[#a3d100]/60 seaside-brand-ripple"
                />

                <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-white/85 dark:bg-white/10 backdrop-blur-xl border border-white/95 dark:border-white/20 p-1.5 flex items-center justify-center overflow-hidden shrink-0 seaside-tile-glow transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
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

            {/* Right Navigation Links, Guest Pointer & Theme Toggle */}
            <div className="flex items-center gap-2 sm:gap-4 md:gap-6 text-xs sm:text-sm font-semibold tracking-wide relative z-30">
                <div className="relative flex items-center group">
                    {/* Compact Guest Pointer Pill pointing toward the About link */}
                    <Link
                        href="/about"
                        className="hidden md:inline-flex items-center gap-2 mr-2 px-3 py-1 rounded-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-lime-500/35 dark:border-lime-400/25 shadow-xs hover:border-[#8DB600]/70 dark:hover:border-lime-400/50 transition-all duration-300 cursor-pointer"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8DB600] dark:bg-lime-400 animate-pulse shrink-0" />
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-[#5f7d00] dark:text-[#a3d100] whitespace-nowrap">
                            For Our Guests:
                        </span>
                        <span className="hidden xl:inline text-[11px] font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            Learn about Seaside Station
                        </span>
                        <span
                            aria-hidden="true"
                            className="text-[11px] font-black text-[#5f7d00] dark:text-[#a3d100] leading-none"
                        >
                            →
                        </span>
                    </Link>

                    {/* Mobile Guest Callout Tag pointing directly right to "About" */}
                    <Link
                        href="/about"
                        className="inline-flex md:hidden items-center gap-1 mr-1 px-2 py-1 rounded-full bg-lime-500/15 dark:bg-lime-400/15 border border-lime-500/35 text-[#5f7d00] dark:text-[#a3d100] leading-none shadow-2xs"
                        title="For Our Guests: Learn about Seaside Station"
                    >
                        <span className="flex flex-col text-left">
                            <span className="text-[8px] font-black uppercase tracking-wider">
                                For Our Guests:
                            </span>
                            <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                                Learn about Seaside Station
                            </span>
                        </span>
                        <span aria-hidden="true" className="text-[11px] font-black ml-0.5">
                            →
                        </span>
                    </Link>

                    <Link
                        href="/about"
                        className="text-slate-700 hover:text-[#5f7d00] dark:text-white/85 dark:hover:text-white transition-colors duration-300 cursor-pointer font-bold relative z-10 px-1.5 py-1 ring-1 ring-lime-500/30 dark:ring-lime-400/25 rounded-lg"
                    >
                        About
                    </Link>
                </div>

                <button
                    type="button"
                    onClick={onToggleContact}
                    className="inline-flex items-center gap-1 sm:gap-1.5 text-slate-700 hover:text-[#5f7d00] dark:text-white/85 dark:hover:text-[#8DB600] transition-colors duration-200 cursor-pointer outline-none font-bold"
                >
                    <AnimatedLandingIcon
                        name={activeCard === 'contact' ? 'lock' : 'mail'}
                        size={16}
                        strokeColor="currentColor"
                    />
                    <span>{activeCard === 'contact' ? 'Login' : 'Contact'}</span>
                </button>

                {typeof toggleDarkMode === 'function' && (
                    <button
                        type="button"
                        onClick={toggleDarkMode}
                        className="p-1.5 sm:p-2 rounded-xl bg-white/75 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200/80 dark:border-white/15 text-slate-700 dark:text-slate-200 shadow-2xs backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle color theme"
                    >
                        {darkMode ? (
                            <AnimatedLandingIcon name="sun" size={16} strokeColor="#fbbf24" />
                        ) : (
                            <AnimatedLandingIcon name="moon" size={16} strokeColor="#334155" />
                        )}
                    </button>
                )}
            </div>
        </nav>
    );
}