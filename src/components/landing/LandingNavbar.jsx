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
        <header className="relative z-30 w-full max-w-7xl mx-auto px-3 pt-2 pb-1 sm:px-6 sm:py-3.5 lg:px-12">
            {/* Primary Single-Row Navigation Bar */}
            <nav
                aria-label="Primary Navigation"
                className="flex items-center justify-between gap-2 w-full min-w-0"
            >
                {/* Seaside Brand Badge & Wordmark */}
                <div className="group relative flex items-center gap-2 sm:gap-3 font-extrabold text-base sm:text-xl lg:text-2xl tracking-tight select-none seaside-brand-enter shrink-0">
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-2xl border-2 border-[#8DB600]/60 dark:border-[#a3d100]/60 seaside-brand-ripple"
                    />

                    <div className="relative w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-2xl bg-white/85 dark:bg-white/10 backdrop-blur-xl border border-white/95 dark:border-white/20 p-1 sm:p-1.5 flex items-center justify-center overflow-hidden shrink-0 seaside-tile-glow transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
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

                {/* Right Controls: Desktop Guest Pill, About, Contact, Theme Toggle */}
                <div className="flex items-center gap-1.5 sm:gap-4 md:gap-6 text-xs sm:text-sm font-semibold tracking-wide shrink-0">
                    {/* Tablet/Desktop Guest Pill pointing toward About */}
                    <Link
                        href="/about"
                        className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-lime-500/35 dark:border-lime-400/25 shadow-xs hover:border-[#8DB600]/70 dark:hover:border-lime-400/50 transition-all duration-300 cursor-pointer"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8DB600] dark:bg-lime-400 animate-pulse shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#5f7d00] dark:text-[#a3d100] whitespace-nowrap">
                            For Our Guests:
                        </span>
                        <span className="hidden xl:inline text-[11px] font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            Learn about Seaside Station
                        </span>
                        <span
                            aria-hidden="true"
                            className="text-xs font-black text-[#5f7d00] dark:text-[#a3d100] leading-none"
                        >
                            →
                        </span>
                    </Link>

                    <Link
                        href="/about"
                        className="text-slate-700 hover:text-[#5f7d00] dark:text-white/85 dark:hover:text-white transition-colors duration-300 cursor-pointer font-bold px-2 py-1 rounded-lg ring-1 ring-lime-500/30 dark:ring-lime-400/25 shrink-0"
                    >
                        About
                    </Link>

                    <button
                        type="button"
                        onClick={onToggleContact}
                        className="inline-flex items-center gap-1 sm:gap-1.5 text-slate-700 hover:text-[#5f7d00] dark:text-white/85 dark:hover:text-[#8DB600] transition-colors duration-200 cursor-pointer outline-none font-bold px-1 py-1 shrink-0"
                    >
                        <AnimatedLandingIcon
                            name={activeCard === 'contact' ? 'lock' : 'mail'}
                            size={15}
                            strokeColor="currentColor"
                        />
                        <span>{activeCard === 'contact' ? 'Login' : 'Contact'}</span>
                    </button>

                    {typeof toggleDarkMode === 'function' && (
                        <button
                            type="button"
                            onClick={toggleDarkMode}
                            className="p-1.5 sm:p-2 rounded-xl bg-white/85 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200/80 dark:border-white/15 text-slate-700 dark:text-slate-200 shadow-2xs backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
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

            {/* Mobile-First Guest Callout Row pointing to the About link */}
            <div className="flex md:hidden items-center justify-center mt-1.5 w-full">
                <Link
                    href="/about"
                    className="inline-flex items-center justify-between gap-2 px-3 py-1 rounded-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-lime-500/35 dark:border-lime-400/25 shadow-2xs max-w-full"
                >
                    <span className="flex items-center gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8DB600] dark:bg-lime-400 animate-pulse shrink-0" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#5f7d00] dark:text-[#a3d100] shrink-0">
                            For Our Guests:
                        </span>
                        <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                            Learn about Seaside Station
                        </span>
                    </span>
                    <span
                        aria-hidden="true"
                        className="text-[11px] font-black text-[#5f7d00] dark:text-[#a3d100] shrink-0"
                    >
                        → About
                    </span>
                </Link>
            </div>
        </header>
    );
}