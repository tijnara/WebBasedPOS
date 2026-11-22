// src/components/landing/Gallery.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useGallery } from '../../hooks/useGallery';
import { useStore } from '../../store/useStore';
import AnimatedLandingIcon from './AnimatedLandingIcon';

const FALLBACK_GALLERY_IMAGE = '/seasideHD_.png';

export default function Gallery() {
    const { data: items = [], isLoading } = useGallery();
    const darkMode = useStore((s) => s.darkMode);
    const [[currentIndex, direction], setCurrentIndex] = useState([0, 0]);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [failedUrls, setFailedUrls] = useState({});

    const totalItems = items.length;
    const safeIndex = totalItems > 0 ? ((currentIndex % totalItems) + totalItems) % totalItems : 0;
    const currentItem = totalItems > 0 ? items[safeIndex] : null;

    const resolveImageSrc = useCallback(
        (rawUrl) => {
            if (!rawUrl || typeof rawUrl !== 'string' || failedUrls[rawUrl]) {
                return FALLBACK_GALLERY_IMAGE;
            }
            return rawUrl;
        },
        [failedUrls]
    );

    const markImageFailed = useCallback((rawUrl) => {
        if (!rawUrl || rawUrl === FALLBACK_GALLERY_IMAGE) return;
        setFailedUrls((prev) => (prev[rawUrl] ? prev : { ...prev, [rawUrl]: true }));
    }, []);

    const nextSlide = useCallback(() => {
        if (totalItems <= 1) return;
        setCurrentIndex((prev) => [(prev[0] + 1) % totalItems, 1]);
    }, [totalItems]);

    const prevSlide = useCallback(() => {
        if (totalItems <= 1) return;
        setCurrentIndex((prev) => [(prev[0] - 1 + totalItems) % totalItems, -1]);
    }, [totalItems]);

    // Keyboard navigation when lightbox is open
    useEffect(() => {
        if (!isLightboxOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsLightboxOpen(false);
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen, nextSlide, prevSlide]);

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

    const currentRawUrl = currentItem?.image_url;
    const currentDisplaySrc = resolveImageSrc(currentRawUrl);

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

                    {isLoading && totalItems === 0 ? (
                        <div className="w-full rounded-3xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse h-[320px] sm:h-[480px] lg:h-[540px] border border-slate-200/80 dark:border-white/10" />
                    ) : totalItems > 0 ? (
                        <div className="relative w-full rounded-3xl shadow-xl bg-slate-900 group overflow-hidden h-[320px] sm:h-[480px] lg:h-[540px] border border-slate-200/80 dark:border-white/10">
                            <AnimatePresence initial={false} custom={direction}>
                                <motion.div
                                    key={safeIndex}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    drag={totalItems > 1 ? 'x' : false}
                                    dragConstraints={{ left: 0, right: 0 }}
                                    dragElastic={0.18}
                                    onDragEnd={(_, info) => {
                                        if (info.offset.x < -50) nextSlide();
                                        else if (info.offset.x > 50) prevSlide();
                                    }}
                                    transition={{
                                        x: { type: 'spring', stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.25 }
                                    }}
                                    className="absolute inset-0 w-full h-full touch-pan-y"
                                >
                                    <Image
                                        src={currentDisplaySrc}
                                        alt={currentItem?.title || 'Seaside Station Gallery'}
                                        fill
                                        unoptimized
                                        sizes="(max-width: 1024px) 100vw, 1152px"
                                        className="object-cover cursor-pointer hover:scale-102 transition-transform duration-700"
                                        onClick={() => setIsLightboxOpen(true)}
                                        onError={() => markImageFailed(currentRawUrl)}
                                        priority={safeIndex === 0}
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5 sm:p-8 text-white z-20 pointer-events-none">
                                        <h3 className="text-base sm:text-2xl font-black drop-shadow-md pr-20 sm:pr-28">
                                            {currentItem?.title}
                                        </h3>
                                        {currentItem?.description && (
                                            <p className="text-xs sm:text-sm mt-1 max-w-2xl text-slate-200/90 drop-shadow line-clamp-2 pr-16 sm:pr-24">
                                                {currentItem.description}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {totalItems > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={prevSlide}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-black/45 hover:bg-black/75 text-white rounded-full backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer"
                                        aria-label="Previous Image"
                                    >
                                        <AnimatedLandingIcon name="chevronLeft" size={22} strokeColor="#ffffff" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={nextSlide}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-black/45 hover:bg-black/75 text-white rounded-full backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer"
                                        aria-label="Next Image"
                                    >
                                        <AnimatedLandingIcon name="chevronRight" size={22} strokeColor="#ffffff" />
                                    </button>

                                    <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 bg-black/55 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                                        {items.map((item, idx) => (
                                            <button
                                                key={item?.id ?? idx}
                                                type="button"
                                                onClick={() => setCurrentIndex([idx, idx > safeIndex ? 1 : -1])}
                                                aria-label={`View slide ${idx + 1} of ${totalItems}`}
                                                aria-current={idx === safeIndex ? 'true' : undefined}
                                                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                                    idx === safeIndex ? 'w-5 bg-emerald-400' : 'w-1.5 bg-white/40 hover:bg-white/70'
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
                {isLightboxOpen && currentItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/92 backdrop-blur-md p-4 sm:p-10"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <button
                            type="button"
                            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 z-[1000] cursor-pointer transition-colors"
                            onClick={() => setIsLightboxOpen(false)}
                            aria-label="Close Lightbox"
                        >
                            <AnimatedLandingIcon name="plusToX" size={28} strokeColor="#ffffff" />
                        </button>

                        {totalItems > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        prevSlide();
                                    }}
                                    className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-[1000] flex items-center justify-center w-11 h-11 bg-white/15 hover:bg-white/25 text-white rounded-full backdrop-blur-md transition-all cursor-pointer"
                                    aria-label="Previous Expanded Image"
                                >
                                    <AnimatedLandingIcon name="chevronLeft" size={24} strokeColor="#ffffff" />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        nextSlide();
                                    }}
                                    className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-[1000] flex items-center justify-center w-11 h-11 bg-white/15 hover:bg-white/25 text-white rounded-full backdrop-blur-md transition-all cursor-pointer"
                                    aria-label="Next Expanded Image"
                                >
                                    <AnimatedLandingIcon name="chevronRight" size={24} strokeColor="#ffffff" />
                                </button>
                            </>
                        )}

                        <div
                            className="relative w-full max-w-5xl h-[70vh] sm:h-[75vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={currentDisplaySrc}
                                alt={currentItem?.title || 'Expanded Facility Image'}
                                fill
                                unoptimized
                                className="object-contain"
                                onError={() => markImageFailed(currentRawUrl)}
                            />
                        </div>

                        {(currentItem?.title || currentItem?.description) && (
                            <div
                                className="mt-3 max-w-2xl text-center px-4 text-white"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {currentItem?.title && (
                                    <p className="text-sm sm:text-base font-bold">{currentItem.title}</p>
                                )}
                                {currentItem?.description && (
                                    <p className="text-xs text-slate-300 mt-0.5">{currentItem.description}</p>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}