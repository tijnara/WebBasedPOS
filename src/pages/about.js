// src/pages/about.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSettings } from '../hooks/useSettings';

import BackgroundImage from '../components/landing/BackgroundImage';
import Meta from '../components/landing/Meta';
import Hero from '../components/landing/Hero';
import WhyChooseUs from '../components/landing/WhyChooseUs';
import Services from '../components/landing/Services';
import { Process as ProcessSection } from '../components/landing/ProcessSection';
import Gallery from '../components/landing/Gallery';
import Location from '../components/landing/Location';
import Contact from '../components/landing/Contact';
import Footer from '../components/landing/Footer';
import ScrollToTop from '../components/landing/ScrollToTop';
import ViewCounter from '../components/landing/ViewCounter';
import { Button } from '../components/ui';
import { Phone, MessageSquare, LogIn } from 'lucide-react';

export default function SeasideWaterLanding() {
    const { data: settings } = useSettings();
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const handleScroll = (hash) => {
            setTimeout(() => {
                const element = document.querySelector(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        };

        if (router.isReady && window.location.hash) {
            handleScroll(window.location.hash);
        }

        const handleHashChangeComplete = (url) => {
            const hash = `#${url.split('#')[1]}`;
            handleScroll(hash);
        };

        router.events.on('hashChangeComplete', handleHashChangeComplete);
        return () => router.events.off('hashChangeComplete', handleHashChangeComplete);
    }, [router.isReady, router.events]);

    const contactPhone = settings?.contact_number || '+639602196388';
    const messengerLink = settings?.messenger_link || 'https://m.me/61587059323111';

    return (
        <div className="landing-about-root relative min-h-screen w-full font-sans bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased selection:bg-[#8DB600] selection:text-white dark:[color-scheme:dark] transition-colors duration-300">
            <BackgroundImage />
            <Meta />
            <ViewCounter />

            {/* Navigation Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled
                    ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm dark:shadow-black/50 border-b border-slate-200/80 dark:border-slate-800 py-3'
                    : 'bg-transparent py-4 sm:py-5'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative w-10 h-10 overflow-hidden rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 group-hover:scale-105 transition-transform shrink-0">
                            <Image
                                src={settings?.logo_url || "/seaside.png"}
                                alt="Seaside Logo"
                                width={36}
                                height={36}
                                className="object-contain w-full h-full"
                                priority
                            />
                        </div>
                        <div>
                            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 block leading-tight">
                                {settings?.business_name || 'Seaside'}
                            </span>
                            <span className="text-[10px] font-black tracking-widest uppercase text-[#8DB600] dark:text-lime-400 block">
                                Water Refilling Station
                            </span>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <a href="#services" className="hover:text-[#8DB600] dark:hover:text-lime-400 transition-colors">Services</a>
                        <a href="#why-choose" className="hover:text-[#8DB600] dark:hover:text-lime-400 transition-colors">Why Seaside</a>
                        <a href="#process" className="hover:text-[#8DB600] dark:hover:text-lime-400 transition-colors">Our Process</a>
                        <a href="#location" className="hover:text-[#8DB600] dark:hover:text-lime-400 transition-colors">Location</a>
                        <a href="#contact" className="hover:text-[#8DB600] dark:hover:text-lime-400 transition-colors">Contact</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 bg-[#8DB600] hover:bg-[#7ca000] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all duration-200 active:scale-95"
                        >
                            <LogIn className="w-4 h-4" />
                            <span>Staff Portal</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main id="main-content" className="relative z-10 pt-20 md:pt-24 pb-20 md:pb-0 flex flex-col flex-grow">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
                    <Hero settings={settings} />
                    <WhyChooseUs />
                    <Services settings={settings} />
                    <ProcessSection />
                    <Gallery />
                    <Location settings={settings} />
                    <Contact settings={settings} />
                </div>
                <Footer settings={settings} />
            </main>

            <ScrollToTop />

            {/* Mobile Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-black/60 flex gap-3 z-50 md:hidden transition-colors">
                <Button
                    className="flex-1 bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold h-11 rounded-xl shadow-xs flex items-center justify-center gap-2 text-xs active:scale-95 transition-all"
                    onClick={() => window.location.href = `tel:${contactPhone.replace(/\s+/g, '')}`}
                >
                    <Phone className="w-4 h-4" /> Call Now
                </Button>
                <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl shadow-xs flex items-center justify-center gap-2 text-xs active:scale-95 transition-all"
                    onClick={() => window.open(messengerLink, '_blank')}
                >
                    <MessageSquare className="w-4 h-4" /> Messenger
                </Button>
            </div>

            {/* Universal Contrast Cascade (Works in both Light & Dark modes) */}
            <style jsx global>{`
                /* =========================================================
                   1. LIGHT MODE RULES (Default - when .dark is NOT present)
                   ========================================================= */

                /* Contact form inputs and textareas */
                .landing-about-root input[type="text"],
                .landing-about-root input[type="email"],
                .landing-about-root textarea {
                    background-color: #f8fafc !important;
                    border: 1px solid #cbd5e1 !important;
                    color: #0f172a !important;
                    font-weight: 500 !important;
                }
                .landing-about-root input::placeholder,
                .landing-about-root textarea::placeholder {
                    color: #94a3b8 !important;
                }
                .landing-about-root input:focus,
                .landing-about-root textarea:focus {
                    background-color: #ffffff !important;
                    border-color: #8DB600 !important;
                    outline: 2px solid rgba(141, 182, 0, 0.2) !important;
                }

                /* Contact Section Labels (Fixes white-on-white text in Light Mode) */
                .landing-about-root form label,
                .landing-about-root [id="contact"] label,
                .landing-about-root [id="contact"] .text-slate-400,
                .landing-about-root [id="contact"] .text-slate-500 {
                    color: #475569 !important;
                    font-weight: 700 !important;
                }
                .landing-about-root [id="contact"] h3,
                .landing-about-root [id="contact"] h4,
                .landing-about-root [id="contact"] .text-white:not(button):not([class*="bg-"]) {
                    color: #0f172a !important;
                    font-weight: 700 !important;
                }

                /* Contact Cards in Light Mode */
                .landing-about-root [id="contact"] > div > div,
                .landing-about-root [id="contact"] .border-slate-800 {
                    border-color: #e2e8f0 !important;
                }

                /* =========================================================
                   2. DARK MODE RULES (Active when .dark class is on <html>)
                   ========================================================= */

                /* Headings */
                .dark .landing-about-root h1:not([class*="text-lime"]):not([class*="text-[#8DB600]"]),
                .dark .landing-about-root h2:not([class*="text-lime"]):not([class*="text-[#8DB600]"]),
                .dark .landing-about-root h3:not([class*="text-lime"]):not([class*="text-[#8DB600]"]),
                .dark .landing-about-root .text-slate-900,
                .dark .landing-about-root .text-slate-800 {
                    color: #f8fafc !important;
                }

                /* Body copy */
                .dark .landing-about-root p,
                .dark .landing-about-root .text-slate-700,
                .dark .landing-about-root .text-slate-600 {
                    color: #cbd5e1 !important;
                }

                /* Cards and surfaces in Dark Mode */
                .dark .landing-about-root .bg-white,
                .dark .landing-about-root .bg-slate-50 {
                    background-color: rgba(15, 23, 42, 0.9) !important;
                    border-color: #334155 !important;
                }

                /* Form inputs in Dark Mode */
                .dark .landing-about-root input[type="text"],
                .dark .landing-about-root input[type="email"],
                .dark .landing-about-root textarea {
                    background-color: #0f172a !important;
                    border-color: #334155 !important;
                    color: #f8fafc !important;
                }
                .dark .landing-about-root input::placeholder,
                .dark .landing-about-root textarea::placeholder {
                    color: #64748b !important;
                }

                /* Contact section labels in Dark Mode */
                .dark .landing-about-root form label,
                .dark .landing-about-root [id="contact"] label,
                .dark .landing-about-root [id="contact"] .text-slate-400,
                .dark .landing-about-root [id="contact"] .text-slate-500 {
                    color: #94a3b8 !important;
                }
                .dark .landing-about-root [id="contact"] h3,
                .dark .landing-about-root [id="contact"] h4,
                .dark .landing-about-root [id="contact"] .text-white {
                    color: #f8fafc !important;
                }

                /* =========================================================
                   3. BRAND ACCENTS (Preserved in both modes)
                   ========================================================= */
                .landing-about-root .text-\\[\\#8DB600\\],
                .landing-about-root [class*="text-[#8DB600]"] {
                    color: #8DB600 !important;
                }
                .dark .landing-about-root .text-\\[\\#8DB600\\],
                .dark .landing-about-root [class*="text-[#8DB600]"],
                .dark .landing-about-root .text-lime-400 {
                    color: #a3e635 !important;
                }
            `}</style>
        </div>
    );
}