// src/components/landing/WhyChooseUs.jsx
import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useStore } from '../../store/useStore';
import AnimatedLandingIcon from './AnimatedLandingIcon';

function ReasonTiltCard({ reason, index }) {
    const darkMode = useStore((s) => s.darkMode);
    const [hoverTick, setHoverTick] = useState(0);

    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 220, damping: 24 });
    const sy = useSpring(my, { stiffness: 220, damping: 24 });
    const rotateX = useTransform(sy, [-0.5, 0.5], [6, -6]);
    const rotateY = useTransform(sx, [-0.5, 0.5], [-6, 6]);

    const handleMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - rect.left) / rect.width - 0.5);
        my.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    const handleLeave = () => {
        mx.set(0);
        my.set(0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: index * 0.07 }}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            onMouseEnter={() => setHoverTick((t) => t + 1)}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            className="group p-6 sm:p-7 bg-white/85 dark:bg-slate-900/75 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-xs hover:shadow-xl hover:border-[#8DB600]/70 dark:hover:border-[#a3d100]/50 transition-colors duration-300 flex flex-col items-start text-left relative overflow-hidden"
        >
            <div
                className="absolute top-0 inset-x-8 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: 'linear-gradient(90deg, transparent, #8DB600, #06b6d4, transparent)'
                }}
            />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-50 to-cyan-50 dark:from-lime-950/60 dark:to-cyan-950/50 border border-lime-200/80 dark:border-white/15 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-2xs">
                <AnimatedLandingIcon
                    name={reason.iconName}
                    size={34}
                    strokeColor={darkMode ? '#a3d100' : '#659000'}
                    triggerKey={hoverTick}
                />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#659000] dark:group-hover:text-[#a3d100] transition-colors">
                {reason.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                {reason.description}
            </p>
        </motion.div>
    );
}

export default function WhyChooseUs() {
    const darkMode = useStore((s) => s.darkMode);

    const reasons = [
        {
            iconName: 'settings2',
            title: '21-Stage Filtration',
            description:
                'Our multi-barrier reverse osmosis system removes impurities, micro-plastics, and contaminants down to microscopic microns.'
        },
        {
            iconName: 'activity',
            title: 'Continuous Water Testing',
            description:
                'TDS, pH, and cleanliness benchmarks are logged daily to ensure every jug matches medical-grade drinking standards.'
        },
        {
            iconName: 'heart',
            title: 'Essential Minerals Intact',
            description:
                'Unlike flat distilled water, our process remineralizes hydration with calcium and magnesium for optimal electrolyte balance.'
        },
        {
            iconName: 'infinity',
            title: 'Zero Single-Use Waste',
            description:
                'Refill standard 5-gallon slim and round containers. We sanitize each jug with food-grade ozone before every refill.'
        },
        {
            iconName: 'star',
            title: 'Community Trusted',
            description:
                'Proudly family-owned and operated in Labrador, Pangasinan. Serving local schools, businesses, and neighborhoods daily.'
        },
        {
            iconName: 'home',
            title: 'Prompt Doorstep Delivery',
            description:
                'Fast, friendly multicab delivery right to your gate. We handle the heavy lifting so you never run dry.'
        }
    ];

    return (
        <section id="why-choose" className="py-12 lg:py-16 relative perspective-[1200px]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/85 dark:bg-slate-900/80 border border-lime-300/80 dark:border-white/15 text-[#5f7d00] dark:text-[#a3d100] text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-md">
                        <AnimatedLandingIcon
                            name="star"
                            size={16}
                            strokeColor={darkMode ? '#a3d100' : '#8DB600'}
                            loop
                        />
                        Our Commitment to Quality
                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        Why Labrador Families Choose{' '}
                        <span className="bg-gradient-to-r from-[#659000] via-emerald-500 to-cyan-500 dark:from-[#a3d100] dark:to-cyan-400 bg-clip-text text-transparent">
                            Seaside
                        </span>
                    </h2>

                    <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium mt-3 leading-relaxed">
                        Precision filtration technology paired with trustworthy neighborhood service. Every drop is inspected for your family&apos;s complete peace of mind.
                    </p>
                </div>

                {/* 6-Card Interactive 3D Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {reasons.map((reason, index) => (
                        <ReasonTiltCard key={index} reason={reason} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}