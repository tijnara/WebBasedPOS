// src/components/landing/Location.jsx
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import AnimatedLandingIcon from './AnimatedLandingIcon';

const DEFAULT_EMBED_URL =
    'https://maps.google.com/maps?q=16.0432862,120.1322205+(SEASIDE+Water+Refilling+Station)&z=16&output=embed';

const DEFAULT_DELIVERY_AREAS = ['Laois', 'Poblacion', 'Uyong', 'Dulig', 'Bolo', 'San Jose'];

function resolveSafeMapEmbedUrl(rawValue, fallbackAddress, businessName) {
    const label = businessName || 'Water Refilling Station';

    if (!rawValue || typeof rawValue !== 'string') {
        if (fallbackAddress) {
            const query = encodeURIComponent(`${label}, ${fallbackAddress}`);
            return `https://maps.google.com/maps?q=${query}&z=16&output=embed`;
        }
        return DEFAULT_EMBED_URL;
    }

    let candidate = rawValue.trim();

    // 1. If full <iframe src="..."> HTML was pasted in Page Settings, extract the src URL
    const iframeMatch = candidate.match(/src=["']([^"']+)["']/i);
    if (iframeMatch?.[1]) {
        candidate = iframeMatch[1].trim();
    }

    // 2. Allow clean embed URLs directly
    if (
        candidate.startsWith('https://www.google.com/maps/embed?') ||
        candidate.includes('output=embed')
    ) {
        return candidate;
    }

    // 3. Extract coordinates if a standard Google Maps share/place URL was saved
    const coordMatch = candidate.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
        const [, lat, lng] = coordMatch;
        const encodedLabel = encodeURIComponent(label);
        return `https://maps.google.com/maps?q=${lat},${lng}+(${encodedLabel})&z=16&output=embed`;
    }

    const query = encodeURIComponent(
        `${label}, ${fallbackAddress || 'Laois, Labrador, Pangasinan'}`
    );
    return `https://maps.google.com/maps?q=${query}&z=16&output=embed`;
}

