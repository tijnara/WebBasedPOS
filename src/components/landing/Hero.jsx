// src/components/landing/Hero.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, MapPin, ArrowRight, Sparkles, HeartHandshake } from 'lucide-react';
import { useCustomers } from '../../hooks/useCustomers';

export default function Hero({ settings }) {
    const { data: customersData, isLoading } = useCustomers();

    const customerCount = customersData?.totalCount || 10000;
    const formattedCount = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
    }).format(customerCount);

    const keyHighlights = [
        'Advanced 21-stage reverse osmosis multi-barrier purification',
        'Naturally remineralized for crisp taste and optimal body hydration',
        'Eco-friendly bottle reuse & automated container sterilization'
    ];

    return (
        <section id="home" className="relative pt-6 pb-12 lg:pt-10 lg:pb-20 overflow-hidden bg-transparent">
            {/* Ambient Apple Green Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#8DB600]/25 via-lime-200/30 to-[#6abf45]/20 dark:from-lime-600/10 dark:via-emerald-950/20 dark:to-transparent blur-3xl -z-10 rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">

                    {/* LEFT COLUMN: Value Proposition */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="lg:col-span-7 flex flex-col space-y-6 text-left"
                    >
                        {/* Apple Green Tag */}
                        <div className="inline-flex items-center gap-2 w-max px-3.5 py-1.5 rounded-full bg-lime-50 dark:bg-slate-900/90 border border-lime-200/90 dark:border-slate-800 shadow-xs">
                            <span className="flex h-2 w-2 rounded-full bg-[#8DB600] animate-pulse" />
                            <MapPin className="w-3.5 h-3.5 text-[#8DB600] dark:text-lime-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-lime-900 dark:text-lime-300">
                                {settings?.physical_address ? `${settings.physical_address}'s Pure Hydration` : "Labrador, Pangasinan's Pure Hydration"}
                            </span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
                            {settings?.hero_title ? (
                                settings.hero_title
                            ) : (
                                <>
                                    Your Family's Health,{' '}
                                    <span className="bg-gradient-to-r from-[#8DB600] via-[#6abf45] to-[#4e9e2d] dark:from-lime-400 dark:via-lime-300 dark:to-emerald-400 bg-clip-text text-transparent">
                                        Flowing Crystal Clear
                                    </span>{' '}
                                    from Seaside.
                                </>
                            )}
                        </h1>

                        {/* Subheading */}
                        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-xl">
                            {settings?.hero_subtitle || "We combine commercial-grade 21-stage reverse osmosis filtration with warm local care, delivering 100% pure, remineralized drinking water straight to your home and business."}
                        </p>

                        {/* Highlight Cards with High-Contrast Dark & Light Surfaces */}
                        <div className="space-y-2.5 max-w-xl pt-1">
                            {keyHighlights.map((text, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3.5 p-3 sm:px-4 rounded-2xl bg-white/95 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-[#8DB600]/60 dark:hover:border-lime-500/50 transition-all"
                                >
                                    <div className="w-6 h-6 rounded-lg bg-lime-100 dark:bg-lime-950/60 text-[#8DB600] dark:text-lime-400 flex items-center justify-center shrink-0 border border-lime-200/50 dark:border-lime-800/40">
                                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                                        {text}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
                            <a
                                href="#location"
                                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
                            >
                                <span>Visit Station</span>
                                <ArrowRight className="w-4 h-4" />
                            </a>
                            <a
                                href="#services"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-lime-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-bold text-sm shadow-2xs transition-all active:scale-95"
                            >
                                <span>View Refill Options</span>
                            </a>
                        </div>

                        {/* Trust Badges */}
                        <div className="pt-4 flex flex-wrap items-center gap-4 border-t border-slate-200/80 dark:border-slate-800">
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                                <HeartHandshake className="w-4 h-4 text-[#8DB600] dark:text-lime-400" />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    {isLoading ? '10k+' : `${formattedCount}+`} Served
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                                <ShieldCheck className="w-4 h-4 text-[#6abf45] dark:text-lime-400" />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Sanitary DOH Standards</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                                <Sparkles className="w-4 h-4 text-[#8DB600] dark:text-lime-400" />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Zero Plastic Waste Model</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT COLUMN: 3D Mascot & Storefront */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        className="lg:col-span-5 flex justify-center relative"
                    >
                        <div className="relative w-full max-w-lg lg:max-w-none rounded-3xl bg-gradient-to-b from-white/95 via-lime-50/40 to-lime-100/30 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-slate-950/80 p-4 sm:p-5 border border-lime-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between overflow-hidden min-h-[360px] sm:min-h-[420px]">
                            {/* Dot Grid Background Accent */}
                            <div className="absolute inset-0 bg-[radial-gradient(#8DB600_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

                            {/* Center-Aligned Scaled Image Viewport */}
                            <div className="relative z-10 w-full flex-1 flex items-center justify-center my-auto py-3 overflow-hidden">
                                <picture className="w-full flex items-center justify-center">
                                    <source media="(min-width: 768px)" srcSet="/seaside3d3.png" />
                                    <img
                                        src="/seaside3d4.png"
                                        alt="Seaside Water Refilling Station Mascot and Storefront"
                                        className="w-full h-auto max-h-[290px] sm:max-h-[340px] object-contain transform scale-125 sm:scale-135 filter drop-shadow-xl transition-transform duration-300"
                                    />
                                </picture>
                            </div>

                            {/* Floating Price Pill */}
                            <div className="relative z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-lime-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-md flex items-center justify-between mt-auto">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-[#8DB600] dark:text-lime-400">
                                        {settings?.business_name || 'Seaside'} Station
                                    </div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                        Always Fresh, Cold & Pure
                                    </div>
                                </div>
                                <span className="text-xs font-black px-2.5 py-1 bg-lime-100 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-300 rounded-lg border border-transparent dark:border-lime-800/50">
                                    ₱20-₱30 / Jug
                                </span>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}