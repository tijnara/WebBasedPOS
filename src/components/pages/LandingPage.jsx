// src/components/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import { supabase } from '../../lib/supabaseClient';
import {
    Facebook, Droplet, Heart,
    Leaf, ShieldCheck, Menu, X, MessageCircle,
    Image as ImageIcon, MapPin, Truck, GlassWater, Snowflake,
    Eye
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Input, Textarea } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useGallery } from '../../hooks/useGallery';
import { useStore } from '../../store/useStore';
import { useSettings } from '../../hooks/useSettings';

const ProcessSection = () => {
    const processStages = [
        { stage: '1-3', process: 'Multi-Media Sediment Filtration', description: 'Three layers of specialized media remove sand, silt, rust, and particles down to 40 microns.' },
        { stage: '4', process: 'Dual-Stage Carbon Filter (A)', description: 'High-grade activated carbon removes chlorine and chemical odors.' },
        { stage: '5', process: 'Dual-Stage Carbon Filter (B)', description: 'Second pass ensures complete removal of pesticides and volatile organic compounds (VOCs).' },
        { stage: '6', process: 'Water Softening Resin', description: 'Ion-exchange technology removes calcium and magnesium to prevent "hard water" scale.' },
        { stage: '7', process: 'Fine Sediment Polishing', description: 'A 10-micron filter catches any remaining microscopic debris from the softening stage.' },
        { stage: '8', process: 'Ultra-Fine Polishing', description: 'A 5-micron filter provides a secondary barrier for absolute clarity.' },
        { stage: '9-12', process: 'Reverse Osmosis (RO) Membrane', description: 'The heart of the system. Four high-pressure membranes force water through a 0.0001-micron barrier, removing bacteria, viruses, and heavy metals.' },
        { stage: '13', process: 'Post-Carbon Refinement', description: 'Polishes the taste of the water after RO, giving it a crisp, clean finish.' },
        { stage: '14', process: 'Mineral Enhancement', description: 'Re-introduces essential trace minerals for health and a refreshing natural taste.' },
        { stage: '15', process: 'Micro-Filtration Stage 1', description: 'A 1-micron absolute filter acts as a final physical defense.' },
        { stage: '16', process: 'Micro-Filtration Stage 2', description: 'A 0.5-micron filter ensures even the smallest cysts are removed.' },
        { stage: '17', process: 'Ultraviolet (UV) Sterilization', description: 'High-intensity UV light scrambles the DNA of any lingering microorganisms, rendering them harmless.' },
        { stage: '18', process: 'Ozone Injection', description: 'Powerful O3​ oxidation kills bacteria on contact and ensures the water remains sterile inside the bottle.' },
        { stage: '19', process: 'Final Oxygenation', description: 'Increases dissolved oxygen levels for a lighter, more refreshing mouthfeel.' },
        { stage: '20', process: 'Container Sanitization', description: 'Before filling, every bottle is rinsed with ozonated water to ensure the vessel is as clean as the product.' }
    ];

    return (
        <motion.div id="process" variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
            <div className="px-6 py-20 pb-32 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <span className="inline-block py-2 px-6 rounded-full bg-lime-100 mb-4 border">
                        <h2 className="text-green-700 text-2xl md:text-3xl font-bold tracking-widest uppercase m-0">
                            Our 20-Stage Process
                        </h2>
                    </span>
                    <p className="text-2xl md:text-3xl font-medium text-slate-800 drop-shadow-sm">Pure Water, Guaranteed in Labrador, Pangasinan</p>
                </div>
                <div className="relative">
                    <div className="absolute left-1/2 -translate-x-1/2 w-1 bg-green-200 h-full rounded-full"></div>
                    <div className="space-y-12">
                        {processStages.map((item, index) => (
                            <div key={index} className="relative flex items-center" style={{ flexDirection: index % 2 === 0 ? 'row' : 'row-reverse' }}>
                                <div className="w-1/2 px-4">
                                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-md border border-white/30">
                                        <h3 className="text-lg font-bold text-green-800">{item.process}</h3>
                                        <p className="text-sm text-slate-700">{item.description}</p>
                                    </div>
                                </div>
                                <div className="absolute left-1/2 -translate-x-1/2 w-10 h-10 bg-lime-500 rounded-full flex items-center justify-center text-green-900 font-bold border-4 border-white shadow-lg">
                                    {item.stage}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Bulletproof Bottom Banner (320x50)
const AdsterraBanner = () => {
    return (
        <div className="flex justify-center w-[320px] h-[50px] mx-auto overflow-hidden">
            <iframe
                src="/ad-bottom.html"
                width="320"
                height="50"
                style={{ border: 'none', overflow: 'hidden' }}
                scrolling="no"
                title="Bottom Advertisement"
            ></iframe>
        </div>
    );
};

// Bulletproof Sidebar Banner (160x600)
const AdsterraVerticalBanner = () => {
    return (
        <div className="flex justify-center w-[160px] h-[600px] overflow-hidden">
            <iframe
                src="/ad-sidebar.html"
                width="160"
                height="600"
                style={{ border: 'none', overflow: 'hidden' }}
                scrolling="no"
                title="Sidebar Advertisement"
            ></iframe>
        </div>
    );
};

const SeasideWaterLanding = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: galleryItems = [] } = useGallery();
    const user = useStore(state => state.user);
    const { data: settings } = useSettings();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [viewCount, setViewCount] = useState(null);

    useEffect(() => {
        const initCounter = async () => {
            if (!sessionStorage.getItem('has_viewed_seaside')) {
                const { data, error } = await supabase.rpc('increment_page_view');
                if (!error && data !== null) {
                    setViewCount(data);
                    sessionStorage.setItem('has_viewed_seaside', 'true');

                    await supabase.from('page_views_log').insert([{ viewed_at: new Date().toISOString() }]);
                }
            } else {
                const { data, error } = await supabase.rpc('get_page_views');
                if (!error && data !== null) {
                    setViewCount(data);
                }
            }
        };
        initCounter();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
            setShowScrollTop(scrolled > 400);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        if (galleryItems.length <= 1 || isLightboxOpen) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev === galleryItems.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(timer);
    }, [galleryItems.length, isLightboxOpen]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev === galleryItems.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? galleryItems.length - 1 : prev - 1));
    };

    const sectionVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <div className="relative min-h-screen w-full font-sans text-slate-800">
            <div className="fixed inset-0 -z-10">
                <Image
                    src="/seaside_bg2.png"
                    alt="Seaside background"
                    fill
                    className="w-full h-full object-cover"
                    priority
                />
            </div>
            <Head>
                <meta name="google-adsense-account" content="ca-pub-3607213315862760" />
                <title>Seaside Purified Water Refilling Station | Labrador, Pangasinan</title>
                <meta name="description" content="Seaside offers 21-stage purified water, walk-in refills, and reliable door-to-door water delivery in Labrador, Pangasinan. Pure water, pure trust." />
                <meta name="keywords" content="water refilling station, Labrador Pangasinan, water delivery, purified water, Seaside water, ice tubes, alkaline water" />
                <meta property="og:title" content="Seaside Water Refilling Station | Labrador" />
                <meta property="og:description" content="Fast, clean, and reliable water delivery in Labrador, Pangasinan. Your family's health, flowing crystal clear." />
                <meta property="og:image" content="https://seasidepos.vercel.app/seasideHD_.png" />
                <meta property="og:type" content="website" />
                <meta property="og:locale" content="en_PH" />
                <meta property="og:site_name" content="Seaside" />
            </Head>

            {/* --- ADSTERRA POPUNDER SCRIPT --- */}
            <Script
                id="adsterra-popunder"
                strategy="afterInteractive"
                src="https://pl28955515.profitablecpmratenetwork.com/31/66/b5/3166b5f32c1e188a1b6d87c24ff4add8.js"
            />
            {/* --- END ADSTERRA POPUNDER SCRIPT --- */}

            {/* Load Google AdSense and Ad Blocking Recovery */}
            <>
                {/* 1. Main AdSense Script */}
                <Script
                    id="adsense-init"
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3607213315862760"
                    crossOrigin="anonymous"
                    strategy="afterInteractive"
                />

                {/* 2. Ad Blocking Recovery Tag */}
                <Script
                    id="fundingchoices-messages"
                    async
                    src="https://fundingchoicesmessages.google.com/i/pub-3607213315862760?ers=1"
                    strategy="lazyOnload"
                />

                {/* 3. Ad Blocking Signal Script */}
                <Script
                    id="fundingchoices-signal"
                    strategy="lazyOnload"
                    dangerouslySetInnerHTML={{
                        __html: `(function() {function signalGooglefcPresent() {if (!window.frames['googlefcPresent']) {if (document.body) {const iframe = document.createElement('iframe'); iframe.style = 'width: 0; height: 0; border: none; z-index: -1000; left: -1000px; top: -1000px;'; iframe.style.display = 'none'; iframe.name = 'googlefcPresent'; document.body.appendChild(iframe);} else {setTimeout(signalGooglefcPresent, 0);}}}signalGooglefcPresent();})();`
                    }}
                />
            </>

            <div className="relative z-10 min-h-screen flex flex-col">
                <header className="px-6 py-2 relative z-50 sticky top-0 backdrop-blur-sm border-b border-white/20 shadow-sm w-full" style={{ backgroundColor: '#FFFFFF80' }}>
                    <div className="container mx-auto flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-xl shadow-sm border border-green-100" style={{ backgroundColor: '#FFFFFF80' }}>
                                <Image
                                    src={settings?.logo_url || "/seasidelogo_.png"}
                                    alt="SEASIDE Logo"
                                    width={100}
                                    height={100}
                                    className="object-contain w-[100px] h-[100px]"
                                    priority
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-7xl font-extrabold tracking-wider leading-none mb-1 text-green-950">
                                    {settings?.business_name ? settings.business_name.split(' ')[0] : 'SEASIDE'}
                                </span>
                                <span className="text-[8px] tracking-[0.25em] font-bold uppercase leading-tight text-green-800">
                                    {settings?.business_name ? settings.business_name.substring(settings.business_name.indexOf(' ') + 1) : 'Water Refilling Station'}
                                </span>
                                <span className="text-[9px] font-semibold tracking-wide text-green-700 mt-0.5">Proudly hydrating Labrador, Pangasinan</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="hidden md:flex justify-end items-center text-[10px] sm:text-xs mb-4">
                                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-2">
                                    {user ? (
                                        <Link href="/pos" passHref>
                                            <Button as="a" className="bg-lime-500 hover:bg-green-500 active:bg-violet-500 text-black px-5 py-1.5 rounded-full transition-colors font-bold text-[11px] shadow-sm ml-2">
                                                Continue to Office
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Link href="/login" passHref>
                                            <Button as="a" className="bg-lime-500 hover:bg-green-500 active:bg-violet-500 text-black px-5 py-1.5 rounded-full transition-colors font-bold text-[11px] shadow-sm ml-2">
                                                Staff Login
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                            <nav className="hidden md:flex flex-wrap items-center justify-center lg:justify-end gap-x-1 gap-y-2 text-[12px] font-bold tracking-wide">
                                <Link href="/" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">HOME</Link>
                                <Link href="#services" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">SERVICES</Link>
                                <Link href="#process" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">PROCESS</Link>
                                <Link href="#gallery" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">GALLERY</Link>
                                <Link href="#location" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">LOCATION</Link>
                                <Link href="#contact" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">CONTACT</Link>
                                <Link href="/resources" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">RESOURCES</Link>
                            </nav>
                            <div className="md:hidden">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                                    aria-expanded={isMenuOpen}
                                >
                                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    {isMenuOpen && (
                        <div className="md:hidden mt-4">
                            <nav className="flex flex-col items-center gap-y-4 text-[12px] font-bold tracking-wide">
                                <Link href="/" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">HOME</Link>
                                <Link href="#services" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">SERVICES</Link>
                                <Link href="#process" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">PROCESS</Link>
                                <Link href="#gallery" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">GALLERY</Link>
                                <Link href="#location" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">LOCATION</Link>
                                <Link href="#contact" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">CONTACT</Link>
                                <Link href="/resources" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">RESOURCES</Link>
                                {user ? (
                                    <Link href="/pos" passHref>
                                        <Button as="a" onClick={() => setIsMenuOpen(false)} className="bg-lime-500 hover:bg-green-500 active:bg-violet-500 text-black px-5 py-1.5 rounded-full transition-colors font-bold text-[11px] shadow-sm">
                                            Continue to Office
                                        </Button>
                                    </Link>
                                ) : (
                                    <Link href="/login" passHref>
                                        <Button as="a" onClick={() => setIsMenuOpen(false)} className="bg-lime-500 hover:bg-green-500 active:bg-violet-500 text-black px-5 py-1.5 rounded-full transition-colors font-bold text-[11px] shadow-sm">
                                            Staff Login
                                        </Button>
                                    </Link>
                                )}
                            </nav>
                        </div>
                    )}
                </header>

                <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-[1fr,minmax(0,4fr),1fr] gap-4 px-4">
                    {/* Left Sidebar */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-28">
                            <AdsterraVerticalBanner />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-grow">
                        <div className="container mx-auto flex flex-col flex-grow relative backdrop-blur-sm shadow-lg border border-white/20" style={{ backgroundColor: '#FFFFFF80' }}>

                            <motion.div variants={sectionVariants} initial="hidden" animate="visible" className="relative pt-6 pb-24 lg:pb-32 overflow-hidden flex-grow">
                                <div className="px-6 mt-16 md:mt-24 relative z-20">
                                    <div className="max-w-3xl">
                                        <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-light leading-tight mb-6 text-slate-900">
                                            Your Family’s Health in Labrador, Pangasinan,<br/> <span className="font-extrabold text-green-700">Flowing Crystal Clear from Seaside.</span>
                                        </h1>

                                        <p className="mb-8 text-base md:text-lg text-slate-800 max-w-2xl font-medium leading-relaxed p-5 rounded-xl border shadow-sm" style={{ backgroundColor: '#FFFFFF80' }}>
                                            Proudly serving the families of Labrador, Pangasinan. At Seaside, we believe our community deserves world-class hydration without leaving town. We combine state-of-the-art 21-stage reverse osmosis with the warm, local service you know and trust.
                                        </p>

                                        <ul className="mb-10 space-y-4 text-sm md:text-base font-medium text-slate-800 p-4 rounded-xl border shadow-sm inline-block" style={{ backgroundColor: '#FFFFFF80' }}>
                                            <li className="flex items-center"><ShieldCheck className="w-5 h-5 text-green-600 mr-3 shrink-0"/>Advanced 21-stage reverse osmosis filtration system</li>
                                            <li className="flex items-center"><Heart className="w-5 h-5 text-green-600 mr-3 shrink-0"/>Carefully remineralized to deliver crisp, healthy hydration for your whole family</li>
                                            <li className="flex items-center"><Leaf className="w-5 h-5 text-green-600 mr-3 shrink-0"/>Eco-friendly station—bring your jugs and save the planet</li>
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
                                <div className="px-6 py-20 pb-32 max-w-6xl mx-auto text-center">
                                    <div className="mb-12">
                                        <AdsterraBanner />
                                    </div>
                                    <div className="mb-16">
                                        <span className="inline-block py-2 px-6 rounded-full bg-lime-100 mb-4 border">
                                            <h2 className="text-green-700 text-2xl md:text-3xl font-bold tracking-widest uppercase m-0">
                                                Why Choose Seaside?
                                            </h2>
                                        </span>
                                        <p className="text-2xl md:text-3xl font-medium text-slate-800 drop-shadow-sm">Purity you can taste, quality you can trust in Labrador, Pangasinan.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
                                        <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF80' }}>
                                            <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50"><Droplet className="w-8 h-8 text-green-600" /></div>
                                            <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4 text-center">Zero Doubts, Just Pure Water</h3>
                                            <p className="text-[14px] text-slate-700 leading-relaxed font-medium text-center">We don't cut corners. Our advanced 21-stage filtration system strips away 99.9% of impurities, heavy metals, and bacteria, leaving you with water that is as safe as it is refreshing.</p>
                                        </div>
                                        <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF80' }}>
                                            <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50"><Heart className="w-8 h-8 text-green-600" /></div>
                                            <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4 text-center">Gentle on Tummies, Great for Health</h3>
                                            <p className="text-[14px] text-slate-700 leading-relaxed font-medium text-center">From mixing your baby’s formula to brewing your morning coffee, our water is crafted for family life. We ensure a healthy balance of natural minerals, making every glass safe, nourishing, and deeply refreshing.</p>
                                        </div>
                                        <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF80' }}>
                                            <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50"><Leaf className="w-8 h-8 text-green-600" /></div>
                                            <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4 text-center">Eco-Friendly</h3>
                                            <p className="text-[14px] text-slate-700 leading-relaxed font-medium text-center">Bring your own containers or purchase reusable jugs. Every refill helps reduce single-use plastic pollution.</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div id="services" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
                                <div className="px-6 py-20 pb-32 max-w-6xl mx-auto">
                                    <div className="text-center mb-16">
                                        <span className="inline-block py-2 px-6 rounded-full bg-lime-100 mb-4 border">
                                            <h2 className="text-green-700 text-2xl md:text-3xl font-bold tracking-widest uppercase m-0">
                                                Our Services
                                            </h2>
                                        </span>
                                        <p className="text-2xl md:text-3xl font-medium text-slate-800 drop-shadow-sm">Convenience and Quality, Delivered in Labrador, Pangasinan.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div className="flex flex-col items-center text-center p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF80' }}>
                                            <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6"><Leaf className="w-8 h-8 text-green-600" /></div>
                                            <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Walk-In Refills</h3>
                                            <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Experience fast, friendly, and clean service right at our station in Labrador, Pangasinan. Bring your own jugs to help reduce plastic waste, and watch our team sanitize and refill them with crystal clear water while you wait.</p>
                                        </div>

                                        <div className="flex flex-col items-center text-center p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF80' }}>
                                            <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6"><Truck className="w-8 h-8 text-green-600" /></div>
                                            <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Door-to-Door Delivery</h3>
                                            <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Stay hydrated without leaving your home. We offer prompt and reliable delivery services across Labrador, Pangasinan and neighboring municipalities. Just send us a message, and we'll do the heavy lifting for you.</p>
                                        </div>

                                        <div className="flex flex-col items-center text-center p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF80' }}>
                                            <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6"><GlassWater className="w-8 h-8 text-green-600" /></div>
                                            <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Ready-to-Drink PET Bottles</h3>
                                            <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Always on the go? Grab our freshly sealed, purified water in convenient PET bottles. Perfect for road trips, family parties, corporate events, or simply stocking up your fridge.</p>
                                        </div>

                                        <div className="flex flex-col items-center text-center p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF80' }}>
                                            <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6"><Snowflake className="w-8 h-8 text-green-600" /></div>
                                            <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Purified Ice Tubes & Cubes</h3>
                                            <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Keep your drinks perfectly chilled without compromising on safety. Made from our signature 21-stage filtered water, our ice is crystal clear, food-grade safe, and slow-melting—perfect for parties, businesses, and everyday use.</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <ProcessSection />

                            <motion.div id="gallery" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
                                <div className="px-6 py-20 pb-32 max-w-5xl mx-auto">
                                    <div className="text-center mb-16">
                                        <span className="inline-block py-2 px-6 rounded-full bg-lime-200 mb-4 border border-lime-300 shadow-sm">
                                            <h2 className="text-green-700 text-2xl md:text-3xl font-black tracking-widest uppercase m-0">Gallery</h2>
                                        </span>
                                        <p className="text-2xl md:text-3xl font-medium text-slate-800 drop-shadow-sm">A glimpse of our station and services in Labrador, Pangasinan</p>
                                    </div>

                                    {galleryItems.length > 0 ? (
                                        <div
                                            className="relative w-full rounded-[2rem] shadow-2xl border-4 border-white bg-slate-900 group overflow-hidden"
                                            style={{ height: '450px' }}
                                        >
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={currentIndex}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.5 }}
                                                    className="absolute inset-0 w-full h-full"
                                                >
                                                    <Image
                                                        src={galleryItems[currentIndex]?.image_url}
                                                        alt={galleryItems[currentIndex]?.title || 'Gallery'}
                                                        width={800}
                                                        height={450}
                                                        className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform duration-700"
                                                        onClick={() => setIsLightboxOpen(true)}
                                                    />
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 via-white/40 to-transparent p-6 md:p-8 text-black z-20 pointer-events-none">
                                                        <h3 className="text-2xl md:text-3xl font-bold drop-shadow-md">
                                                            {galleryItems[currentIndex]?.title}
                                                        </h3>
                                                        {galleryItems[currentIndex]?.description && (
                                                            <p className="text-sm md:text-base text-gray-800 mt-2 max-w-3xl drop-shadow">
                                                                {galleryItems[currentIndex]?.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            </AnimatePresence>

                                            {galleryItems.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={prevSlide}
                                                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-[#FFFFFF00] hover:bg-white/40 text-black rounded-full backdrop-blur-md transition-all shadow-lg hover:scale-110 active:scale-95 border border-white/50 md:opacity-0 group-hover:opacity-100"
                                                        aria-label="Previous image"
                                                    >
                                                        <span className="text-xl md:text-2xl font-bold leading-none -mt-1">❮</span>
                                                    </button>

                                                    <button
                                                        onClick={nextSlide}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-[#FFFFFF00] hover:bg-white/40 text-black rounded-full backdrop-blur-md transition-all shadow-lg hover:scale-110 active:scale-95 border border-white/50 md:opacity-0 group-hover:opacity-100"
                                                        aria-label="Next image"
                                                    >
                                                        <span className="text-xl md:text-2xl font-bold leading-none -mt-1">❯</span>
                                                    </button>

                                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30 bg-black/30 px-4 py-2.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                                                        {galleryItems.map((_, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => setCurrentIndex(idx)}
                                                                aria-label={`Go to slide ${idx + 1}`}
                                                                aria-current={idx === currentIndex ? "true" : "false"}
                                                                className={`h-2.5 rounded-full transition-all duration-300 ${
                                                                    idx === currentIndex ? 'w-8 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'w-2.5 bg-white/50 hover:bg-white/90'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 rounded-3xl border border-dashed border-slate-300" style={{ backgroundColor: '#FFFFFF80' }}>
                                            <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                            <p className="text-slate-500 font-medium">No gallery items yet.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            <motion.div id="location" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
                                <div className="px-6 py-20 pb-32 max-w-6xl mx-auto text-center">
                                    <div className="mb-16">
                                        <span className="inline-block py-2 px-6 rounded-full bg-lime-100 mb-4 border">
                                            <h2 className="text-green-700 text-2xl md:text-3xl font-black tracking-widest uppercase m-0">Location</h2>
                                        </span>
                                        <p className="text-2xl md:text-3xl font-bold text-slate-800 drop-shadow-sm mt-4">Navigate to Purity in Labrador, Pangasinan – See Us on the Map!</p>
                                    </div>
                                    <div className="w-full relative z-30">
                                        <iframe title="Seaside Water Refilling Station Location Map" src={settings?.location_embed || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.427589470715!2d120.1322205!3d16.043286199999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3393e1d08454d96f%3A0xfd7e1df20c90037d!2sSEASIDE%20Water%20Refilling%20Station!5e0!3m2!1sen!2sph!4v1771921863348!5m2!1sen!2sph"} width="100%" height="450" style={{ border: 0, borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div id="contact" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
                                <div className="px-6 py-20 pb-32 max-w-4xl mx-auto text-center">
                                    <div className="mb-12">
                                        <span className="inline-block py-2 px-6 rounded-full bg-lime-100 mb-4 border border-lime-300 shadow-sm">
                                            <h2 className="text-green-700 text-2xl md:text-3xl font-black tracking-widest uppercase m-0">Contact Us</h2>
                                        </span>
                                        <p className="text-2xl md:text-3xl font-bold text-slate-800 drop-shadow-sm mt-4">We'd love to hear from you</p>
                                    </div>

                                    <div className="bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl border shadow-sm text-left">
                                        <div className="mb-6 text-center">
                                            <p className="text-lg font-semibold text-gray-800">Business Hours:</p>
                                            <p className="text-gray-700">Monday - Saturday: 8:00 AM - 5:00 PM</p>
                                            <p className="mt-4 text-lg font-semibold text-gray-800">Our Address:</p>
                                            <p className="text-gray-700">Laois, Labrador, Pangasinan</p>
                                        </div>
                                        <form action="mailto:aranjitarchit@gmail.com" method="POST" encType="text/plain" className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Email Address</label>
                                                <Input
                                                    type="email"
                                                    name="Sender Email"
                                                    placeholder="example@email.com"
                                                    required
                                                    className="w-full bg-white h-12"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                                                <Textarea
                                                    name="Message Body"
                                                    rows={6}
                                                    placeholder="Write your message here..."
                                                    required
                                                    className="w-full bg-white p-4"
                                                />
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-200">
                                                <Button type="submit" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-black px-10 py-3 rounded-xl font-bold shadow-md">
                                                    Send Message
                                                </Button>
                                                <a
                                                    href={settings?.facebook_link || "https://www.facebook.com/61587059323111/"}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center text-blue-600 hover:text-blue-800 font-bold transition-colors"
                                                >
                                                    <Facebook className="w-6 h-6 mr-2" />
                                                    Message us on Facebook
                                                </a>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </motion.div>

                            {/* ADSTERRA BANNER SECTION */}
                            <div className="bg-transparent relative z-20 border-t py-10 flex justify-center items-center">
                                <div className="text-center bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/30">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 block">Advertisement</span>

                                    {/* Safely load Adsterra using our custom component */}
                                    <AdsterraBanner />

                                </div>
                            </div>
                            {/* END ADSTERRA BANNER SECTION */}

                            <footer className="bg-slate-900 text-slate-400 py-12">
                                <div className="container mx-auto px-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

                                        <div>
                                            <h3 className="text-cyan-400 text-lg font-bold mb-4">Our Labrador, Pangasinan Roots</h3>
                                            <p className="text-sm leading-relaxed">
                                                Founded on 2020, our station was born from a desire for local
                                                self-reliance in Labrador, Pangasinan. We provide the community with
                                                state-of-the-art 20-stage purification, ensuring every neighbor from the
                                                poblacion to the barangays has access to the highest quality hydration.
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-cyan-400 text-lg font-bold mb-4">Quick Links</h3>
                                            <ul className="text-sm space-y-2">
                                                <li><Link href="#process" className="inline-block py-2 hover:text-cyan-300 transition">Our 20-Stage Process</Link></li>
                                                <li><Link href="#location" className="inline-block py-2 hover:text-cyan-300 transition">Delivery Areas</Link></li>
                                                <li><Link href="/contact" className="inline-block py-2 hover:text-cyan-300 transition">Contact Support</Link></li>
                                                <li><Link href="/terms" className="inline-block py-2 hover:text-cyan-300 transition">Terms of Service</Link></li>
                                                <li><Link href="/privacy" className="inline-block py-2 hover:text-cyan-300 transition">Privacy Policy</Link></li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="text-cyan-400 text-lg font-bold mb-4">Resources & Health</h3>
                                            <ul className="text-sm space-y-3">
                                                <li>
                                                    <Link href="/resources/benefits-of-21-stage-purified-water" className="inline-block py-2 hover:text-cyan-300 transition flex flex-col">
                                                        <span className="font-bold">The Science of 20 Stages</span>
                                                        <span className="text-xs text-slate-500">Why standard filtration isn't enough.</span>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link href="/resources/staying-hydrated-in-labrador-summer-tips" className="inline-block py-2 hover:text-cyan-300 transition flex flex-col">
                                                        <span className="font-bold">Beating the Labrador Heat</span>
                                                        <span className="text-xs text-slate-500">Hydration tips for the tropical climate.</span>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link href="/resources/maintaining-your-water-containers-at-home" className="inline-block py-2 hover:text-cyan-300 transition flex flex-col">
                                                        <span className="font-bold">Dispenser Maintenance 101</span>
                                                        <span className="text-xs text-slate-500">Keep your water pure at home.</span>
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>

                                    </div>

                                    <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col items-center text-center text-xs">
                                        <p className="mb-3">© {new Date().getFullYear()} Seaside Purified Water. DOH Certified. All Rights Reserved.</p>

                                        {/* --- ADSTERRA DIRECT LINK (OPTIONAL SUPPORT) --- */}
                                        <a
                                            href="https://undergocutlery.com/ngz7b0mms?key=c1cb95a3297c5e2d634e2cbbecde0044"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-lime-400 transition-colors duration-300 px-3 py-1.5 rounded-full border border-slate-700/50 hover:border-lime-400/50 bg-slate-800/30"
                                        >
                                            <Heart className="w-3 h-3" /> Click here to support our local business
                                        </a>
                                        {/* --- END ADSTERRA DIRECT LINK --- */}

                                    </div>
                                </div>
                            </footer>
                        </div>
                    </main>

                    {/* Right Sidebar */}
                    <div className="hidden lg:block w-48 flex-shrink-0">
                        <div className="sticky top-28 p-4">
                            <AdsterraVerticalBanner />
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        onClick={scrollToTop}
                        className="fixed bottom-6 right-6 z-[999] p-4 bg-green-600 text-white rounded-full shadow-2xl hover:bg-green-700 active:scale-90 transition-all cursor-pointer flex items-center justify-center border-2 border-white/20"
                        aria-label="Back to top"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m18 15-6-6-6 6"/>
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isLightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 md:p-10"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <button
                            className="absolute top-4 right-4 md:top-8 md:right-8 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 p-2 rounded-full transition-all z-[110]"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsLightboxOpen(false);
                            }}
                        >
                            <X size={32} />
                        </button>

                        <motion.img
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            src={galleryItems[currentIndex]?.image_url}
                            alt={galleryItems[currentIndex]?.title || 'Enlarged Image'}
                            width={1200}
                            height={800}
                            className="w-full max-w-5xl max-h-[85vh] object-contain cursor-default drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)] rounded-[2rem] bg-transparent"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SeasideWaterLanding;