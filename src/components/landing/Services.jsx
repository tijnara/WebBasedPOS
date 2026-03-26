import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useInView } from '../../hooks/useInView';

// Define SVG icons with gradients
const serviceIcons = [
    // 1. Walk-In (Storefront + Person)
    <svg key="walkin" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="service-icon-gradient-1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a3e635" />
                <stop offset="1" stopColor="#14b8a6" />
            </linearGradient>
        </defs>
        {/* Storefront Building */}
        <path d="M6 18L10 6h20l4 12v4H6v-4zm4 6v18h4V28h10v14h4V24H10z" fill="url(#service-icon-gradient-1)"/>
        {/* Person Head */}
        <circle cx="41" cy="20" r="4" fill="url(#service-icon-gradient-1)"/>
        {/* Person Body */}
        <path d="M47 42v-8c0-2.209-1.791-4-4-4h-4c-2.209 0-4 1.791-4 4v8h12z" fill="url(#service-icon-gradient-1)"/>
    </svg>,

    // 2. Truck (Delivery)
    <svg key="truck" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="service-icon-gradient-2" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a3e635" />
                <stop offset="1" stopColor="#14b8a6" />
            </linearGradient>
        </defs>
        <path d="M39.4 21.8l-6-6.2h-3.1V12c0-1.7-1.3-3-3-3h-8c-1.7 0-3 1.3-3 3v3.6H12c-1.7 0-3 1.3-3 3v11c0 1.7 1.3 3 3 3h2.1c.8 2.3 3 4 5.4 4s4.6-1.7 5.4-4h5.1c.8 2.3 3 4 5.4 4s4.6-1.7 5.4-4H42c1.7 0 3-1.3 3-3v-7.2L39.4 21.8z M15.5 35c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z M33.5 35c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z" fill="url(#service-icon-gradient-2)"/>
    </svg>,

    // 3. PET Bottles (Small Retail Bottles)
    <svg key="bottles" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="service-icon-gradient-3" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a3e635" />
                <stop offset="1" stopColor="#14b8a6" />
            </linearGradient>
        </defs>
        <path d="M14 12h6v4h-6v-4z M11 21l3-5v-1h6v1l3 5v19a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V21z" fill="url(#service-icon-gradient-3)"/>
        <path d="M28 6h6v4h-6V6z M25 15l3-5v-1h6v1l3 5v25a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V15z" fill="url(#service-icon-gradient-3)" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
    </svg>,

    // 4. Real Ice Cubes (3D Overlapping Cubes)
    <svg key="ice" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="service-icon-gradient-4" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a3e635" />
                <stop offset="1" stopColor="#14b8a6" />
            </linearGradient>
        </defs>
        <path d="M28 6 L42 13 V27 L28 34 L14 27 V13 Z" fill="url(#service-icon-gradient-4)"/>
        <path d="M14 13 L28 20 L42 13 M28 20 V34" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none"/>

        <path d="M16 20 L30 26 V40 L16 46 L2 40 V26 Z" fill="url(#service-icon-gradient-4)"/>
        <path d="M2 26 L16 32 L30 26 M16 32 V46" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    </svg>,
];

const SERVICES_DATA = [
    {
        title: 'Walk-In Refills',
        description: 'Experience fast, friendly, and clean service right at our station. Bring your own jugs to help reduce plastic waste, and watch our team sanitize and refill them with crystal clear water while you wait.',
    },
    {
        title: 'Door-to-Door Delivery',
        description: 'Stay hydrated without leaving your home. We offer prompt and reliable delivery services across Labrador and neighboring municipalities. Just send us a message, and we\'ll do the heavy lifting for you.',
    },
    {
        title: 'Ready-to-Drink PET Bottles',
        description: 'Always on the go? Grab our freshly sealed, purified water in convenient PET bottles. Perfect for road trips, parties, corporate events, or simply stocking up your fridge.',
    },
    {
        title: 'Purified Ice Tubes & Cubes',
        description: 'Keep your drinks perfectly chilled without compromising on safety. Made from our signature 21-stage filtered water, our ice is crystal clear, food-grade safe, and slow-melting.',
    },
];

const ServiceCard = memo(({ icon, title, description, index }) => (
    <div
        className="p-8 rounded-[2rem] bg-gradient-to-br from-lime-300 to-teal-400 backdrop-blur-md shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] text-center flex flex-col items-center transition-all duration-300 hover:shadow-[0_20px_40px_0_rgba(31,38,135,0.3)] hover:-translate-y-2 relative"
    >
        {/* Animated 3D Floating Icon Container */}
        <motion.div
            className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 z-10"
            // This creates the 3D Sphere lighting effect using combined shadows
            style={{
                boxShadow: 'inset 0 -8px 12px rgba(0,0,0,0.1), inset 0 4px 8px rgba(255,255,255,0.9), 0 15px 25px rgba(20, 184, 166, 0.4)'
            }}
            // Continuous floating animation, staggered by index so they don't all float exactly at the same time
            animate={{
                y: [0, -12, 0],
            }}
            transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.2
            }}
            whileHover={{ scale: 1.1, rotateZ: 5 }}
        >
            <div className="transform scale-110 drop-shadow-md">
                {icon}
            </div>
        </motion.div>

        <h3 className="text-slate-800 text-base font-bold uppercase tracking-wider mb-4">
            {title}
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {description}
        </p>
    </div>
));
ServiceCard.displayName = 'ServiceCard';

const Services = () => {
    const [ref, isInView] = useInView();

    return (
        <motion.section
            id="services"
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
            transition={{ duration: 0.6 }}
            className="bg-transparent relative mt-32 responsive-page"
            aria-labelledby="services-heading"
        >
            <div className="px-6 py-20 pb-32 max-w-6xl mx-auto">
                <div className="text-center mb-16 mt-48">
                    <div
                        className="inline-flex items-center justify-center rounded-full px-4 py-1 mb-8 shadow-sm"
                        style={{
                            backgroundColor: '#cffafe',
                            display: 'inline-flex',
                            borderRadius: '9999px',
                        }}
                    >
                        <p className="text-xs md:text-sm font-bold tracking-wider uppercase" style={{ color: '#06b6d4' }}>
                            Convenience and Quality, Delivered.
                        </p>
                    </div>
                    <h2
                        id="services-heading"
                        className="text-[5rem] sm:text-[7rem] lg:text-[11rem] font-bold text-[#0f172a] mb-8 tracking-tight leading-none drop-shadow-sm"
                    >
                        Our <span style={{
                        background: 'linear-gradient(to right, #8DB600, #0d9488)', // Apple green to teal
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        color: 'transparent'
                    }}>Services</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {SERVICES_DATA.map((service, index) => (
                        <ServiceCard
                            key={index}
                            index={index}
                            icon={serviceIcons[index]}
                            title={service.title}
                            description={service.description}
                        />
                    ))}
                </div>
            </div>
            <br></br>
            <br></br>
        </motion.section>
    );
};

export default Services;