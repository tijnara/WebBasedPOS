// src/components/pages/LandingPage.jsx
import React from 'react';
import { useGallery } from '../../hooks/useGallery';
import { useSettings } from '../../hooks/useSettings';

import BackgroundImage from '../landing/BackgroundImage';
import Meta from '../landing/Meta';
import Header from '../landing/Header';
import Hero from '../landing/Hero';
import WhyChooseUs from '../landing/WhyChooseUs';
import Services from '../landing/Services';
import ProcessSection from '../landing/ProcessSection';
import Gallery from '../landing/Gallery';
import Location from '../landing/Location';
import Contact from '../landing/Contact';
import Footer from '../landing/Footer';
import ScrollToTop from '../landing/ScrollToTop';
import ViewCounter from '../landing/ViewCounter';
import { AdsterraVerticalBanner } from '../landing/AdBanners';

const SeasideWaterLanding = () => {
    const { data: galleryItems = [] } = useGallery();
    const { data: settings } = useSettings();

    return (
        <div className="relative min-h-screen w-full font-sans text-slate-800">
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
                        <div className="container mx-auto flex flex-col flex-grow relative backdrop-blur-sm shadow-lg border border-white/20 bg-white/80">
                            <Hero />
                            <WhyChooseUs />
                            <Services />
                            <ProcessSection />
                            <Gallery items={galleryItems} />
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
