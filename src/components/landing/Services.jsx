// src/components/landing/Services.jsx
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Droplet, Truck, Package, Snowflake, ArrowRight } from 'lucide-react';

const DEFAULT_SERVICES = [
    {
        id: 'walk_in',
        badge: 'In-Store',
        title: 'Walk-In Refills',
        price: '₱20 - ₱25',
        description:
            'Fast, sanitary refilling right in front of you. Bring your 5-gallon slim or round containers for full high-pressure interior wash and seal.'
    },
    {
        id: 'delivery',
        badge: 'Delivery',
        title: 'Door-to-Door Delivery',
        price: '₱25 - ₱30',
        description:
            'Stay relaxed while we deliver freshly filtered jugs directly to your doorstep anywhere in Labrador and nearby barangays.'
    },
    {
        id: 'bottles',
        badge: 'Grab & Go',
        title: 'Bottled Water Pack',
        price: 'From ₱6.00',
        description:
            'Convenient 350ml and 500ml sealed PET bottles. Ideal for family gatherings, school snacks, road trips, and store resale.'
    },
    {
        id: 'ice',
        badge: 'Food Safe',
        title: 'Purified Tube Ice',
        price: 'From ₱20.00',
        description:
            'Crystal-clear, food-grade ice cubes manufactured solely from our 21-stage RO filtered water. Melts slow and stays pure.'
    }
];

const ICONS = [Droplet, Truck, Package, Snowflake];

const ServiceCard = memo(({ item, index }) => {
    const Icon = ICONS[index % ICONS.length];

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
            whileHover={{ y: -6, scale: 1.015 }}
            className="group bg-white/85 dark:bg-slate-900/75 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-white/10 p-6 flex flex-col justify-between shadow-xs hover:shadow-xl hover:border-[#8DB600]/70 dark:hover:border-[#a3d100]/50 transition-colors duration-300 relative overflow-hidden"
        >
            {/* Top Gradient Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#8DB600] via-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-50 to-cyan-50 dark:from-lime-950/70 dark:to-cyan-950/50 text-[#659000] dark:text-[#a3d100] flex items-center justify-center border border-lime-200/80 dark:border-white/15 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                        <Icon className="w-6 h-6 stroke-[2]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-lime-100/90 dark:bg-lime-950/70 text-[#5f7d00] dark:text-[#a3d100] border border-lime-300/60 dark:border-lime-700/40">
                        {item.badge}
                    </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#659000] dark:group-hover:text-[#a3d100] transition-colors">
                    {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {item.description}
                </p>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                        Starting at
                    </span>
                    <span className="text-sm sm:text-base font-black text-[#659000] dark:text-[#a3d100]">
                        {item.price}
                    </span>
                </div>
                <a
                    href="#contact"
                    className="p-2.5 rounded-xl bg-lime-50 dark:bg-white/10 text-[#659000] dark:text-[#a3d100] hover:bg-[#8DB600] hover:text-white dark:hover:bg-[#8DB600] dark:hover:text-white transition-all active:scale-95"
                    title="Inquire"
                >
                    <ArrowRight className="w-4 h-4" />
                </a>
            </div>
        </motion.div>
    );
});
ServiceCard.displayName = 'ServiceCard';

export default function Services({ settings }) {
    const servicesList =
        settings?.services_data && Array.isArray(settings.services_data) && settings.services_data.length > 0
            ? settings.services_data
            : DEFAULT_SERVICES;

    const sectionTitle = settings?.services_title || 'Our Refill & Supply Services';
    const sectionSubtitle =
        settings?.services_subtitle ||
        'Whether visiting our physical refilling bay or requesting high-volume delivery for your business, we keep you effortlessly supplied.';

    return (
        <section id="services" className="py-12 lg:py-16 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                    <div className="inline-flex items-center justify-center rounded-full px-3.5 py-1.5 mb-3 bg-white/85 dark:bg-slate-900/80 border border-lime-300/80 dark:border-white/15 backdrop-blur-md">
                        <span className="text-xs font-bold tracking-wider uppercase text-[#5f7d00] dark:text-[#a3d100]">
                            Available Products &amp; Plans
                        </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        {sectionTitle.includes('Services') ? (
                            <>
                                {sectionTitle.replace('Services', '').trim()}{' '}
                                <span className="bg-gradient-to-r from-[#659000] via-emerald-500 to-cyan-500 dark:from-[#a3d100] dark:to-cyan-400 bg-clip-text text-transparent">
                                    Services
                                </span>
                            </>
                        ) : (
                            <span className="bg-gradient-to-r from-[#659000] to-cyan-500 bg-clip-text text-transparent">
                                {sectionTitle}
                            </span>
                        )}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium mt-3">
                        {sectionSubtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {servicesList.map((service, index) => (
                        <ServiceCard key={service.id || index} item={service} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}