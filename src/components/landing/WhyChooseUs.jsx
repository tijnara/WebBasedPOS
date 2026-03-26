import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from '../../hooks/useInView';

// 1. 21-Stage Filtration (Filters for water)
const FilterIcon = ({ gradId }) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="10" width="32" height="4" rx="2" fill={`url(#${gradId})`} />
        <path d="M12 14h6v24h-6z M21 14h6v24h-6z M30 14h6v24h-6z" fill={`url(#${gradId})`} />
        <path d="M14 38h2v4h-2z M23 38h2v4h-2z M32 38h2v4h-2z" fill={`url(#${gradId})`} opacity="0.5"/>
    </svg>
);

// 2. Crystal Clear Quality (Tested/monitored drops)
const MonitoredDropIcon = ({ gradId }) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12l2 4l4 2l-4 2l-2 4l-2-4l-4-2l4-2z" fill={`url(#${gradId})`} />
        <path d="M38 16l1.5 3l3 1.5l-3 1.5l-1.5 3l-1.5-3l-3-1.5l3-1.5z" fill={`url(#${gradId})`} />
        <path d="M24 16C24 16 14 28 14 36C14 41.523 18.477 46 24 46C29.523 46 34 41.523 34 36C34 28 24 16 24 16Z" fill={`url(#${gradId})`} opacity="0.8"/>
        <path d="M22 30c-2 2-2 5 0 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
);

// 3. Health First (Remineralized, balanced pH)
const HealthIcon = ({ gradId }) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 42s-16-10-16-21a9 9 0 0118-4a9 9 0 0118 4c0 11-16 21-16 21z" fill={`url(#${gradId})`} opacity="0.8"/>
        <path d="M24 16v12M19 21h10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="24" cy="21" r="10" stroke="#fff" strokeWidth="2" strokeDasharray="4 2" fill="none"/>
    </svg>
);

// 4. Eco-Friendly (Reduce plastic, refill jugs)
const EcoJugIcon = ({ gradId }) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 8h12v4h-12z" fill={`url(#${gradId})`} />
        <path d="M14 12h20l2 6v26c0 2-2 2-2 2H14c0 0-2 0-2-2V18l2-6z" fill={`url(#${gradId})`} opacity="0.7"/>
        <path d="M24 20c-4.418 0-8 3.582-8 8s3.582 8 8 8s8-3.582 8-8" stroke="#fff" strokeWidth="2" fill="none"/>
        <path d="M32 28l-2-2l-2 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M16 28l2 2l2-2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
);

// 5. Trusted Quality (Excellence, Community choice badge)
const TrustBadgeIcon = ({ gradId }) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 4L10 10v12c0 11 14 22 14 22s14-11 14-22V10L24 4z" fill={`url(#${gradId})`} opacity="0.9"/>
        <path d="M24 14l2.5 6h6.5l-5 4.5l2 6.5l-6-4.5l-6 4.5l2-6.5l-5-4.5h6.5z" fill="#fff"/>
    </svg>
);

// 6. Local Service (Neighbors, reliable service in community)
const LocalHomeIcon = ({ gradId }) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 6L6 22h4v20h28V22h4L24 6z" fill={`url(#${gradId})`} opacity="0.7"/>
        <path d="M24 20C24 20 18 28 18 33C18 36.314 20.686 39 24 39C27.314 39 30 36.314 30 33C30 28 24 20 24 20Z" fill="#fff" />
        <path d="M23 29c-1 1-1 3 0 4" stroke={`url(#${gradId})`} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
);

const WhyChooseUs = () => {
    const [ref, isInView] = useInView();

    const reasons = [
        {
            icon: FilterIcon,
            title: '21-Stage Filtration',
            description: 'Our advanced reverse osmosis system ensures the highest purity standards, using industrial-grade filters to remove impurities.',
        },
        {
            icon: MonitoredDropIcon,
            title: 'Crystal Clear Quality',
            description: 'Every drop is carefully tested and monitored to guarantee the cleanest, safest drinking water for your family.',
        },
        {
            icon: HealthIcon,
            title: 'Health First',
            description: 'Properly remineralized water supports your family\'s health and wellbeing with balanced pH and essential minerals.',
        },
        {
            icon: EcoJugIcon,
            title: 'Eco-Friendly',
            description: 'Reduce plastic waste by refilling your jugs. Together, we\'re making a positive impact on our environment.',
        },
        {
            icon: TrustBadgeIcon,
            title: 'Trusted Quality',
            description: 'Serving Labrador, Pangasinan with pride. Our commitment to excellence has made us the community\'s choice.',
        },
        {
            icon: LocalHomeIcon,
            title: 'Local Service',
            description: 'We\'re your neighbors, dedicated to providing friendly, reliable service and world-class hydration right in your community.',
        },
    ];

    return (
        <motion.section
            id="why-choose"
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
            transition={{ duration: 0.6 }}
            className="py-24 relative overflow-hidden font-sans bg-white responsive-page"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <div className="text-center mb-16">
                    <div className="inline-block mb-4">
                        <span className="px-5 py-2 bg-teal-50 text-teal-600 rounded-full text-sm font-semibold tracking-wide shadow-sm" style={{background: 'linear-gradient(90deg, #99f6e4 0%, #d1fae5 100%)', color: '#14b8a6'}}>
                            Our Commitment to Excellence
                        </span>
                    </div>
                    <h2 className="text-[4rem] sm:text-[6rem] lg:text-[10rem] font-bold text-[#0f172a] mb-8 tracking-tight leading-none drop-shadow-sm">
                        WHY CHOOSE{' '}
                        <span style={{
                            background: 'linear-gradient(to right, #8DB600, #0d9488)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            color: 'transparent'
                        }}>
    SEASIDE?
</span>

                    </h2>
                    <p className="text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed" style={{color: '#64748b', fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: '1.35rem'}}>
                        We're committed to delivering the best water refilling experience with advanced technology, sustainable practices, and genuine care for our community.
                    </p>
                </div>

                {/* FIXED: Changed to grid-cols-1 md:grid-cols-3 to force the 3 column layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {reasons.map((reason, index) => {
                        const Icon = reason.icon;
                        const gradId = `why-grad-${index}`;

                        return (
                            <div
                                key={index}
                                className="group p-8 bg-white rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_rgba(20,184,166,0.15)] transition-all duration-500 border border-gray-100 hover:border-teal-200 flex flex-col items-center text-center relative"
                            >
                                <svg width="0" height="0" className="absolute">
                                    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor={index % 2 === 0 ? '#009b70' : '#84cc16'} />
                                        <stop offset="100%" stopColor={index % 2 === 0 ? '#84cc16' : '#009b70'} />
                                    </linearGradient>
                                </svg>

                                <motion.div
                                    className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 z-10"
                                    style={{
                                        boxShadow: 'inset 0 -8px 12px rgba(0,0,0,0.1), inset 0 4px 8px rgba(255,255,255,0.9), 0 15px 25px rgba(20, 184, 166, 0.4)'
                                    }}
                                    animate={{ y: [0, -12, 0] }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: index * 0.15
                                    }}
                                    whileHover={{ scale: 1.1, rotateZ: 5 }}
                                >
                                    <div className="transform scale-110 drop-shadow-md">
                                        <Icon gradId={gradId} />
                                    </div>
                                </motion.div>

                                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-teal-600 transition-colors">
                                    {reason.title}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                    {reason.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <br></br>
            <br></br>
        </motion.section>
    );
};

export default WhyChooseUs;