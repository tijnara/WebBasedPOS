// src/components/landing/ScrollToTop.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedLandingIcon from './AnimatedLandingIcon';

const ScrollToTop = () => {
    const [showScrollTop, setShowScrollTop] = useState(false);

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

    return (
        <AnimatePresence>
            {showScrollTop && (
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    onClick={scrollToTop}
                    className="fixed bottom-20 md:bottom-6 right-6 z-[999] p-3.5 bg-[#8DB600] text-white rounded-full shadow-2xl hover:bg-[#7ca000] active:scale-90 transition-all cursor-pointer flex items-center justify-center border-2 border-white/25"
                    aria-label="Back to top"
                >
                    <AnimatedLandingIcon name="arrowUp" size={24} strokeColor="#ffffff" loop />
                </motion.button>
            )}
        </AnimatePresence>
    );
};

export default ScrollToTop;