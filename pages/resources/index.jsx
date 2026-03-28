import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../src/lib/supabaseClient';
import { motion } from 'framer-motion';

// --- Adsterra Monetization Components ---
import Meta from '../../src/components/landing/Meta';
import Footer from '../../src/components/landing/Footer';
import { AdsterraVerticalBanner, AdsterraBanner } from '../../src/components/landing/AdBanners';

// --- High-Fidelity Reality 3D Icon Components ---
const IconWrapper = ({ children, index }) => (
    <div className="relative flex items-center justify-center">
        <motion.div
            className="absolute -bottom-2 w-12 h-2 bg-black/10 rounded-[100%] blur-md"
            animate={{ scale: [1, 0.7, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: index * 0.15 }}
        />
        <motion.div
            className="w-20 h-20 rounded-full bg-white relative z-10 flex items-center justify-center"
            style={{
                background: 'rgba(255, 255, 255, 1)',
                boxShadow: 'inset 0 -8px 10px rgba(0,0,0,0.05), inset 0 8px 15px rgba(255,255,255,1), 0 10px 30px rgba(0, 0, 0, 0.1)',
            }}
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: index * 0.15 }}
            whileHover={{ scale: 1.1, rotateZ: 5 }}
        >
            <div className="transform scale-110 drop-shadow-[0_5px_5px_rgba(0,0,0,0.15)]">
                {children}
            </div>
        </motion.div>
    </div>
);

// Realistic 3D SVG Assets
const DropletsIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <path d="M24 4C24 4 10 20 10 32C10 39.7 16.3 46 24 46C31.7 46 38 39.7 38 32C38 20 24 4 24 4Z" fill={`url(#${gradId})`} />
        <path opacity="0.4" d="M20 28C16 32 16 38 24 38" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

const ShieldIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <path d="M24 4L8 10V22C8 33 24 44 24 44C24 44 40 33 40 22V10L24 4Z" fill={`url(#${gradId})`} />
        <path d="M18 24L22 28L30 20" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SunIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="10" fill={`url(#${gradId})`} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
            <rect key={deg} x="22" y="4" width="4" height="8" rx="2" fill={`url(#${gradId})`} transform={`rotate(${deg} 24 24)`} />
        ))}
    </svg>
);

const IceIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <rect x="10" y="10" width="20" height="20" rx="4" fill={`url(#${gradId})`} transform="rotate(-10 24 24)" />
        <rect x="18" y="18" width="20" height="20" rx="4" fill={`url(#${gradId})`} opacity="0.7" transform="rotate(15 24 24)" />
    </svg>
);

const TruckIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <path d="M42 24H34V14H10V34H42V24Z" fill={`url(#${gradId})`} />
        <circle cx="16" cy="34" r="4" fill="#333" />
        <circle cx="36" cy="34" r="4" fill="#333" />
    </svg>
);

const MicroscopeIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <path d="M32 38H16M24 38V30M24 10L30 24L24 28L18 14L24 10Z" stroke={`url(#${gradId})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="10" r="4" fill={`url(#${gradId})`} />
    </svg>
);

const HeartPulseIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <path d="M24 44C24 44 6 32 6 20C6 13 12 8 18 8C21 8 23 10 24 12C25 10 27 8 30 8C36 8 42 13 42 20C42 32 24 44 24 44Z" fill={`url(#${gradId})`} />
        <path d="M14 22H18L21 16L27 28L30 22H34" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const AlertIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <path d="M24 6L4 40H44L24 6Z" fill={`url(#${gradId})`} />
        <rect x="22" y="20" width="4" height="10" rx="2" fill="white" />
        <circle cx="24" cy="34" r="2" fill="white" />
    </svg>
);

const BookIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <path d="M10 12C10 12 16 8 24 12C32 8 38 12 38 12V40C38 40 32 36 24 40C16 36 10 40 10 40V12Z" fill={`url(#${gradId})`} />
        <line x1="24" y1="12" x2="24" y2="40" stroke="white" strokeWidth="2" />
    </svg>
);

const IconMap = {
    Droplets: DropletsIcon,
    Shield: ShieldIcon,
    Sun: SunIcon,
    Snowflake: IceIcon,
    Truck: TruckIcon,
    Microscope: MicroscopeIcon,
    HeartPulse: HeartPulseIcon,
    AlertTriangle: AlertIcon,
    BookOpen: BookIcon
};

