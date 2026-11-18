// src/components/landing/LandingNavbar.jsx
import React from 'react';
import Link from 'next/link';
import { Sun, Moon } from 'lucide-react';

export default function LandingNavbar({
                                          activeCard,
                                          onToggleContact,
                                          darkMode,
                                          toggleDarkMode
                                      }) {
    return (
        <nav className="relative z-20 flex justify-between items-center p-4 sm:p-6 lg:px-12 max-w-7xl mx-auto w-full">
            {/* Animated Seaside Brand Badge & Wordmark */}
            <div className="group relative flex items-center space-x-2.5 sm:space-x-3.5 font-extrabold text-xl sm:text-2xl tracking-tight select-none seaside-brand-enter">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border-2 border-[#8DB600]/60 dark:border-[#a3d100]/60 seaside-brand-ripple"
                />

                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/85 dark:bg-white/10 backdrop-blur-xl border border-white/95 dark:border-white/20 p-1.5 flex items-center justify-center overflow-hidden shrink-0 seaside-tile-glow transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
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
            <div className="flex items-center space-x-5 sm:space-x-8 md:space-x-10 text-sm font-semibold tracking-wide relative z-50">
                <div className="relative flex justify-center group">
                    <Link
                        href="/about"
                        className="text-slate-700 hover:text-[#5f7d00] dark:text-white/85 dark:hover:text-white transition-colors duration-300 cursor-pointer font-bold relative z-10 px-2 py-1"
                    >
                        About
                    </Link>

                    <div className="hidden sm:flex absolute top-[110%] left-1/2 transform -translate-x-1/2 flex-col items-center pointer-events-none w-[195px] z-[100]">
                        <div className="flex flex-col items-center animate-float-slow transition-transform duration-300 group-hover:-translate-y-1">
                            <svg
                                className="w-5 h-5 mb-1 text-[#659000] dark:text-[#a3d100] drop-shadow-[0_0_8px_rgba(141,182,0,0.55)] dark:drop-shadow-[0_0_8px_rgba(163,209,0,0.8)] animate-pulse"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="3"
                                    d="M12 4v16m0-16l-6 6m6-6l6 6"
                                />
                            </svg>

                            <div className="relative bg-white/85 dark:bg-slate-900/65 backdrop-blur-md border border-lime-500/30 dark:border-white/10 rounded-xl p-2.5 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-center overflow-hidden transition-colors duration-300 group-hover:border-[#8DB600]/60 dark:group-hover:border-[#8DB600]/30 group-hover:shadow-[0_0_20px_rgba(141,182,0,0.2)]">
                                <div className="absolute inset-0 bg-gradient-to-b from-[#8DB600]/15 to-transparent opacity-70" />
                                <span className="relative z-10 block text-[9px] font-black uppercase tracking-widest text-[#5f7d00] dark:text-[#a3d100] mb-0.5">
                                    For Our Guests
                                </span>
                                <span className="relative z-10 block text-[10px] font-semibold leading-tight text-slate-700 dark:text-slate-200">
                                    Learn more about SEASIDE water refilling station
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onToggleContact}
                    className="text-slate-700 hover:text-[#5f7d00] dark:text-white/85 dark:hover:text-[#8DB600] transition-colors duration-200 cursor-pointer outline-none font-bold"
                >
                    {activeCard === 'contact' ? 'Login' : 'Contact'}
                </button>

                {typeof toggleDarkMode === 'function' && (
                    <button
                        type="button"
                        onClick={toggleDarkMode}
                        className="p-2 rounded-xl bg-white/75 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200/80 dark:border-white/15 text-slate-700 dark:text-slate-200 shadow-2xs backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle color theme"
                    >
                        {darkMode ? (
                            <Sun className="w-4 h-4 text-amber-400" />
                        ) : (
                            <Moon className="w-4 h-4 text-slate-700" />
                        )}
                    </button>
                )}
            </div>
        </nav>
    );
}