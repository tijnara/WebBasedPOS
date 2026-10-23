// src/components/landing/Location.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Clock, Phone, CheckCircle2 } from 'lucide-react';

export default function Location({ settings }) {
    const googleMapsEmbedUrl = settings?.location_embed || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.3333333333335!2d120.1322205!3d16.0432862!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3393e1d08454d96f%3A0xfd7e1df20c90037d!2sSEASIDE%20Water%20Refilling%20Station!5e0!3m2!1sen!2sph!4v1630000000000!5m2!1sen!2sph";
    const physicalAddress = settings?.physical_address || 'Barangay Laois, Labrador, 2402 Pangasinan';
    const businessHours = settings?.business_hours || 'Mon - Sat: 8:00 AM - 5:00 PM';

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
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-lime-50 border border-lime-200 text-[#5f7d00] text-xs font-bold uppercase tracking-wider mb-4">
                        <MapPin className="w-3.5 h-3.5 text-[#8DB600]" />
                        Station Location & Delivery
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Visit Our{' '}
                        <span className="bg-gradient-to-r from-[#8DB600] to-[#6abf45] bg-clip-text text-transparent">
                            Refilling Station
                        </span>
                    </h2>
                    <p className="text-slate-600 text-sm sm:text-base font-medium mt-3">
                        Conveniently located along the provincial highway in Labrador, Pangasinan. Drive in for walk-in refills or schedule doorstep delivery.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    {/* Left Details Card */}
                    <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Seaside Labrador Main Bay</h3>
                                <p className="text-xs text-slate-500 mt-1">DOH Inspected & Sanitary Certified Station</p>
                            </div>

                            <div className="space-y-4 text-xs sm:text-sm">
                                <div className="flex items-start gap-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-lime-50 text-[#8DB600] flex items-center justify-center shrink-0 border border-lime-200">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-900 block">Address</span>
                                        <span className="text-slate-600">{physicalAddress}</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-lime-50 text-[#8DB600] flex items-center justify-center shrink-0 border border-lime-200">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-900 block">Operating Hours</span>
                                        <span className="text-slate-600">{businessHours}</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-lime-50 text-[#8DB600] flex items-center justify-center shrink-0 border border-lime-200">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-900 block">Phone & Delivery Line</span>
                                        <span className="text-slate-600">+63 960 219 6388</span>
                                    </div>
                                </div>
                            </div>

                            {/* Service Coverage Tags */}
                            <div className="pt-4 border-t border-slate-100">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                                    Doorstep Delivery Coverage
                                </span>
                                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                                    {['Laois', 'Poblacion', 'Uyong', 'Dulig', 'Bolo', 'San Jose'].map(brgy => (
                                        <span key={brgy} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                                            <CheckCircle2 className="w-3 h-3 text-[#8DB600]" /> {brgy}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Open in Maps Button */}
                        <a
                            href="https://maps.google.com/?q=SEASIDE+Water+Refilling+Station+Laois+Labrador+Pangasinan"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold text-sm shadow-sm transition-all duration-200 active:scale-95"
                        >
                            <Navigation className="w-4 h-4" />
                            <span>Get Directions in Google Maps</span>
                        </a>
                    </div>

                    {/* Right Interactive Map Frame */}
                    <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-white min-h-[380px] lg:min-h-full">
                        <iframe
                            src={googleMapsEmbedUrl}
                            width="100%"
                            height="100%"
                            className="w-full h-full min-h-[380px] border-0"
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Seaside Water Refilling Station Location"
                        />
                    </div>
                </div>
            </div>
        </motion.section>
    );
}