export default function Location({ settings, store }) {
    const darkMode = useStore((s) => s.darkMode);
    const [hoverRow, setHoverRow] = useState(-1);
    const [rowTick, setRowTick] = useState(0);

    const businessName = store?.name || settings?.business_name || 'Seaside';
    const physicalAddress =
        store?.address || settings?.physical_address || 'Barangay Laois, Labrador, 2402 Pangasinan';
    const businessHours =
        store?.branding?.operatingHours ||
        settings?.business_hours ||
        'Mon - Sat: 8:00 AM - 5:00 PM';
    const phone =
        store?.contact_number || settings?.contact_number || '+63 960 219 6388';
    const locationDescription =
        store?.branding?.locationDescription ||
        settings?.location_description ||
        `Conveniently located at ${physicalAddress}. Drive in for walk-in refills or schedule doorstep delivery.`;

    const deliveryAreas = useMemo(() => {
        const raw = store?.branding?.deliveryAreas || settings?.delivery_areas;
        if (Array.isArray(raw) && raw.length > 0) return raw;
        if (typeof raw === 'string' && raw.trim()) {
            return raw.split(',').map((s) => s.trim()).filter(Boolean);
        }
        return DEFAULT_DELIVERY_AREAS;
    }, [store?.branding?.deliveryAreas, settings?.delivery_areas]);

    const googleMapsEmbedUrl = useMemo(
        () => resolveSafeMapEmbedUrl(settings?.location_embed, physicalAddress, businessName),
        [settings?.location_embed, physicalAddress, businessName]
    );

    const directionsUrl = `https://maps.google.com/?q=${encodeURIComponent(
        `${businessName} ${physicalAddress}`
    )}`;

    const iconStroke = darkMode ? '#a3d100' : '#659000';

    return (
        <motion.section
            id="location"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="py-12 lg:py-16 relative"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-lime-50 dark:bg-slate-900/80 border border-lime-200 dark:border-white/15 text-[#5f7d00] dark:text-[#a3d100] text-xs font-bold uppercase tracking-wider mb-4">
                        <AnimatedLandingIcon name="explore" size={16} strokeColor={iconStroke} loop />
                        Station Location &amp; Delivery
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        Visit Our{' '}
                        <span className="bg-gradient-to-r from-[#8DB600] to-[#6abf45] bg-clip-text text-transparent">
                            Refilling Bay
                        </span>
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium mt-3">
                        {locationDescription}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 bg-white/85 dark:bg-slate-900/75 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-sm space-y-6">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                    {businessName} Main Bay
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    DOH Inspected &amp; Sanitary Certified Station
                                </p>
                            </div>

                            <div className="space-y-4 text-xs sm:text-sm">
                                <div
                                    onMouseEnter={() => {
                                        setHoverRow(0);
                                        setRowTick((t) => t + 1);
                                    }}
                                    onMouseLeave={() => setHoverRow(-1)}
                                    className="flex items-start gap-3.5"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-lime-50 dark:bg-lime-950/60 text-[#8DB600] flex items-center justify-center shrink-0 border border-lime-200 dark:border-lime-800/50">
                                        <AnimatedLandingIcon
                                            name="explore"
                                            size={18}
                                            strokeColor={iconStroke}
                                            triggerKey={hoverRow === 0 ? rowTick : 0}
                                        />
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-900 dark:text-white block">Address</span>
                                        <span className="text-slate-600 dark:text-slate-300">{physicalAddress}</span>
                                    </div>
                                </div>

                                <div
                                    onMouseEnter={() => {
                                        setHoverRow(1);
                                        setRowTick((t) => t + 1);
                                    }}
                                    onMouseLeave={() => setHoverRow(-1)}
                                    className="flex items-start gap-3.5"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-lime-50 dark:bg-lime-950/60 text-[#8DB600] flex items-center justify-center shrink-0 border border-lime-200 dark:border-lime-800/50">
                                        <AnimatedLandingIcon
                                            name="clock"
                                            size={18}
                                            strokeColor={iconStroke}
                                            triggerKey={hoverRow === 1 ? rowTick : 0}
                                        />
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-900 dark:text-white block">Operating Hours</span>
                                        <span className="text-slate-600 dark:text-slate-300">{businessHours}</span>
                                    </div>
                                </div>

                                <div
                                    onMouseEnter={() => {
                                        setHoverRow(2);
                                        setRowTick((t) => t + 1);
                                    }}
                                    onMouseLeave={() => setHoverRow(-1)}
                                    className="flex items-start gap-3.5"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-lime-50 dark:bg-lime-950/60 text-[#8DB600] flex items-center justify-center shrink-0 border border-lime-200 dark:border-lime-800/50">
                                        <AnimatedLandingIcon
                                            name="phone"
                                            size={18}
                                            strokeColor={iconStroke}
                                            triggerKey={hoverRow === 2 ? rowTick : 0}
                                        />
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-900 dark:text-white block">
                                            Phone &amp; Delivery Line
                                        </span>
                                        <span className="text-slate-600 dark:text-slate-300">{phone}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-white/10">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                                    Doorstep Delivery Coverage
                                </span>
                                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                    {deliveryAreas.map((brgy) => (
                                        <span
                                            key={brgy}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10"
                                        >
                                            <AnimatedLandingIcon
                                                name="checkmark"
                                                size={14}
                                                strokeColor={iconStroke}
                                            />
                                            {brgy}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold text-sm shadow-sm transition-all duration-200 active:scale-95 group"
                        >
                            <AnimatedLandingIcon name="explore" size={18} strokeColor="#ffffff" />
                            <span>Get Directions in Google Maps</span>
                        </a>
                    </div>

                    <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-slate-200/90 dark:border-white/10 shadow-md bg-white dark:bg-slate-900 min-h-[380px] lg:min-h-full">
                        <iframe
                            src={googleMapsEmbedUrl}
                            width="100%"
                            height="100%"
                            className="w-full h-full min-h-[380px] border-0"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title={`${businessName} Location`}
                        />
                    </div>
                </div>
            </div>
        </motion.section>
    );
}