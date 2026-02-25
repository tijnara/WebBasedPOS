// src/components/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import {
    ChevronDown, Facebook, Droplet, Activity,
    Leaf, ShieldCheck, Menu, X, MessageCircle,
    Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useGallery } from '../../hooks/useGallery';

const SeasideWaterLanding = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: galleryItems = [] } = useGallery();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false); // New state for Lightbox

    // Auto-play logic
    useEffect(() => {
        if (galleryItems.length <= 1 || isLightboxOpen) return; // Pause auto-play if lightbox is open
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
                                <span className="text-3xl font-extrabold tracking-wider leading-none mb-1 text-green-950">SEASIDE</span>
                                <span className="text-[8px] tracking-[0.25em] font-bold uppercase leading-tight text-green-800">Water Refilling Station</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="hidden md:flex justify-end items-center text-[10px] sm:text-xs mb-4">
                                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-2">
                                    <Link href="/login" passHref>
                                        <Button as="a" className="bg-lime-500 hover:bg-green-500 active:bg-violet-500 text-black px-5 py-1.5 rounded-full transition-colors font-bold text-[11px] shadow-sm ml-2">
                                            Staff Login
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            <nav className="hidden md:flex flex-wrap items-center justify-center lg:justify-end gap-x-1 gap-y-2 text-[12px] font-bold tracking-wide">
                                <Link href="/" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">HOME</Link>
                                <Link href="#purification" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">PURIFICATION PROCESS</Link>
                                <Link href="#services" className="group flex items-center px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">
                                    SERVICES <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-70 transition-transform duration-300 group-hover:rotate-180"/>
                                </Link>
                                <Link href="#gallery" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">GALLERY</Link>
                                <Link href="#location" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">LOCATION</Link>
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
                                <Link href="/" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">HOME</Link>
                                <Link href="#purification" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">PURIFICATION PROCESS</Link>
                                <Link href="#services" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">SERVICES</Link>
                                <Link href="#gallery" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">GALLERY</Link>
                                <Link href="#location" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">LOCATION</Link>
                                <Link href="/login" passHref>
                                    <Button as="a" className="bg-lime-500 hover:bg-green-500 active:bg-violet-500 text-black px-5 py-1.5 rounded-full transition-colors font-bold text-[11px] shadow-sm">
                                        Staff Login
                                    </Button>
                                </Link>
                            </nav>
                        </div>
                    )}
                </header>

                <div className="container mx-auto flex flex-col flex-grow relative" style={{ backgroundColor: '#FFFFFF99' }}>

                    <motion.div variants={sectionVariants} initial="hidden" animate="visible" className="relative pt-6 pb-24 lg:pb-32 overflow-hidden flex-grow">
                        <div className="px-6 mt-16 md:mt-24 relative z-20">
                            <div className="max-w-2xl">
                                <h2 className="text-4xl md:text-5xl lg:text-[3.25rem] font-light leading-tight mb-8 text-slate-900">
                                    Refresh Your Life with<br/> <span className="font-extrabold text-green-700">Crystal Clear and Purified Water</span>
                                </h2>
                                <ul className="mb-10 space-y-4 text-sm md:text-base font-medium text-slate-800 p-4 rounded-xl border shadow-sm inline-block" style={{ backgroundColor: '#FFFFFF99' }}>
                                    <li className="flex items-center"><ShieldCheck className="w-5 h-5 text-green-600 mr-3 shrink-0"/>Advanced 21-stage reverse osmosis filtration system</li>
                                    <li className="flex items-center"><Activity className="w-5 h-5 text-green-600 mr-3 shrink-0"/>Perfectly pH balanced and mineralized for optimal health</li>
                                    <li className="flex items-center"><Leaf className="w-5 h-5 text-green-600 mr-3 shrink-0"/>Eco-friendly station—bring your jugs and save the planet</li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
                        <div className="px-6 py-20 pb-32 max-w-6xl mx-auto text-center">
                            <div className="mb-16">
                                <span className="inline-block py-1 px-4 rounded-full bg-lime-100 mb-3 border">
                                    <h2 className="text-green-700 text-sm font-bold tracking-widest uppercase m-0">Why Choose Seaside?</h2>
                                </span>
                                <p className="text-2xl md:text-3xl font-medium text-slate-800 drop-shadow-sm">Purity you can taste, quality you can trust.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
                                <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF99' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50"><Droplet className="w-8 h-8 text-green-600" /></div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Ultimate Purity</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Our filtration process removes 99.9% of impurities, giving you water that tastes exactly as nature intended.</p>
                                </div>
                                <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF99' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50"><Activity className="w-8 h-8 text-green-600" /></div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Health & Wellness</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Our system reintroduces essential electrolytes and balances the pH level to keep you perfectly hydrated.</p>
                                </div>
                                <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF99' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50"><Leaf className="w-8 h-8 text-green-600" /></div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Eco-Friendly</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Bring your own containers or purchase reusable jugs. Every refill helps reduce single-use plastic pollution.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* GALLERY SLIDESHOW */}
                    <motion.div id="gallery" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-transparent relative z-20 border-t">
                        <div className="px-6 py-20 pb-32 max-w-5xl mx-auto">
                            <div className="text-center mb-16">
                                <span className="inline-block py-1 px-4 rounded-full bg-lime-100 mb-3 border">
                                    <h2 className="text-green-700 text-sm font-bold tracking-widest uppercase m-0">Gallery</h2>
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
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 md:p-8 text-white z-20 pointer-events-none">
                                                <h3 className="text-2xl md:text-3xl font-bold drop-shadow-md">
                                                    {galleryItems[currentIndex]?.title}
                                                </h3>
                                                {galleryItems[currentIndex]?.description && (
                                                    <p className="text-sm md:text-base text-gray-200 mt-2 max-w-3xl drop-shadow">
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
                                <span className="inline-block py-1 px-4 rounded-full bg-lime-100 mb-3 border">
                                    <h2 className="text-green-700 text-sm font-bold tracking-widest uppercase m-0">Our Location</h2>
                                </span>
                                <p className="text-2xl md:text-3xl font-medium text-slate-800 drop-shadow-sm">Come visit us!</p>
                            </div>
                            <div className="w-full relative z-30">
                                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.427589470715!2d120.1322205!3d16.043286199999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3393e1d08454d96f%3A0xfd7e1df20c90037d!2sSEASIDE%20Water%20Refilling%20Station!5e0!3m2!1sen!2sph!4v1771921863348!5m2!1sen!2sph" width="100%" height="450" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                            </div>
                        </div>
                    </motion.div>

                    {/* FOOTER */}
                    <footer className="bg-green-950 text-green-100 text-sm relative z-20 border-t border-green-900 mt-auto px-6 py-12">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-3">
                                <Leaf className="w-5 h-5 text-lime-400"/><p>© {new Date().getFullYear()} SEASIDE Purified Water. All rights reserved.</p>
                            </div>
                            <div className="flex space-x-5">
                                <a href="https://www.facebook.com/profile.php?id=61587059323111" className="hover:text-lime-300 transition-colors"><Facebook className="w-5 h-5" /></a>
                                <a href="http://m.me/943197025547521" className="hover:text-lime-300 transition-colors"><MessageCircle className="w-5 h-5" /></a>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>

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

                        {/* Navigation arrows intentionally removed from the Lightbox overlay as requested */}
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default SeasideWaterLanding;