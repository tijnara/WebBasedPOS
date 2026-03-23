import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Truck, GlassWater, Snowflake } from 'lucide-react';
import { useInView } from '../../hooks/useInView';

const Services = () => {
    const [ref, isInView] = useInView();

    const services = [
        {
            icon: <Leaf className="w-10 h-10 text-teal-500" />,
            title: 'Walk-In Refills',
            description: 'Experience fast, friendly, and clean service right at our station. Bring your own jugs to help reduce plastic waste, and watch our team sanitize and refill them with crystal clear water while you wait.',
        },
        {
            icon: <Truck className="w-10 h-10 text-teal-500" />,
            title: 'Door-to-Door Delivery',
            description: 'Stay hydrated without leaving your home. We offer prompt and reliable delivery services across Labrador and neighboring municipalities. Just send us a message, and we\'ll do the heavy lifting for you.',
        },
        {
            icon: <GlassWater className="w-10 h-10 text-teal-500" />,
            title: 'Ready-to-Drink PET Bottles',
            description: 'Always on the go? Grab our freshly sealed, purified water in convenient PET bottles. Perfect for road trips, parties, corporate events, or simply stocking up your fridge.',
        },
        {
            icon: <Snowflake className="w-10 h-10 text-teal-500" />,
            title: 'Purified Ice Tubes & Cubes',
            description: 'Keep your drinks perfectly chilled without compromising on safety. Made from our signature 21-stage filtered water, our ice is crystal clear, food-grade safe, and slow-melting—perfect for any occasion.',
        },
    ];

    return (
        <motion.div
            id="services"
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
            transition={{ duration: 0.6 }}
            className="bg-transparent relative z-20 border-t"
        >
            <div className="px-6 py-20 pb-32 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <span className="inline-block py-2 px-6 rounded-full bg-teal-50 border border-teal-100 mb-4">
                        <h2 className="text-teal-700 text-sm md:text-base font-bold tracking-widest uppercase m-0">
                            Our Services
                        </h2>
                    </span>
                    <p className="text-3xl md:text-4xl font-extrabold text-slate-800 drop-shadow-sm">
                        Convenience and Quality, Delivered.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {services.map((service, index) => (
                        <div
                            key={index}
                            className="p-8 rounded-[2rem] border border-white/40 bg-white/60 backdrop-blur-md shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] text-center flex flex-col items-center transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.2)] hover:-translate-y-2"
                        >
                            <div className="w-20 h-20 rounded-full bg-white/70 border border-white flex items-center justify-center mb-6 shadow-inner">
                                {service.icon}
                            </div>
                            <h3 className="text-slate-800 text-base font-bold uppercase tracking-wider mb-4">
                                {service.title}
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                {service.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default Services;
