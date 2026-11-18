// src/components/landing/Contact.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ContactForm from './ContactForm';
import { useStore } from '../../store/useStore';
import AnimatedLandingIcon from './AnimatedLandingIcon';

export default function Contact({ settings }) {
    const darkMode = useStore((s) => s.darkMode);
    const [hoverRow, setHoverRow] = useState(-1);
    const [rowTick, setRowTick] = useState(0);

    const businessHours = settings?.business_hours || 'Monday - Saturday: 8:00 AM - 5:00 PM';
    const phone = settings?.contact_number || '+63 960 219 6388';
    const messengerLink = settings?.messenger_link || 'https://m.me/61587059323111';

    return (
        <motion.section
            id="contact"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="py-12 lg:py-16 relative"
            aria-labelledby="contact-heading"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-lime-50 dark:bg-slate-900/80 border border-lime-200 dark:border-white/15 text-[#5f7d00] dark:text-[#a3d100] text-xs font-bold uppercase tracking-wider mb-4">
                        <AnimatedLandingIcon
                            name="mail"
                            size={16}
                            strokeColor={darkMode ? '#a3d100' : '#8DB600'}
                            loop
                        />
                        We&apos;re Here to Help
                    </div>
                    <h2
                        id="contact-heading"
                        className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight"
                    >
                        Get in Touch with{' '}
                        <span className="bg-gradient-to-r from-[#8DB600] to-[#6abf45] bg-clip-text text-transparent">
                            {settings?.business_name || 'Seaside'}
                        </span>
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium mt-3">
                        Have questions regarding commercial jug supply, corporate accounts, or residential delivery? Send us a message below.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-5 space-y-4">
                        <div className="p-6 bg-white/85 dark:bg-slate-900/75 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-sm space-y-5">
                            <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/10 pb-3">
                                Direct Inquiries &amp; Orders
                            </h3>

                            <div className="space-y-4 text-xs sm:text-sm">
                                <a
                                    href={`tel:${phone.replace(/\s+/g, '')}`}
                                    onMouseEnter={() => {
                                        setHoverRow(0);
                                        setRowTick((t) => t + 1);
                                    }}
                                    onMouseLeave={() => setHoverRow(-1)}
                                    className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-lime-50/60 dark:hover:bg-white/5 transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-lime-50 dark:bg-lime-950/60 text-[#8DB600] flex items-center justify-center shrink-0 border border-lime-200 dark:border-lime-800/50 group-hover:bg-[#8DB600] group-hover:text-white transition-colors">
                                        <AnimatedLandingIcon
                                            name="phone"
                                            size={20}
                                            strokeColor="currentColor"
                                            triggerKey={hoverRow === 0 ? rowTick : 0}
                                        />
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                                            Call or Text
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                                            {phone}
                                        </span>
                                    </div>
                                </a>

                                <a
                                    href={messengerLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onMouseEnter={() => {
                                        setHoverRow(1);
                                        setRowTick((t) => t + 1);
                                    }}
                                    onMouseLeave={() => setHoverRow(-1)}
                                    className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-blue-50/60 dark:hover:bg-white/5 transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/50 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <AnimatedLandingIcon
                                            name="messenger"
                                            size={20}
                                            strokeColor="currentColor"
                                            triggerKey={hoverRow === 1 ? rowTick : 0}
                                        />
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                                            Facebook Messenger
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                                            {settings?.business_name || 'Seaside'} Water Refilling
                                        </span>
                                    </div>
                                </a>

                                <div
                                    onMouseEnter={() => {
                                        setHoverRow(2);
                                        setRowTick((t) => t + 1);
                                    }}
                                    onMouseLeave={() => setHoverRow(-1)}
                                    className="flex items-start gap-3.5 p-3"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                                        <AnimatedLandingIcon
                                            name="clock"
                                            size={20}
                                            strokeColor="currentColor"
                                            triggerKey={hoverRow === 2 ? rowTick : 0}
                                        />
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                                            Station Schedule
                                        </span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                                            {businessHours}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#8DB600] to-[#6abf45] text-white shadow-sm flex items-center gap-3">
                            <AnimatedLandingIcon name="truck" size={26} strokeColor="#ffffff" loop />
                            <p className="text-xs font-semibold leading-relaxed">
                                Deliveries sent via form or messenger during operating hours are dispatched promptly with our multicab team.
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-7 bg-white/85 dark:bg-slate-900/75 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-sm p-6 sm:p-8">
                        <ContactForm settings={settings} />
                    </div>
                </div>
            </div>
        </motion.section>
    );
}