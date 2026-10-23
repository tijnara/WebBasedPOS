// src/pages/about.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSettings } from '../hooks/useSettings';
import { useStore } from '../store/useStore';

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
    const user = useStore(state => state.user);
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

    return (
        <div className="relative min-h-screen w-full font-sans bg-slate-50 text-slate-800 antialiased selection:bg-[#8DB600] selection:text-white">
            <BackgroundImage />
            <Meta />
            <ViewCounter />

            {/* Apple Green Glassmorphic Navigation Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled
                    ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-lime-200/60 py-3'
                    : 'bg-transparent py-5'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative w-10 h-10 overflow-hidden rounded-xl bg-white shadow-xs border border-lime-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Image
                                src="/seaside.png"
                                alt="Seaside Logo"
                                width={36}
                                height={36}
                                className="object-contain"
                                priority
                            />
                        </div>
                        <div>
                            <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">
                                Seaside
                            </span>
                            <span className="text-[10px] font-black tracking-widest uppercase text-[#8DB600] block">
                                Water Refilling Station
                            </span>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
                        <a href="#services" className="hover:text-[#8DB600] transition-colors">Services</a>
                        <a href="#why-choose" className="hover:text-[#8DB600] transition-colors">Why Seaside</a>
                        <a href="#process" className="hover:text-[#8DB600] transition-colors">Our Process</a>
                        <a href="#location" className="hover:text-[#8DB600] transition-colors">Location</a>
                        <a href="#contact" className="hover:text-[#8DB600] transition-colors">Contact</a>
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

            {/* Main Content Sections */}
            <main id="main-content" className="relative z-10 pt-20 md:pt-24 flex flex-col flex-grow">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
                    <Hero />
                    <WhyChooseUs />
                    <Services />
                    <ProcessSection />
                    <Gallery />
                    <Location settings={settings} />
                    <Contact settings={settings} />
                </div>
                <Footer />
            </main>

            <ScrollToTop />

            {/* Mobile Call / Messenger Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg flex gap-3 z-50 md:hidden">
                <Button
                    className="flex-1 bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold h-11 rounded-xl shadow-xs flex items-center justify-center gap-2 text-xs"
                    onClick={() => window.location.href = 'tel:+639602196388'}
                >
                    <Phone className="w-4 h-4" /> Call Now
                </Button>
                <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl shadow-xs flex items-center justify-center gap-2 text-xs"
                    onClick={() => window.open('https://m.me/61587059323111', '_blank')}
                >
                    <MessageSquare className="w-4 h-4" /> Messenger
                </Button>
            </div>
        </div>
    );
}