export default function ResourcesPage({ articles }) {
    // Scroll state tracker
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Trigger the "scrolled" state when user scrolls past 60px
            setIsScrolled(window.scrollY > 60);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <Meta /> {/* Triggers Adsterra Popunders for passive revenue */}

            <div className="min-h-screen font-sans bg-slate-50 flex flex-col justify-between relative">

                {/* FLOATING & SCALING BACK BUTTON */}
                <div
                    className={`fixed z-50 transition-all duration-300 ease-out origin-top-left
                        ${isScrolled
                        ? 'top-4 left-4 md:top-6 md:left-6 scale-[1.15] shadow-2xl'
                        : 'top-12 left-8 md:top-24 md:left-[100px] scale-100 shadow-sm'
                    }
                    `}
                >
                    <Link href="/"
                          className={`inline-flex items-center w-max backdrop-blur-md rounded-full text-slate-900 hover:text-black font-extrabold uppercase tracking-[0.2em] transition-colors
                            ${isScrolled ? 'bg-white px-5 py-3 text-[13px] border border-slate-100' : 'bg-white/70 px-4 py-2 text-xs'}
                        `}
                    >
                        <ArrowLeft className={`${isScrolled ? 'w-5 h-5' : 'w-4 h-4'} mr-2 transition-all duration-300`} />
                        Back to Home
                    </Link>
                </div>

                <div className="w-full flex-grow flex flex-col lg:flex-row">

                    {/* LEFT CONTENT AREA */}
                    <div className="w-full lg:w-3/4 flex flex-col items-start py-8 px-4 md:py-16 md:px-20">
                        <Head>
                            <title>Knowledge Hub | Seaside Purified Water</title>
                        </Head>

                        {/* HERO HEADER SECTION WITH WALLPAPER */}
                        <div className="relative w-full xl:w-4/5 h-[50vh] min-h-[400px] mb-10 rounded-2xl overflow-hidden shadow-md">
                            {/* Background Image Layer */}
                            <div
                                className="absolute inset-0 bg-cover bg-center md:bg-top"
                                style={{ backgroundImage: "url('/resourceswallpaper.png')" }}
                            />

                            {/* Slight white gradient at the bottom to ensure text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-white/10 to-transparent" />

                            {/* Content Over the Image */}
                            <div className="absolute inset-0 flex flex-col p-6 md:p-10">
                                {/* The back button was removed from here because it is now fixed to the viewport above */}

                                {/* Title Text Wrapper: Bottom on mobile, Center on desktop (md/lg) */}
                                <div className="flex-1 flex flex-col justify-end md:justify-center">
                                    <h1 className="text-[3.5rem] sm:text-[4.5rem] lg:text-[6rem] font-black text-black tracking-tighter leading-[0.85] drop-shadow-sm">
                                        <span style={{
                                            background: 'linear-gradient(to right, #8DB600, #0d9488)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                            color: 'transparent'
                                        }}>SEASIDE</span> <br />Knowledge Hub
                                    </h1>

                                    {/* Mobile-only Subtitle */}
                                    <p className="block md:hidden mt-3 text-sm font-bold text-white leading-tight max-w-[280px] drop-shadow-md">
                                        A collection of articles to help you understand the importance of pure water for your family's health and well-being.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Article Container (Clean White Box Below the Hero) */}
                        <div className="w-full xl:w-4/5 bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-100">

                            {/* LATEST RELEASE */}
                            {articles.length > 0 && (
                                <div className="mb-12 flex flex-col items-start pt-2 border-b border-slate-100 pb-12">
                                    <span className="text-slate-500 font-black text-sm tracking-[0.3em] uppercase mb-4">Latest Release</span>
                                    <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 leading-[0.9] tracking-tighter max-w-lg">
                                        {articles[0].title}
                                    </h3>
                                    <Link href={`/resources/${articles[0].slug}`} className="inline-flex items-center justify-center px-10 py-4 bg-black hover:bg-slate-800 text-white rounded-full font-black text-sm uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95">
                                        Read Now
                                    </Link>
                                </div>
                            )}

                            {/* ARTICLE LIST */}
                            <div className="flex flex-col gap-12 mt-6">
                                {articles.map((article, index) => {
                                    const Icon = IconMap[article.icon_name] || BookIcon;
                                    const gradId = `resource-grad-${index}`;

                                    return (
                                        <Link key={article.id} href={`/resources/${article.slug}`} className="group flex flex-col md:flex-row items-start gap-8 transition-all duration-300">
                                            {/* UPDATED SVG LINEAR GRADIENT */}
                                            <svg width="0" height="0" className="absolute">
                                                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#8DB600" />
                                                    <stop offset="100%" stopColor="#0d9488" />
                                                </linearGradient>
                                            </svg>

                                            <IconWrapper index={index}>
                                                <Icon gradId={gradId} />
                                            </IconWrapper>

                                            <div className="flex-1 pt-2">
                                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 group-hover:text-teal-700 transition-colors leading-tight">
                                                    {article.title}
                                                </h2>
                                                <p className="text-base md:text-lg text-slate-600 leading-relaxed font-medium">
                                                    {article.description}
                                                </p>
                                                <span className="inline-flex items-center mt-4 text-teal-700 font-bold text-xs uppercase tracking-widest group-hover:gap-3 transition-all">
                                                    Read Article <span className="ml-2">→</span>
                                                </span>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Mobile Adsterra Banner (Shows only on small screens) */}
                        <div className="w-full flex justify-center mt-16 lg:hidden">
                            <AdsterraBanner />
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR (Adsterra 160x600 Banner) */}
                    <aside className="hidden lg:flex lg:w-1/4 justify-center items-start pt-16 pr-8 pb-10 border-l border-slate-200">
                        <div className="sticky top-32">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 block text-center">Advertisement</span>
                            <AdsterraVerticalBanner />
                        </div>
                    </aside>

                </div>

                {/* Footer */}
                <div className="w-full bg-white relative z-20 border-t border-slate-200">
                    <Footer />
                </div>
            </div>
        </>
    );
}

export async function getServerSideProps() {
    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, slug, description, icon_name')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    return {
        props: {
            articles: articles || [],
        },
    };
}