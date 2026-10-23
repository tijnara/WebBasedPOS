// src/components/landing/Contact.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Phone, Clock, Send } from 'lucide-react';
import ContactForm from './ContactForm';

export default function Contact({ settings }) {
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
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-lime-50 border border-lime-200 text-[#5f7d00] text-xs font-bold uppercase tracking-wider mb-4">
                        <MessageSquare className="w-3.5 h-3.5 text-[#8DB600]" />
                        We're Here to Help
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Get in Touch with{' '}
                        <span className="bg-gradient-to-r from-[#8DB600] to-[#6abf45] bg-clip-text text-transparent">
                            {settings?.business_name || 'Seaside'}
                        </span>
                    </h2>
                    <p className="text-slate-600 text-sm sm:text-base font-medium mt-3">
                        Have questions regarding commercial jug supply, corporate accounts, or residential delivery? Send us a message below.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-5 space-y-4">
                        <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
                            <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                                Direct Inquiries & Orders
                            </h3>

                            <div className="space-y-4 text-xs sm:text-sm">
                                <a
                                    href={`tel:${phone.replace(/\s+/g, '')}`}
                                    className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-lime-50/50 transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-lime-50 text-[#8DB600] flex items-center justify-center shrink-0 border border-lime-200 group-hover:bg-[#8DB600] group-hover:text-white transition-colors">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">Call or Text</span>
                                        <span className="font-bold text-slate-900 text-sm sm:text-base">{phone}</span>
                                    </div>
                                </a>

                                <a
                                    href={messengerLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-blue-50/50 transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">Facebook Messenger</span>
                                        <span className="font-bold text-slate-900 text-sm sm:text-base">{settings?.business_name || 'Seaside'} Water Refilling</span>
                                    </div>
                                </a>

                                <div className="flex items-start gap-3.5 p-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">Station Schedule</span>
                                        <span className="font-semibold text-slate-800 text-xs sm:text-sm">{businessHours}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#8DB600] to-[#6abf45] text-white shadow-sm flex items-center gap-3">
                            <Send className="w-6 h-6 shrink-0 opacity-80" />
                            <p className="text-xs font-semibold leading-relaxed">
                                Deliveries sent via form or messenger during operating hours are dispatched promptly with our multicab team.
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
                        <ContactForm settings={settings} />
                    </div>
                </div>
            </div>
        </motion.section>
    );
}