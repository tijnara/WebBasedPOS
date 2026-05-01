import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useInView } from '../../hooks/useInView';
import { useGallery } from '../../hooks/useGallery';

const Gallery = () => {
    const { data: items = [] } = useGallery();
    const [ref, isInView] = useInView();
    const [[currentIndex, direction], setCurrentIndex] = useState([0, 0]);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const nextSlide = () => {
        setCurrentIndex(prev => [(prev[0] + 1) % items.length, 1]);
    };

    const prevSlide = () => {
        setCurrentIndex(prev => [(prev[0] - 1 + items.length) % items.length, -1]);
    };

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction) => ({
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0,
        }),
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
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#0f172a] mb-8 tracking-tight leading-none">
                            <span style={{
                                background: 'linear-gradient(to right, #8DB600, #0d9488)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                color: 'transparent'
                            }}>GALLERY</span>
                        </h2>
                        <p className="text-lg md:text-xl text-gray-500 max-w-3xl mx-auto font-light leading-relaxed">
                            A glimpse of our station and services.
                        </p>
                    </div>

                    {items.length > 0 ? (
                        <div
                            className="relative w-full rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] bg-slate-900 group overflow-hidden h-[350px] md:h-[500px]"
                        >
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
                                        opacity: { duration: 0.2 },
                                    }}
                                    className="absolute inset-0 w-full h-full"
                                >
                                    <Image
                                        src={items[currentIndex]?.image_url}
                                        alt={items[currentIndex]?.title || 'Gallery image'}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 80vw"
                                        className="object-cover cursor-pointer hover:scale-105 transition-transform duration-700"
                                        onClick={() => setIsLightboxOpen(true)}
                                        priority
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 md:p-8 text-white z-20 pointer-events-none">
                                        <h3 className="text-xl md:text-3xl font-bold drop-shadow-md">
                                            {items[currentIndex]?.title}
                                        </h3>
                                        {items[currentIndex]?.description && (
                                            <p className="text-xs md:text-base mt-2 max-w-3xl drop-shadow opacity-90">
                                                {items[currentIndex]?.description}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {items.length > 1 && (
                                <>
                                    <button
                                        onClick={prevSlide}
                                        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 md:w-14 md:h-14 bg-black/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all md:opacity-0 group-hover:opacity-100 min-w-[48px] min-h-[48px] p-2"
                                        aria-label="Previous image"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>

                                    <button
                                        onClick={nextSlide}
                                        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 md:w-14 md:h-14 bg-black/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all md:opacity-0 group-hover:opacity-100 min-w-[48px] min-h-[48px] p-2"
                                        aria-label="Next image"
                                    >
                                        <ChevronRight size={24} />
                                    </button>

                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 bg-black/30 px-3 py-2 rounded-full backdrop-blur-md border border-white/10">
                                        {items.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentIndex([idx, idx > currentIndex ? 1 : -1])}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                                    idx === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20 rounded-[2rem] border border-white/40 bg-white/60 backdrop-blur-md">
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
                        className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 md:p-10"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <button
                            className="absolute top-6 right-6 text-white/70 hover:text-white z-[1000]"
                            onClick={() => setIsLightboxOpen(false)}
                        >
                            <X size={40} />
                        </button>

                        <div className="relative w-full max-w-5xl h-[80vh]">
                            <Image
                                src={items[currentIndex]?.image_url}
                                alt="Enlarged Image"
                                fill
                                className="object-contain"
                                unoptimized={true}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Gallery;