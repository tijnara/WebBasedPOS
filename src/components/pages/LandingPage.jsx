// src/components/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient'; // <-- Add this import
import {
    Facebook, Droplet, Heart,
    Leaf, ShieldCheck, Menu, X, MessageCircle,
    Image as ImageIcon, MapPin, Truck, GlassWater, Snowflake,
    Eye // <-- Add the Eye icon here
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useGallery } from '../../hooks/useGallery';
import { useStore } from '../../store/useStore';

const SeasideWaterLanding = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: galleryItems = [] } = useGallery();
    const user = useStore(state => state.user);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [viewCount, setViewCount] = useState(null); // <-- Add this state

    // <-- Add this useEffect block -->
    useEffect(() => {
        const initCounter = async () => {
            // Check if they've already been counted in this browser session
            if (!sessionStorage.getItem('has_viewed_seaside')) {
                const { data, error } = await supabase.rpc('increment_page_view');
                if (!error && data !== null) {
                    setViewCount(data);
                    sessionStorage.setItem('has_viewed_seaside', 'true');
                }
            } else {
                // If they already visited, just fetch the current total
                const { data, error } = await supabase.rpc('get_page_views');
                if (!error && data !== null) {
                    setViewCount(data);
                }
            }
        };
        initCounter();
    }, []);


    // Handle scroll for "Back to Top" visibility - Fixed for cross-browser & mobile
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

    // Auto-play logic
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
        <div
            className="relative min-h-screen w-full font-sans text-slate-800"
            style={{
                backgroundImage: "url('/seaside_bg2.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                backgroundRepeat: 'no-repeat'
            }}
        >
            <div className="relative z-10 min-h-screen flex flex-col">
                <header className="px-6 py-2 relative z-50 sticky top-0 border-b border-green-900/10 shadow-sm w-full" style={{ backgroundColor: 'transparent' }}>
                    <div className="container mx-auto flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-xl shadow-sm border border-green-100" style={{ backgroundColor: '#FFFFFF99' }}>
                                <Image src="/seasidelogo_.png" alt="SEASIDE Logo" width={100} height={100} className="object-contain" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-7xl font-extrabold tracking-wider leading-none mb-1 text-green-950">SEASIDE</span>
                                <span className="text-[8px] tracking-[0.25em] font-bold uppercase leading-tight text-green-800">Water Refilling Station</span>
                                {/* SEO Tagline */}
                                <span className="text-[9px] font-semibold tracking-wide text-green-700 mt-0.5">Proudly hydrating Laois, Labrador</span>
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
                                <Link href="#services" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">
                                    SERVICES
                                </Link>
                                <Link href="#gallery" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">GALLERY</Link>
                                <Link href="#location" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">LOCATION</Link>
                            </nav>
                            <div className="md:hidden">
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
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
                                <Link href="#gallery" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">GALLERY</Link>
                                <Link href="#location" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">LOCATION</Link>
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

                <div className="container mx-auto flex flex-col flex-grow relative" style={{ backgroundColor: '#FFFFFF99' }}>

                    <motion.div variants={sectionVariants} initial="hidden" animate="visible" className="relative pt-6 pb-24 lg:pb-32 overflow-hidden flex-grow">
                        <div className="px-6 mt-16 md:mt-24 relative z-20">
                            <div className="max-w-3xl">
                                {/* Updated Hero Headline */}
                                <h2 className="text-4xl md:text-5xl lg:text-[3.25rem] font-light leading-tight mb-6 text-slate-900">
                                    Your Family’s Health,<br/> <span className="font-extrabold text-green-700">Flowing Crystal Clear from Seaside.</span>
                                </h2>

                                {/* Localized Welcome Paragraph */}
                                <p className="mb-8 text-base md:text-lg text-slate-800 max-w-2xl font-medium leading-relaxed p-5 rounded-xl border shadow-sm" style={{ backgroundColor: '#FFFFFF99' }}>
                                    Proudly serving the families of Laois, Labrador. At Seaside, we believe our community deserves world-class hydration without leaving town. We combine state-of-the-art 21-stage reverse osmosis with the warm, local service you know and trust.
                                </p>

                                <ul className="mb-10 space-y-4 text-sm md:text-base font-medium text-slate-800 p-4 rounded-xl border shadow-sm inline-block" style={{ backgroundColor: '#FFFFFF99' }}>
                                    <li className="flex items-center"><ShieldCheck className="w-5 h-5 text-green-600 mr-3 shrink-0"/>Advanced 21-stage reverse osmosis filtration system</li>
                                    <li className="flex items-center"><Heart className="w-5 h-5 text-green-600 mr-3 shrink-0"/>Carefully remineralized to deliver crisp, healthy hydration for your whole family</li>
                                    <li className="flex items-center"><Leaf className="w-5 h-5 text-green-600 mr-3 shrink-0"/>Eco-friendly station—bring your jugs and save the planet</li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
                        <div className="px-6 py-20 pb-32 max-w-6xl mx-auto text-center">
                            <div className="mb-16">
                                <span className="inline-block py-2 px-6 rounded-full bg-lime-100 mb-4 border">
                                    <h2 className="text-green-700 text-2xl md:text-3xl font-bold tracking-widest uppercase m-0">
                                        Why Choose Seaside?
                                    </h2>
                                </span>
                                <p className="text-2xl md:text-3xl font-medium text-slate-800 drop-shadow-sm">Purity you can taste, quality you can trust.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
                                {/* Updated Value Proposition Cards */}
                                <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF99' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50"><Droplet className="w-8 h-8 text-green-600" /></div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4 text-center">Zero Doubts, Just Pure Water</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed font-medium text-center">We don't cut corners. Our advanced 21-stage filtration system strips away 99.9% of impurities, heavy metals, and bacteria, leaving you with water that is as safe as it is refreshing.</p>
                                </div>
                                <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF99' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50"><Heart className="w-8 h-8 text-green-600" /></div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4 text-center">Gentle on Tummies, Great for Health</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed font-medium text-center">From mixing your baby’s formula to brewing your morning coffee, our water is crafted for family life. We ensure a healthy balance of natural minerals, making every glass safe, nourishing, and deeply refreshing.</p>
                                </div>
                                <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF99' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50"><Leaf className="w-8 h-8 text-green-600" /></div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4 text-center">Eco-Friendly</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed font-medium text-center">Bring your own containers or purchase reusable jugs. Every refill helps reduce single-use plastic pollution.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* SERVICES SECTION */}
                    <motion.div id="services" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
                        <div className="px-6 py-20 pb-32 max-w-6xl mx-auto">
                            <div className="text-center mb-16">
                                <span className="inline-block py-2 px-6 rounded-full bg-lime-100 mb-4 border">
                                    <h2 className="text-green-700 text-2xl md:text-3xl font-bold tracking-widest uppercase m-0">
                                        Our Services
                                    </h2>
                                </span>
                                <p className="text-2xl md:text-3xl font-medium text-slate-800 drop-shadow-sm">Convenience and Quality, Delivered.</p>
                            </div>

                            {/* UPDATED: Changed lg:grid-cols-4 to lg:grid-cols-3 to force the 4th box down */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                                <div className="flex flex-col items-center text-center p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF99' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6"><Leaf className="w-8 h-8 text-green-600" /></div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Walk-In Refills</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Experience fast, friendly, and clean service right at our station. Bring your own jugs to help reduce plastic waste, and watch our team sanitize and refill them with crystal clear water while you wait.</p>
                                </div>

                                <div className="flex flex-col items-center text-center p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF99' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6"><Truck className="w-8 h-8 text-green-600" /></div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Door-to-Door Delivery</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Stay hydrated without leaving your home. We offer prompt and reliable delivery services across Labrador and neighboring municipalities. Just send us a message, and we'll do the heavy lifting for you.</p>
                                </div>

                                <div className="flex flex-col items-center text-center p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF99' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6"><GlassWater className="w-8 h-8 text-green-600" /></div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Ready-to-Drink PET Bottles</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Always on the go? Grab our freshly sealed, purified water in convenient PET bottles. Perfect for road trips, family parties, corporate events, or simply stocking up your fridge.</p>
                                </div>

                                {/* This 4th box will now wrap to the second row on large screens */}
                                <div className="flex flex-col items-center text-center p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF99' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6"><Snowflake className="w-8 h-8 text-green-600" /></div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Purified Ice Tubes & Cubes</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Keep your drinks perfectly chilled without compromising on safety. Made from our signature 21-stage filtered water, our ice is crystal clear, food-grade safe, and slow-melting—perfect for parties, businesses, and everyday use.</p>
                                </div>

                            </div>
                        </div>
                    </motion.div>

                    {/* GALLERY SLIDESHOW */}
                    <motion.div id="gallery" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
                        <div className="px-6 py-20 pb-32 max-w-5xl mx-auto">
                            <div className="text-center mb-16">
                                <span className="inline-block py-2 px-6 rounded-full bg-lime-200 mb-4 border border-lime-300 shadow-sm">
                                    <h2 className="text-green-700 text-2xl md:text-3xl font-black tracking-widest uppercase m-0">Gallery</h2>
                                </span>
                                <p className="text-2xl md:text-3xl font-medium text-slate-800 drop-shadow-sm">A glimpse of our station and services</p>
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
                                            <img
                                                src={galleryItems[currentIndex]?.image_url}
                                                alt={galleryItems[currentIndex]?.title || 'Gallery'}
                                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-700"
                                                onClick={() => setIsLightboxOpen(true)}
                                            />
                                            {/* Info Overlay */}
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

                                    {/* Navigation Arrows */}
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

                                            {/* Dots Indicator */}
                                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30 bg-black/30 px-4 py-2.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                                                {galleryItems.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCurrentIndex(idx)}
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
                                <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-slate-300">
                                    <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <p className="text-slate-500 font-medium">No gallery items yet.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* LOCATION SECTION */}
                    <motion.div id="location" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
                        <div className="px-6 py-20 pb-32 max-w-6xl mx-auto text-center">
                            <div className="mb-16">
                                <span className="inline-block py-2 px-6 rounded-full bg-lime-100 mb-4 border border-lime-300 shadow-sm">
                                    <h2 className="text-green-700 text-2xl md:text-3xl font-black tracking-widest uppercase m-0">Location</h2>
                                </span>
                                <p className="text-2xl md:text-3xl font-bold text-slate-800 drop-shadow-sm mt-4">Navigate to Purity – See Us on the Map!</p>
                            </div>
                            <div className="w-full relative z-30">
                                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.427589470715!2d120.1322205!3d16.043286199999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3393e1d08454d96f%3A0xfd7e1df20c90037d!2sSEASIDE%20Water%20Refilling%20Station!5e0!3m2!1sen!2sph!4v1771921863348!5m2!1sen!2sph" width="100%" height="450" style={{ border: 0, borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                            </div>
                        </div>
                    </motion.div>

                    {/* UPDATED EXPANDED FOOTER */}
                    <footer className="bg-green-950 text-green-50 text-sm relative z-20 border-t border-green-900 mt-auto pt-16 pb-8">
                        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                            {/* Brand & About Column */}
                            <div className="md:col-span-1">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-green-800">
                                        <Image src="/seasidelogo_.png" alt="SEASIDE Logo" width={60} height={60} className="object-contain brightness-0 invert" />
                                    </div>
                                    <span className="text-2xl font-extrabold tracking-wider text-black">SEASIDE</span>
                                </div>
                                {/* NEW ABOUT US PARAGRAPH */}
                                <p className="text-green-200/80 leading-relaxed pr-4 font-medium">
                                    Founded in 2021, Seaside Water Refilling Station was established with a simple goal: to serve the community with exceptionally clean, safe, and purified drinking water. We remain deeply committed to delivering quality hydration to every household, treating every family like our own.
                                </p>
                            </div>

                            {/* Quick Links Column */}
                            <div>
                                <h4 className="text-black font-bold tracking-wider uppercase mb-6 flex items-center">
                                    <Droplet className="w-4 h-4 mr-2 text-lime-400" />
                                    Quick Links
                                </h4>
                                <ul className="space-y-3 text-green-200/80 font-medium">
                                    <li><Link href="/" className="hover:text-lime-400 transition-colors">Home</Link></li>
                                    <li><Link href="#services" className="hover:text-lime-400 transition-colors">Our Services</Link></li>
                                    <li><Link href="#gallery" className="hover:text-lime-400 transition-colors">Gallery</Link></li>
                                    <li><Link href="#location" className="hover:text-lime-400 transition-colors">Location map</Link></li>
                                </ul>
                            </div>

                            {/* Contact Column */}
                            <div>
                                <h4 className="text-black font-bold tracking-wider uppercase mb-6 flex items-center">
                                    <MapPin className="w-4 h-4 mr-2 text-lime-400" />
                                    Connect With Us
                                </h4>
                                <p className="text-green-200/80 mb-6 font-medium">
                                    Visit our station located in<br/> Laois, Labrador, Pangasinan.
                                </p>
                                <div className="flex space-x-4">
                                    <a href="https://www.facebook.com/profile.php?id=61587059323111" className="bg-white/5 border border-white/10 hover:bg-white/10 p-3 rounded-full transition-colors hover:text-lime-400 shadow-sm" aria-label="Facebook">
                                        <Facebook className="w-5 h-5" />
                                    </a>
                                    <a href="http://m.me/94319702554752" className="bg-white/5 border border-white/10 hover:bg-white/10 p-3 rounded-full transition-colors hover:text-lime-400 shadow-sm" aria-label="Messenger">
                                        <MessageCircle className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Copyright Bar */}
                        <div className="max-w-6xl mx-auto px-6 pt-8 border-t border-green-800 flex flex-col md:flex-row justify-between items-center gap-4 text-green-400/60 font-medium">
                            <div className="flex items-center gap-2">
                                <Leaf className="w-4 h-4 text-lime-500/50"/>
                                <p>© {new Date().getFullYear()} SEASIDE Purified Water. All rights reserved.</p>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                {/* Page Views Counter */}
                                <div className="flex items-center gap-1.5 bg-green-900/50 px-3 py-1 rounded-full text-lime-300/80 text-xs border border-green-800/50" title="Total Page Views">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{viewCount !== null ? viewCount.toLocaleString() : '...'} Views</span>
                                </div>
                                <p className="text-[12px] hidden md:block">Purity you can taste, quality you can trust.</p>
                            </div>
                        </div>
                    </footer>
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

            {/* LIGHTBOX / ENLARGED IMAGE OVERLAY - Refined for "focus, zoom, blur, and small size" without arrows */}
            <AnimatePresence>
                {isLightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        // Intense blur and darker background for absolute focus on the image
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 md:p-10"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        {/* Close Button */}
                        <button
                            className="absolute top-4 right-4 md:top-8 md:right-8 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 p-2 rounded-full transition-all z-[110]"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsLightboxOpen(false);
                            }}
                        >
                            <X size={32} />
                        </button>

                        {/* Enlarged Image Container - Uses spring scale for "zoom" feel, and strictly limited max-sizes */}
                        <motion.img
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            src={galleryItems[currentIndex]?.image_url}
                            alt={galleryItems[currentIndex]?.title || 'Enlarged Image'}
                            // Set width to full, max width to 5xl (same as container), and height limit to prevent overflow
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