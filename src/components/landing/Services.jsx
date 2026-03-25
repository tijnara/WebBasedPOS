import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useInView } from '../../hooks/useInView';

// Define SVG icons with gradients
const serviceIcons = [
    // Leaf
    <svg key="leaf" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="service-icon-gradient-1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a3e635" />
                <stop offset="1" stopColor="#14b8a6" />
            </linearGradient>
        </defs>
        <path d="M36 12C36 12 28 12 20 20C12 28 12 36 12 36C12 36 20 36 28 28C36 20 36 12 36 12Z" fill="url(#service-icon-gradient-1)"/>
    </svg>,
    // Truck
    <svg key="truck" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="service-icon-gradient-2" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a3e635" />
                <stop offset="1" stopColor="#14b8a6" />
            </linearGradient>
        </defs>
        <path d="M39.4,21.8l-6-6.2h-3.1V12c0-1.7-1.3-3-3-3h-8c-1.7,0-3,1.3-3,3v3.6H12c-1.7,0-3,1.3-3,3v11 c0,1.7,1.3,3,3,3h2.1c0.8,2.3,3,4,5.4,4s4.6-1.7,5.4-4h5.1c0.8,2.3,3,4,5.4,4s4.6-1.7,5.4-4H42c1.7,0,3-1.3,3-3v-7.2L39.4,21.8z M15.5,35c-1.4,0-2.5-1.1-2.5-2.5s1.1-2.5,2.5-2.5s2.5,1.1,2.5,2.5S16.9,35,15.5,35z M33.5,35c-1.4,0-2.5-1.1-2.5-2.5 s1.1-2.5,2.5-2.5s2.5,1.1,2.5,2.5S34.9,35,33.5,35z" fill="url(#service-icon-gradient-2)"/>
    </svg>,
    // GlassWater (using Water Drop)
    <svg key="drop" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="service-icon-gradient-3" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a3e635" />
                <stop offset="1" stopColor="#14b8a6" />
            </linearGradient>
        </defs>
        <path d="M24 6C24 6 12 22 12 30C12 38 18 44 24 44C30 44 36 38 36 30C36 22 24 6 24 6Z" fill="url(#service-icon-gradient-3)"/>
    </svg>,
    // Snowflake (using Star)
    <svg key="star" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="service-icon-gradient-4" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a3e635" />
                <stop offset="1" stopColor="#14b8a6" />
            </linearGradient>
        </defs>
        <path d="M24 8L30 18H40L32 26L35 36L24 30L13 36L16 26L8 18H18L24 8Z" fill="url(#service-icon-gradient-4)"/>
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

const ServiceCard = memo(({ icon, title, description }) => (
    <div 
        className="p-8 rounded-[2rem] bg-gradient-to-br from-lime-300 to-teal-400 backdrop-blur-md shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] text-center flex flex-col items-center transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.2)] hover:-translate-y-2"
    >
        <div className="w-20 h-20 rounded-full bg-white/70 flex items-center justify-center mb-6 shadow-inner">
            {icon}
        </div>
        <h3 className="text-slate-800 text-base font-bold uppercase tracking-wider mb-4">
            {title}
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
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
                        className="inline-flex items-center justify-center rounded-full px-4 py-1 mb-8"
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
                        className="text-[5rem] sm:text-[7rem] lg:text-[11rem] font-bold text-[#0f172a] mb-8 tracking-tight leading-none"
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
