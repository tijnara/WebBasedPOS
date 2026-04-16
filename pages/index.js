// pages/index.js
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSettings } from '../src/hooks/useSettings';
import { useStore } from '../src/store/useStore';

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

            {/* ONLY RENDER THE POPUNDER SCRIPT IF THE USER IS LOGGED OUT */}
            {!user && (
                <Head>
                    <script
                        type="text/javascript"
                        src="https://pl28955515.profitablecpmratenetwork.com/31/66/b5/3166b5f32c1e188a1b6d87c24ff4add8.js"
                        async
                    />
                </Head>
            )}

            <BackgroundImage />
            <Meta />
            <ViewCounter />

            <div className="relative z-10 min-h-screen flex flex-col">
                <Header />

                <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-[1fr,minmax(0,4fr),1fr] gap-4 px-4">
                    {/* Left Sidebar */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-28">
                            {!user && <AdsterraVerticalBanner />}
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main id="main-content" className="flex-grow">
                        <div className="container mx-auto flex flex-col flex-grow relative backdrop-blur-sm shadow-lg bg-white/75">
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
        </div>
    );
};

export default SeasideWaterLanding;