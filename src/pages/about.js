// pages/about.js
import React, { useEffect } from 'react';
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
import { AdsterraVerticalBanner } from '../components/landing/AdBanners';
import { Button } from '../components/ui';

const SeasideWaterLanding = () => {
    const { data: settings } = useSettings();
    const router = useRouter();
    const user = useStore(state => state.user);

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

        return () => {
            router.events.off('hashChangeComplete', handleHashChangeComplete);
        };
    }, [router.isReady, router.events]);

    return (
        <div className="relative min-h-screen w-full font-sans text-slate-800 responsive-page">

            <BackgroundImage />
            <Meta />
            <ViewCounter />

            {/* NEW: Floating "Back to Home/Login" Button */}
            <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-[100]">
                <a
                    href="/"
                    className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-teal-100 text-teal-700 font-bold hover:bg-teal-50 hover:scale-105 transition-all duration-300 group"
                >
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    <span className="text-sm tracking-wide">Back to Login</span>
                </a>
            </div>

            <div className="relative z-10 min-h-screen flex flex-col">
                <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-[1fr,minmax(0,4fr),1fr] lg:gap-4 lg:px-4">
                    {/* Left Sidebar */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-28">
                            {!user && <AdsterraVerticalBanner />}
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main id="main-content" className="flex-grow w-full">
                        <div className="w-full flex flex-col flex-grow relative backdrop-blur-sm shadow-lg bg-white/75">
                            <Hero />
                            <WhyChooseUs />
                            <Services />
                            <ProcessSection />
                            <Gallery />
                            <Location settings={settings} />
                            <Contact settings={settings} />
                        </div>
                    </main>

                    {/* Right Sidebar */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-28">
                            {!user && <AdsterraVerticalBanner />}
                        </div>
                    </aside>
                </div>

                <Footer />
            </div>

            <ScrollToTop />

            {/* Mobile Bottom Navigation Action Buttons */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex gap-3 z-50 md:hidden">
                <Button className="flex-1 bg-primary text-white font-bold h-12 rounded-xl" onClick={() => window.location.href = 'tel:+639602196388'}>
                    Call Now
                </Button>
                <Button className="flex-1 bg-blue-600 text-white font-bold h-12 rounded-xl" onClick={() => window.open('https://m.me/61587059323111', '_blank')}>
                    Messenger
                </Button>
            </div>
        </div>
    );
};

export default SeasideWaterLanding;