// src/components/landing/Hero.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, MapPin, ArrowRight, Sparkles, HeartHandshake } from 'lucide-react';
import { useCustomers } from '../../hooks/useCustomers';

export default function Hero() {
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
            {/* Ambient Apple Green Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#8DB600]/25 via-lime-200/30 to-[#6abf45]/20 blur-3xl -z-10 rounded-full pointer-events-none" />

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
                        <div className="inline-flex items-center gap-2 w-max px-3.5 py-1.5 rounded-full bg-lime-50 border border-lime-200/90 shadow-xs">
                            <span className="flex h-2 w-2 rounded-full bg-[#8DB600] animate-pulse" />
                            <MapPin className="w-3.5 h-3.5 text-[#8DB600]" />
                            <span className="text-xs font-bold uppercase tracking-wider text-lime-900">
                                Labrador, Pangasinan's Pure Hydration
                            </span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
                            Your Family's Health,{' '}
                            <span className="bg-gradient-to-r from-[#8DB600] via-[#6abf45] to-[#4e9e2d] bg-clip-text text-transparent">
                                Flowing Crystal Clear
                            </span>{' '}
                            from Seaside.
                        </h1>

                        {/* Subheading */}
                        <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-xl">
                            We combine commercial-grade 21-stage reverse osmosis filtration with warm local care, delivering 100% pure, remineralized drinking water straight to your home and business.
                        </p>

                        {/* Highlight Cards */}
                        <div className="space-y-2.5 max-w-xl pt-1">
                            {keyHighlights.map((text, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/70 shadow-2xs hover:border-[#8DB600]/60 transition-colors"
                                >
                                    <div className="w-6 h-6 rounded-lg bg-lime-100 text-[#8DB600] flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
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
                                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-lime-50 text-slate-800 border border-slate-200 font-bold text-sm shadow-2xs transition-all active:scale-95"
                            >
                                <span>View Refill Options</span>
                            </a>
                        </div>

                        {/* Trust Badges */}
                        <div className="pt-4 flex flex-wrap items-center gap-4 border-t border-slate-200/80">
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-2xs">
                                <HeartHandshake className="w-4 h-4 text-[#8DB600]" />
                                <span className="text-xs font-bold text-slate-700">
                                    {isLoading ? '10k+' : `${formattedCount}+`} Served
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-2xs">
                                <ShieldCheck className="w-4 h-4 text-[#6abf45]" />
                                <span className="text-xs font-bold text-slate-700">Sanitary DOH Standards</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-2xs">
                                <Sparkles className="w-4 h-4 text-[#8DB600]" />
                                <span className="text-xs font-bold text-slate-700">Zero Plastic Waste Model</span>
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
                        <div className="relative w-full max-w-lg lg:max-w-none aspect-[4/3.8] rounded-3xl bg-gradient-to-b from-white/95 via-lime-50/40 to-lime-100/30 p-4 sm:p-6 border border-lime-200/80 shadow-xl flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(#8DB600_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

                            <picture className="relative z-10 w-full h-full flex items-center justify-center">
                                <source media="(min-width: 768px)" srcSet="/seaside3d3.png" />
                                <img
                                    src="/seaside3d4.png"
                                    alt="Seaside Water Refilling Station Mascot and Storefront"
                                    className="w-full h-full object-contain filter drop-shadow-xl"
                                />
                            </picture>

                            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-lime-200/90 rounded-2xl p-3 shadow-md flex items-center justify-between z-20">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-[#8DB600]">Labrador Station</div>
                                    <div className="text-xs font-bold text-slate-900">Always Fresh, Cold & Pure</div>
                                </div>
                                <span className="text-xs font-black px-2.5 py-1 bg-lime-100 text-[#5f7d00] rounded-lg">
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