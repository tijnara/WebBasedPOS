// src/components/landing/WhyChooseUs.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const FilterIcon = ({ gradId }) => (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="10" width="32" height="4" rx="2" fill={`url(#${gradId})`} />
        <path d="M12 14h6v24h-6z M21 14h6v24h-6z M30 14h6v24h-6z" fill={`url(#${gradId})`} />
        <path d="M14 38h2v4h-2z M23 38h2v4h-2z M32 38h2v4h-2z" fill={`url(#${gradId})`} opacity="0.5"/>
    </svg>
);

const MonitoredDropIcon = ({ gradId }) => (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12l2 4l4 2l-4 2l-2 4l-2-4l-4-2l4-2z" fill={`url(#${gradId})`} />
        <path d="M38 16l1.5 3l3 1.5l-3 1.5l-1.5 3l-1.5-3l-3-1.5l3-1.5z" fill={`url(#${gradId})`} />
        <path d="M24 16C24 16 14 28 14 36C14 41.523 18.477 46 24 46C29.523 46 34 41.523 34 36C34 28 24 16 24 16Z" fill={`url(#${gradId})`} opacity="0.8"/>
        <path d="M22 30c-2 2-2 5 0 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
);

const HealthIcon = ({ gradId }) => (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 42s-16-10-16-21a9 9 0 0118-4a9 9 0 0118 4c0 11-16 21-16 21z" fill={`url(#${gradId})`} opacity="0.8"/>
        <path d="M24 16v12M19 21h10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="24" cy="21" r="10" stroke="#fff" strokeWidth="2" strokeDasharray="4 2" fill="none"/>
    </svg>
);

const EcoJugIcon = ({ gradId }) => (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 8h12v4h-12z" fill={`url(#${gradId})`} />
        <path d="M14 12h20l2 6v26c0 2-2 2-2 2H14c0 0-2 0-2-2V18l2-6z" fill={`url(#${gradId})`} opacity="0.7"/>
        <path d="M24 20c-4.418 0-8 3.582-8 8s3.582 8 8 8s8-3.582 8-8" stroke="#fff" strokeWidth="2" fill="none"/>
    </svg>
);

const TrustBadgeIcon = ({ gradId }) => (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 4L10 10v12c0 11 14 22 14 22s14-11 14-22V10L24 4z" fill={`url(#${gradId})`} opacity="0.9"/>
        <path d="M24 14l2.5 6h6.5l-5 4.5l2 6.5l-6-4.5l-6 4.5l2-6.5l-5-4.5h6.5z" fill="#fff"/>
    </svg>
);

const LocalHomeIcon = ({ gradId }) => (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 6L6 22h4v20h28V22h4L24 6z" fill={`url(#${gradId})`} opacity="0.7"/>
        <path d="M24 20C24 20 18 28 18 33C18 36.314 20.686 39 24 39C27.314 39 30 36.314 30 33C30 28 24 20 24 20Z" fill="#fff" />
    </svg>
);

export default function WhyChooseUs() {
    const reasons = [
        {
            icon: FilterIcon,
            title: '21-Stage Filtration',
            description: 'Our multi-barrier reverse osmosis system removes impurities, micro-plastics, and contaminants down to microscopic microns.'
        },
        {
            icon: MonitoredDropIcon,
            title: 'Continuous Water Testing',
            description: 'TDS, pH, and cleanliness benchmarks are logged daily to ensure every jug matches medical-grade drinking standards.'
        },
        {
            icon: HealthIcon,
            title: 'Essential Minerals Intact',
            description: 'Unlike flat distilled water, our process remineralizes hydration with calcium and magnesium for optimal electrolyte balance.'
        },
        {
            icon: EcoJugIcon,
            title: 'Zero Single-Use Waste',
            description: 'Refill standard 5-gallon slim and round containers. We sanitize each jug with food-grade ozone before every refill.'
        },
        {
            icon: TrustBadgeIcon,
            title: 'Community Trusted',
            description: 'Proudly family-owned and operated in Labrador, Pangasinan. Serving local schools, businesses, and neighborhoods daily.'
        },
        {
            icon: LocalHomeIcon,
            title: 'Prompt Doorstep Delivery',
            description: 'Fast, friendly multicab delivery right to your gate. We handle the heavy lifting so you never run dry.'
        }
    ];

    return (
        <motion.section
            id="why-choose"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="py-12 lg:py-16 relative"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-lime-50 border border-lime-200 text-[#5f7d00] text-xs font-bold uppercase tracking-wider mb-4">
                        <Sparkles className="w-3.5 h-3.5 text-[#8DB600]" />
                        Our Commitment to Quality
                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Why Labrador Families Choose{' '}
                        <span className="bg-gradient-to-r from-[#8DB600] to-[#6abf45] bg-clip-text text-transparent">
                            Seaside
                        </span>
                    </h2>

                    <p className="text-slate-600 text-sm sm:text-base font-medium mt-3 leading-relaxed">
                        Precision filtration technology paired with trustworthy neighborhood service. Every drop is inspected for your family's complete peace of mind.
                    </p>
                </div>

                {/* 6-Card Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {reasons.map((reason, index) => {
                        const Icon = reason.icon;
                        const gradId = `why-grad-${index}`;

                        return (
                            <div
                                key={index}
                                className="group p-6 sm:p-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-lime-400 transition-all duration-300 flex flex-col items-start text-left relative overflow-hidden"
                            >
                                <svg width="0" height="0" className="absolute">
                                    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#8DB600" />
                                        <stop offset="100%" stopColor="#6abf45" />
                                    </linearGradient>
                                </svg>

                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-50 to-lime-100 border border-lime-200 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200 shadow-2xs">
                                    <Icon gradId={gradId} />
                                </div>

                                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 group-hover:text-[#8DB600] transition-colors">
                                    {reason.title}
                                </h3>

                                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                                    {reason.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.section>
    );
}