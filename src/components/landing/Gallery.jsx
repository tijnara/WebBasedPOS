import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, X } from 'lucide-react';
import { useInView } from '../../hooks/useInView';
import { useGallery } from '../../hooks/useGallery';
import { supabase } from '../../lib/supabaseClient';

const Gallery = () => {
    const { data: items = [] } = useGallery();
    const [ref, isInView] = useInView();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    useEffect(() => {
        if (items.length <= 1 || isLightboxOpen) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(timer);
    }, [items.length, isLightboxOpen]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
    };

    return (
        <>
            <motion.section
                id="gallery"
                ref={ref}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
                transition={{ duration: 0.6 }}
                className="bg-transparent relative z-20 responsive-page"
                aria-labelledby="gallery-heading"
            >
                <div className="px-6 py-20 pb-32 max-w-5xl mx-auto">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-[4rem] sm:text-[5.5rem] lg:text-[7rem] font-bold text-[#0f172a] mb-8 tracking-tight leading-none">
                            <span style={{
                                background: 'linear-gradient(to right, #8DB600, #0d9488)', // Apple green to teal
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                color: 'transparent'
                            }}>GALLERY</span> STATION
                        </h2>

                        <p className="text-xl lg:text-[22px] text-gray-500 max-w-3xl mx-auto font-light leading-relaxed">
                            A glimpse of our station and services.
                        </p>

                    </div>

                    {items.length > 0 ? (
                        <div
                            className="relative w-full rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] bg-slate-900 group overflow-hidden"
                            style={{ height: '450px' }}
                        >
                            {/* REMOVED: border-4 border-white/60 */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentIndex}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute inset-0 w-full h-full"
                                >
                                    {/* CHANGED: Restored Next.js <Image> now that domain restrictions are resolved */}
                                    <Image
                                        src={items[currentIndex]?.image_url}
                                        alt={items[currentIndex]?.title || 'Gallery image'}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-500 hover:scale-105 cursor-pointer"
                                        onClick={() => setIsLightboxOpen(true)}
                                        loading="lazy"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 via-white/40 to-transparent p-6 md:p-8 text-black z-20 pointer-events-none">
                                        <h3 className="text-2xl md:text-3xl font-bold drop-shadow-md">
                                            {items[currentIndex]?.title}
                                        </h3>
                                        {items[currentIndex]?.description && (
                                            <p className="text-sm md:text-base text-gray-800 mt-2 max-w-3xl drop-shadow">
                                                {items[currentIndex]?.description}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation Buttons */}
                            {items.length > 1 && (
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

                                    {/* Dots */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30 bg-black/30 px-4 py-2.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                                        {items.map((_, idx) => (
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
                        <div className="text-center py-20 rounded-[2rem] border border-white/40 bg-white/60 backdrop-blur-md shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]">
                            <ImageIcon className="w-12 h-12 text-teal-400 mx-auto mb-4" />
                            <p className="text-slate-600 font-medium">No gallery items yet.</p>
                        </div>
                    )}
                </div>
            </motion.section>
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
                            src={items[currentIndex]?.image_url}
                            alt={items[currentIndex]?.title || 'Enlarged Image'}
                            width={1200}
                            height={800}
                            className="w-full max-w-5xl max-h-[85vh] object-contain cursor-default drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)] rounded-[2rem] bg-transparent"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <br></br>
            <br></br>
        </>
    );
};

export default Gallery;
