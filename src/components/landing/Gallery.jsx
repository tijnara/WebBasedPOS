// src/components/landing/Gallery.jsx
import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useGallery } from '../../hooks/useGallery';
import { useStore } from '../../store/useStore';
import AnimatedLandingIcon from './AnimatedLandingIcon';

export default function Gallery() {
    const { data: items = [] } = useGallery();
    const darkMode = useStore((s) => s.darkMode);
    const [[currentIndex, direction], setCurrentIndex] = useState([0, 0]);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const nextSlide = () => {
        setCurrentIndex((prev) => [(prev[0] + 1) % items.length, 1]);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => [(prev[0] - 1 + items.length) % items.length, -1]);
    };

    const variants = {
        enter: (dir) => ({
            x: dir > 0 ? '100%' : '-100%',
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (dir) => ({
            x: dir < 0 ? '100%' : '-100%',
            opacity: 0
        })
    };

    return (
        <>
            <motion.section
                id="gallery"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6 }}
                className="py-12 lg:py-16 relative"
                aria-labelledby="gallery-heading"
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/50 text-cyan-800 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4">
                            <AnimatedLandingIcon
                                name="camera"
                                size={16}
                                strokeColor={darkMode ? '#22d3ee' : '#0891b2'}
                            />
                            Station Gallery
                        </div>
                        <h2
                            id="gallery-heading"
                            className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight"
                        >
                            Inside Our{' '}
                            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                                Facility
                            </span>
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium mt-3">
                            A look into our clean refilling room, water testing equipment, and delivery operations.
                        </p>
                    </div>

                    {items.length > 0 ? (
                        <div className="relative w-full rounded-3xl shadow-xl bg-slate-900 group overflow-hidden h-[360px] sm:h-[480px] lg:h-[540px] border border-slate-200/80 dark:border-white/10">
                            <AnimatePresence initial={false} custom={direction}>
                                <motion.div
                                    key={currentIndex}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: 'spring', stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.25 }
                                    }}
                                    className="absolute inset-0 w-full h-full"
                                >
                                    <Image
                                        src={items[currentIndex]?.image_url}
                                        alt={items[currentIndex]?.title || 'Seaside Station Gallery'}
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 1152px"
                                        className="object-cover cursor-pointer hover:scale-102 transition-transform duration-700"
                                        onClick={() => setIsLightboxOpen(true)}
                                        priority
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6 sm:p-8 text-white z-20 pointer-events-none">
                                        <h3 className="text-lg sm:text-2xl font-black drop-shadow-md">
                                            {items[currentIndex]?.title}
                                        </h3>
                                        {items[currentIndex]?.description && (
                                            <p className="text-xs sm:text-sm mt-1 max-w-2xl text-slate-200/90 drop-shadow line-clamp-2">
                                                {items[currentIndex]?.description}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {items.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={prevSlide}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 bg-black/45 hover:bg-black/75 text-white rounded-full backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer"
                                        aria-label="Previous Image"
                                    >
                                        <AnimatedLandingIcon name="chevronLeft" size={22} strokeColor="#ffffff" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={nextSlide}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 bg-black/45 hover:bg-black/75 text-white rounded-full backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer"
                                        aria-label="Next Image"
                                    >
                                        <AnimatedLandingIcon name="chevronRight" size={22} strokeColor="#ffffff" />
                                    </button>

                                    <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                                        {items.map((_, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setCurrentIndex([idx, idx > currentIndex ? 1 : -1])}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                                    idx === currentIndex ? 'w-5 bg-emerald-400' : 'w-1.5 bg-white/40'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-16 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/75 backdrop-blur-sm">
                            <div className="flex justify-center mb-3">
                                <AnimatedLandingIcon
                                    name="camera"
                                    size={36}
                                    strokeColor={darkMode ? '#64748b' : '#94a3b8'}
                                />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
                                Facility pictures updating soon.
                            </p>
                        </div>
                    )}
                </div>
            </motion.section>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {isLightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-10"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <button
                            type="button"
                            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 z-[1000] cursor-pointer"
                            onClick={() => setIsLightboxOpen(false)}
                            aria-label="Close Lightbox"
                        >
                            <AnimatedLandingIcon name="plusToX" size={32} strokeColor="#ffffff" />
                        </button>

                        <div className="relative w-full max-w-5xl h-[75vh]">
                            <Image
                                src={items[currentIndex]?.image_url}
                                alt="Expanded Facility Image"
                                fill
                                className="object-contain"
                                unoptimized
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}