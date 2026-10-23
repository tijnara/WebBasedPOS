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
        description: 'Fast, sanitary refilling right in front of you. Bring your 5-gallon slim or round containers for full high-pressure interior wash and seal.'
    },
    {
        id: 'delivery',
        badge: 'Delivery',
        title: 'Door-to-Door Delivery',
        price: '₱25 - ₱30',
        description: 'Stay relaxed while we deliver freshly filtered jugs directly to your doorstep anywhere in Labrador and nearby barangays.'
    },
    {
        id: 'bottles',
        badge: 'Grab & Go',
        title: 'Bottled Water Pack',
        price: 'From ₱6.00',
        description: 'Convenient 350ml and 500ml sealed PET bottles. Ideal for family gatherings, school snacks, road trips, and store resale.'
    },
    {
        id: 'ice',
        badge: 'Food Safe',
        title: 'Purified Tube Ice',
        price: 'From ₱20.00',
        description: 'Crystal-clear, food-grade ice cubes manufactured solely from our 21-stage RO filtered water. Melts slow and stays pure.'
    }
];

const ICONS = [Droplet, Truck, Package, Snowflake];

const ServiceCard = memo(({ item, index }) => {
    const Icon = ICONS[index % ICONS.length];

    return (
        <div className="group bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between shadow-xs hover:shadow-xl hover:border-lime-400 transition-all duration-300 relative overflow-hidden">
            {/* Apple Green Top Accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#8DB600] via-[#6abf45] to-[#4e9e2d] opacity-0 group-hover:opacity-100 transition-opacity" />

            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-lime-50 text-[#8DB600] flex items-center justify-center border border-lime-200 group-hover:scale-105 transition-transform">
                        <Icon className="w-6 h-6 stroke-[2]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime-100 text-[#5f7d00]">
                        {item.badge}
                    </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 group-hover:text-[#8DB600] transition-colors">
                    {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                    {item.description}
                </p>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Starting at</span>
                    <span className="text-sm sm:text-base font-black text-[#8DB600]">{item.price}</span>
                </div>
                <a
                    href="#contact"
                    className="p-2 rounded-lg bg-lime-50 text-[#8DB600] hover:bg-[#8DB600] hover:text-white transition-colors"
                    title="Inquire"
                >
                    <ArrowRight className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
});
ServiceCard.displayName = 'ServiceCard';

export default function Services({ settings }) {
    const servicesList = (settings?.services_data && Array.isArray(settings.services_data) && settings.services_data.length > 0)
        ? settings.services_data
        : DEFAULT_SERVICES;

    const sectionTitle = settings?.services_title || 'Our Refill & Supply Services';
    const sectionSubtitle = settings?.services_subtitle || 'Whether visiting our physical refilling bay or requesting high-volume delivery for your business, we keep you effortlessly supplied.';

    return (
        <motion.section
            id="services"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="py-12 lg:py-16 relative"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                    <div className="inline-flex items-center justify-center rounded-full px-3.5 py-1 mb-3 bg-lime-50 border border-lime-200">
                        <span className="text-xs font-bold tracking-wider uppercase text-[#5f7d00]">
                            Available Products & Plans
                        </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        {sectionTitle.includes('Services') ? (
                            <>
                                {sectionTitle.replace('Services', '').trim()}{' '}
                                <span className="bg-gradient-to-r from-[#8DB600] to-[#6abf45] bg-clip-text text-transparent">
                                    Services
                                </span>
                            </>
                        ) : (
                            <span className="bg-gradient-to-r from-[#8DB600] to-[#6abf45] bg-clip-text text-transparent">
                                {sectionTitle}
                            </span>
                        )}
                    </h2>
                    <p className="text-slate-600 text-sm sm:text-base font-medium mt-3">
                        {sectionSubtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {servicesList.map((service, index) => (
                        <ServiceCard key={service.id || index} item={service} index={index} />
                    ))}
                </div>
            </div>
        </motion.section>
    );
}