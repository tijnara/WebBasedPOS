// src/components/landing/Footer.jsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShieldCheck, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 pt-14 pb-8 border-t border-slate-800 relative z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* 4-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">

                    {/* Brand Profile */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs border border-lime-400/40">
                                <Image
                                    src="/seaside.png"
                                    alt="Seaside Logo"
                                    width={36}
                                    height={36}
                                    className="object-contain"
                                />
                            </div>
                            <div>
                                <span className="text-lg font-black text-white block leading-tight">Seaside</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#8DB600] block">
                                    Water Refilling Station
                                </span>
                            </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
                            Providing Labrador, Pangasinan and nearby communities with commercial 21-stage reverse osmosis drinking water, container sterilization, and doorstep delivery.
                        </p>

                        <div className="flex items-center gap-2 text-xs font-semibold text-[#8DB600] pt-1">
                            <ShieldCheck className="w-4 h-4" />
                            <span>DOH Sanitary Standard Certified</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="lg:col-span-2 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Navigation</h4>
                        <ul className="space-y-2 text-xs text-slate-400">
                            <li><a href="#services" className="hover:text-[#8DB600] transition-colors">Refill Services</a></li>
                            <li><a href="#why-choose" className="hover:text-[#8DB600] transition-colors">Why Choose Us</a></li>
                            <li><a href="#process" className="hover:text-[#8DB600] transition-colors">21-Stage Process</a></li>
                            <li><a href="#location" className="hover:text-[#8DB600] transition-colors">Station Location</a></li>
                            <li><a href="#contact" className="hover:text-[#8DB600] transition-colors">Inquire & Order</a></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="lg:col-span-3 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Health & Hydration</h4>
                        <ul className="space-y-2 text-xs text-slate-400">
                            <li>
                                <Link href="/resources/benefits-of-21-stage-purified-water" className="hover:text-[#8DB600] transition-colors">
                                    Science of 21-Stage RO
                                </Link>
                            </li>
                            <li>
                                <Link href="/resources/staying-hydrated-in-labrador-summer-tips" className="hover:text-[#8DB600] transition-colors">
                                    Hydration in Labrador Climate
                                </Link>
                            </li>
                            <li>
                                <Link href="/resources/maintaining-your-water-containers-at-home" className="hover:text-[#8DB600] transition-colors">
                                    Water Jug Cleaning Guide
                                </Link>
                            </li>
                            <li>
                                <Link href="/" className="hover:text-[#8DB600] transition-colors font-bold text-slate-200">
                                    Staff POS Login
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Station Direct Contacts */}
                    <div className="lg:col-span-3 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Labrador Station</h4>
                        <div className="space-y-2.5 text-xs text-slate-400">
                            <div className="flex items-start gap-2.5">
                                <MapPin className="w-4 h-4 text-[#8DB600] shrink-0 mt-0.5" />
                                <span>Laois, Labrador, Pangasinan, Philippines</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Phone className="w-4 h-4 text-[#8DB600] shrink-0" />
                                <span>+63 960 219 6388</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Mail className="w-4 h-4 text-[#8DB600] shrink-0" />
                                <span>seasidewrs@gmail.com</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Subfooter */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <p>© {new Date().getFullYear()} Seaside Water Refilling Station. All rights reserved.</p>

                    <a
                        href="https://undergocutlery.com/ngz7b0mms?key=c1cb95a3297c5e2d634e2cbbecde0044"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-[#8DB600] transition-colors px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60"
                    >
                        <Heart className="w-3.5 h-3.5 text-[#8DB600] fill-[#8DB600]" />
                        <span>Support Our Local Station</span>
                    </a>
                </div>

            </div>
        </footer>
    );
}