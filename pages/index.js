// pages/index.js
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSettings } from '../src/hooks/useSettings';

import BackgroundImage from '../src/components/landing/BackgroundImage';
import Meta from '../src/components/landing/Meta';
import Header from '../src/components/landing/Header';
import Hero from '../src/components/landing/Hero';
import WhyChooseUs from '../src/components/landing/WhyChooseUs';
import Services from '../src/components/landing/Services';
import { Process as ProcessSection } from '../src/components/landing/ProcessSection';
import Gallery from '../src/components/landing/Gallery';
import Location from '../src/components/landing/Location';
import Contact from '../src/components/landing/Contact';
import Footer from '../src/components/landing/Footer';
import ScrollToTop from '../src/components/landing/ScrollToTop';
import ViewCounter from '../src/components/landing/ViewCounter';
import { AdsterraVerticalBanner } from '../src/components/landing/AdBanners';

const SeasideWaterLanding = () => {
    const { data: settings } = useSettings();
    const router = useRouter();

    useEffect(() => {
        const handleScroll = (hash) => {
            // A small delay to ensure the element is rendered.
            setTimeout(() => {
                const element = document.querySelector(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        };

        // For initial load
        if (router.isReady && window.location.hash) {
            handleScroll(window.location.hash);
        }

        const handleHashChangeComplete = (url) => {
            const hash = `#${url.split('#')[1]}`;
            handleScroll(hash);
        };

        // For subsequent navigation
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

            <div className="relative z-10 min-h-screen flex flex-col">
                <Header />

                <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-[1fr,minmax(0,4fr),1fr] gap-4 px-4">
                    {/* Left Sidebar */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-28">
                            <AdsterraVerticalBanner />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main id="main-content" className="flex-grow">
                        {/* CHANGED: Used bg-white-75 for 75% opacity */}
                        <div className="container mx-auto flex flex-col flex-grow relative backdrop-blur-sm shadow-lg bg-white-75">
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
                            <AdsterraVerticalBanner />
                        </div>
                    </aside>
                </div>

                <Footer />
            </div>

            <ScrollToTop />
        </div>
    );
};

export default SeasideWaterLanding;
