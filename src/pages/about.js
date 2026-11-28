// src/pages/about.js
import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSettings } from '../hooks/useSettings';
import { usePublicStore } from '../hooks/usePublicStore';
import { useStore } from '../store/useStore';

import SafeWebGL from '../components/SafeWebGL';
import BackgroundImage from '../components/landing/BackgroundImage';
import LandingBackground from '../components/landing/LandingBackground';
import LandingGlobalStyles from '../components/landing/LandingGlobalStyles';
import AnimatedLandingIcon from '../components/landing/AnimatedLandingIcon';
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

function RevealSection({ children, delay = 0 }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.08 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-700 ease-out transform-gpu ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
        >
            {children}
        </div>
    );
}

export default function SeasideWaterLanding() {
    const router = useRouter();
    const storeSlug = typeof router.query.store === 'string' ? router.query.store : undefined;

    const { data: store } = usePublicStore(storeSlug);
    const { data: settings } = useSettings(store?.id);
    const darkMode = useStore((s) => s.darkMode);
    const toggleDarkMode = useStore((s) => s.toggleDarkMode);
    const [scrolled, setScrolled] = useState(false);

    // Merge store record + business_settings so every child component gets unified tenant branding
    const effectiveSettings = useMemo(() => {
        const branding = store?.branding || {};
        return {
            ...settings,
            store_id: store?.id ?? settings?.store_id ?? 1,
            store_slug: store?.slug ?? settings?.store_slug ?? null,
            business_name: store?.name || settings?.business_name || 'Seaside',
            tagline: store?.tagline || settings?.tagline || 'Water Refilling Station',
            logo_url: store?.logo_url || settings?.logo_url || '/seaside.png',
            physical_address: store?.address || settings?.physical_address || 'Barangay Laois, Labrador, 2402 Pangasinan',
            contact_number: store?.contact_number || settings?.contact_number || '+639602196388',
            email: branding.email || settings?.email || 'seasidewrs@gmail.com',
            business_hours: branding.operatingHours || settings?.business_hours || 'Mon - Sat: 8:00 AM - 5:00 PM',
            location_embed: branding.mapEmbedUrl || settings?.location_embed || '',
            location_description: branding.locationDescription || settings?.location_description || '',
            delivery_areas: branding.deliveryAreas || settings?.delivery_areas || null,
            station_label: branding.stationLabel || settings?.station_label || '',
            messenger_link: branding.messengerUrl || settings?.messenger_link || '',
            facebook_link: branding.facebookUrl || settings?.facebook_link || '',
            about_content: branding.aboutContent || settings?.about_content || '',
            primary_color: store?.primary_color || settings?.primary_color || '#8DB600'
        };
    }, [store, settings]);

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

    const businessName = effectiveSettings.business_name;
    const logoUrl = effectiveSettings.logo_url;
    const isExternalLogo = typeof logoUrl === 'string' && logoUrl.startsWith('http');
    const contactPhone = effectiveSettings.contact_number;
    const cleanSmsNumber = contactPhone.replace(/[^0-9+]/g, '');
    const smsBody = encodeURIComponent(
        `Hi ${businessName}, I would like to inquire about water refills.`
    );
    const messengerLink =
        effectiveSettings.messenger_link ||
        effectiveSettings.facebook_link ||
        'https://www.facebook.com/share/1CSQtnEWYf/';

    return (
        <div className="landing-about-root relative min-h-screen w-full font-sans bg-gradient-to-br from-[#f3fae6] via-[#ecfdf5] to-[#e0f2fe] dark:from-[#060b13] dark:via-[#08101c] dark:to-[#060b13] text-slate-800 dark:text-slate-100 antialiased selection:bg-[#8DB600] selection:text-white dark:[color-scheme:dark] transition-colors duration-300 overflow-x-hidden">
            <BackgroundImage />
            <SafeWebGL fallback={null}>
                <LandingBackground />
            </SafeWebGL>
            <Meta settings={effectiveSettings} store={store} />
            <ViewCounter storeId={effectiveSettings.store_id} />

            {/* Navigation Header */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                    scrolled
                        ? 'bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-sm dark:shadow-black/50 border-b border-slate-200/80 dark:border-white/10 py-3'
                        : 'bg-transparent py-4 sm:py-5'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group seaside-brand-enter">
                        <div className="relative w-10 h-10 overflow-hidden rounded-xl bg-white/90 dark:bg-white/10 backdrop-blur-md shadow-2xs border border-slate-200/80 dark:border-white/15 flex items-center justify-center p-1 seaside-tile-glow group-hover:scale-105 transition-transform shrink-0">
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 seaside-brand-sheen"
                            />
                            <Image
                                src={logoUrl}
                                alt={`${businessName} Logo`}
                                width={36}
                                height={36}
                                unoptimized={isExternalLogo}
                                className="relative z-10 object-contain w-full h-full seaside-palm-breeze"
                                priority
                            />
                        </div>
                        <div className="seaside-wordmark-enter">
                            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 block leading-tight">
                                {businessName}
                            </span>
                            <span className="text-[10px] font-black tracking-widest uppercase text-[#659000] dark:text-[#a3d100] block">
                                {effectiveSettings.tagline}
                            </span>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <a href="#services" className="hover:text-[#659000] dark:hover:text-[#a3d100] transition-colors">
                            Services
                        </a>
                        <a href="#why-choose" className="hover:text-[#659000] dark:hover:text-[#a3d100] transition-colors">
                            Why {businessName}
                        </a>
                        <a href="#process" className="hover:text-[#659000] dark:hover:text-[#a3d100] transition-colors">
                            Our Process
                        </a>
                        <a href="#location" className="hover:text-[#659000] dark:hover:text-[#a3d100] transition-colors">
                            Location
                        </a>
                        <a href="#contact" className="hover:text-[#659000] dark:hover:text-[#a3d100] transition-colors">
                            Contact
                        </a>
                    </nav>

                    <div className="flex items-center gap-2.5">
                        {typeof toggleDarkMode === 'function' && (
                            <button
                                type="button"
                                onClick={toggleDarkMode}
                                className="p-2 rounded-xl bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200/80 dark:border-white/15 text-slate-700 dark:text-slate-200 shadow-2xs backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center justify-center"
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

                        <Link
                            href="/"
                            style={{
                                background:
                                    'linear-gradient(135deg, #8DB600 0%, #65a30d 55%, #0d9488 100%)',
                                color: '#ffffff'
                            }}
                            className="relative overflow-hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-lime-600/25 border border-lime-300/30 transition-all duration-200 hover:scale-[1.02] active:scale-95 group"
                        >
                            <AnimatedLandingIcon name="arrowRight" size={18} strokeColor="#ffffff" />
                            <span>Staff Portal</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main
                id="main-content"
                className="relative z-10 pt-20 md:pt-24 pb-20 md:pb-0 flex flex-col flex-grow"
            >
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
                    <Hero settings={effectiveSettings} store={store} />

                    <RevealSection>
                        <WhyChooseUs settings={effectiveSettings} store={store} />
                    </RevealSection>

                    <RevealSection>
                        <Services settings={effectiveSettings} store={store} />
                    </RevealSection>

                    <RevealSection>
                        <ProcessSection settings={effectiveSettings} store={store} />
                    </RevealSection>

                    <RevealSection>
                        <Gallery storeId={effectiveSettings.store_id} settings={effectiveSettings} />
                    </RevealSection>

                    <RevealSection>
                        <Location settings={effectiveSettings} store={store} />
                    </RevealSection>

                    <RevealSection>
                        <Contact settings={effectiveSettings} store={store} />
                    </RevealSection>
                </div>
                <Footer settings={effectiveSettings} store={store} />
            </main>

            <ScrollToTop />

            {/* Mobile Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-black/60 flex gap-3 z-50 md:hidden transition-colors">
                <Button
                    className="flex-1 bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold h-11 rounded-xl shadow-xs flex items-center justify-center gap-2 text-xs active:scale-95 transition-all"
                    onClick={() => {
                        window.location.href = `sms:${cleanSmsNumber}?body=${smsBody}`;
                    }}
                >
                    <AnimatedLandingIcon name="mail" size={18} strokeColor="#ffffff" />
                    <span>Text Message</span>
                </Button>
                <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl shadow-xs flex items-center justify-center gap-2 text-xs active:scale-95 transition-all"
                    onClick={() => window.open(messengerLink, '_blank')}
                >
                    <AnimatedLandingIcon name="messenger" size={18} strokeColor="#ffffff" />
                    <span>Messenger</span>
                </Button>
            </div>

            <LandingGlobalStyles />

            {/* Universal Contrast Cascade */}
            <style jsx global>{`
                .landing-about-root input[type='text'],
                .landing-about-root input[type='email'],
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
                    border-color: #8db600 !important;
                    outline: 2px solid rgba(141, 182, 0, 0.2) !important;
                }

                .landing-about-root form label,
                .landing-about-root [id='contact'] label,
                .landing-about-root [id='contact'] .text-slate-400,
                .landing-about-root [id='contact'] .text-slate-500 {
                    color: #475569 !important;
                    font-weight: 700 !important;
                }
                .landing-about-root [id='contact'] h3,
                .landing-about-root [id='contact'] h4,
                .landing-about-root [id='contact'] .text-white:not(button):not([class*='bg-']) {
                    color: #0f172a !important;
                    font-weight: 700 !important;
                }

                .landing-about-root [id='contact'] > div > div,
                .landing-about-root [id='contact'] .border-slate-800 {
                    border-color: #e2e8f0 !important;
                }

                .dark .landing-about-root h1:not([class*='text-lime']):not([class*='text-[#8DB600]']),
                .dark .landing-about-root h2:not([class*='text-lime']):not([class*='text-[#8DB600]']),
                .dark .landing-about-root h3:not([class*='text-lime']):not([class*='text-[#8DB600]']),
                .dark .landing-about-root .text-slate-900,
                .dark .landing-about-root .text-slate-800 {
                    color: #f8fafc !important;
                }

                .dark .landing-about-root p,
                .dark .landing-about-root .text-slate-700,
                .dark .landing-about-root .text-slate-600 {
                    color: #cbd5e1 !important;
                }

                .dark .landing-about-root .bg-white,
                .dark .landing-about-root .bg-slate-50 {
                    background-color: rgba(15, 23, 42, 0.85) !important;
                    border-color: #334155 !important;
                }

                .dark .landing-about-root input[type='text'],
                .dark .landing-about-root input[type='email'],
                .dark .landing-about-root textarea {
                    background-color: #0f172a !important;
                    border-color: #334155 !important;
                    color: #f8fafc !important;
                }
                .dark .landing-about-root input::placeholder,
                .dark .landing-about-root textarea::placeholder {
                    color: #64748b !important;
                }

                .dark .landing-about-root form label,
                .dark .landing-about-root [id='contact'] label,
                .dark .landing-about-root [id='contact'] .text-slate-400,
                .dark .landing-about-root [id='contact'] .text-slate-500 {
                    color: #94a3b8 !important;
                }
                .dark .landing-about-root [id='contact'] h3,
                .dark .landing-about-root [id='contact'] h4,
                .dark .landing-about-root [id='contact'] .text-white {
                    color: #f8fafc !important;
                }

                .landing-about-root .text-\\[\\#8DB600\\],
                .landing-about-root [class*='text-[#8DB600]'] {
                    color: #8db600 !important;
                }
                .dark .landing-about-root .text-\\[\\#8DB600\\],
                .dark .landing-about-root [class*='text-[#8DB600]'],
                .dark .landing-about-root .text-lime-400 {
                    color: #a3e635 !important;
                }
            `}</style>
        </div>
    );
}