import React, { useState } from 'react';
import { Phone, Mail, ChevronDown, Twitter, Linkedin, Facebook, Droplet, Activity, Leaf, ShieldCheck, Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../ui';

const SeasideWaterLanding = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div
            className="relative min-h-screen w-full font-sans text-slate-800"
            style={{
                backgroundImage: "url('/seaside_bg2.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Main Content Wrapper */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* STICKY HEADER */}
                <header className="px-6 py-2 relative z-50 sticky top-0 border-b border-green-900/10 shadow-sm w-full" style={{ backgroundColor: 'transparent' }}>
                    <div className="container mx-auto flex justify-between items-center">
                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-xl shadow-sm border border-green-100" style={{ backgroundColor: '#FFFFFF99' }}>
                                <Image src="/seasidelogo_.png" alt="SEASIDE Logo" width={100} height={100} className="object-contain" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-extrabold tracking-wider leading-none mb-1 text-green-950">SEASIDE</span>
                                <span className="text-[8px] tracking-[0.25em] font-bold uppercase leading-tight text-green-800">Water Refilling Station</span>
                            </div>
                        </div>
                        {/* Top Bar & Main Navigation */}
                        <div className="flex flex-col items-end">
                            {/* Top Bar */}
                            <div className="hidden md:flex justify-end items-center text-[10px] sm:text-xs mb-4">
                                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-2">
                                    <Link href="/login" passHref>
                                        <Button as="a" className="bg-lime-500 hover:bg-green-500 active:bg-violet-500 text-black px-5 py-1.5 rounded-full transition-colors font-bold text-[11px] shadow-sm ml-2">
                                            Staff Login
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Main Navigation */}
                            <nav className="hidden md:flex flex-wrap items-center justify-center lg:justify-end gap-x-1 gap-y-2 text-[12px] font-bold tracking-wide">
                                <Link href="/" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">
                                    HOME
                                </Link>
                                <Link href="#purification" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">
                                    PURIFICATION PROCESS
                                </Link>
                                <Link href="#services" className="group flex items-center px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">
                                    SERVICES
                                    <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-70 transition-transform duration-300 group-hover:rotate-180"/>
                                </Link>
                                <Link href="#pricing" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">
                                    PRICING
                                </Link>
                                <Link href="#contact" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">
                                    CONTACT US
                                </Link>
                            </nav>

                            {/* Hamburger Menu Button */}
                            <div className="md:hidden">
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className="md:hidden mt-4">
                            <nav className="flex flex-col items-center gap-y-4 text-[12px] font-bold tracking-wide">
                                <Link href="/" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">
                                    HOME
                                </Link>
                                <Link href="#purification" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">
                                    PURIFICATION PROCESS
                                </Link>
                                <Link href="#services" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">
                                    SERVICES
                                </Link>
                                <Link href="#pricing" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">
                                    PRICING
                                </Link>
                                <Link href="#contact" className="px-4 py-2 rounded-full text-green-900 hover:bg-green-100 transition-all duration-300">
                                    CONTACT US
                                </Link>
                                <Link href="/login" passHref>
                                    <Button as="a" className="bg-lime-500 hover:bg-green-500 active:bg-violet-500 text-black px-5 py-1.5 rounded-full transition-colors font-bold text-[11px] shadow-sm">
                                        Staff Login
                                    </Button>
                                </Link>
                            </nav>
                        </div>
                    )}
                </header>
                <div className="container mx-auto flex flex-col flex-grow relative" style={{ backgroundColor: '#FFFFFF99' }}>
                    {/* HERO SECTION */}
                    <div className="relative pt-6 pb-24 lg:pb-32 overflow-hidden flex-grow">
                        {/* Hero Content */}
                        <div className="px-6 mt-16 md:mt-24 relative z-20">
                            <div className="max-w-2xl">
                                <h2 className="text-4xl md:text-5xl lg:text-[3.25rem] font-light leading-tight mb-8 text-slate-900">
                                    Refresh Your Life with<br/> <span className="font-extrabold text-green-700">Crystal Clear and Purified Water</span>
                                </h2>

                                <ul className="mb-10 space-y-4 text-sm md:text-base font-medium text-slate-800 p-4 rounded-xl border shadow-sm inline-block" style={{ backgroundColor: '#FFFFFF99' }}>
                                    <li className="flex items-center">
                                        <ShieldCheck className="w-5 h-5 text-green-600 mr-3 shrink-0"/>
                                        Advanced 21-stage reverse osmosis filtration system
                                    </li>
                                    <li className="flex items-center">
                                        <Activity className="w-5 h-5 text-green-600 mr-3 shrink-0"/>
                                        Perfectly pH balanced and mineralized for optimal health
                                    </li>
                                    <li className="flex items-center">
                                        <Leaf className="w-5 h-5 text-green-600 mr-3 shrink-0"/>
                                        Eco-friendly station—bring your jugs and save the planet
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* BENEFITS SECTION */}
                    <div className="bg-transparent relative z-20 border-t">
                        <div className="px-6 py-20 pb-32 max-w-6xl mx-auto">
                            <div className="text-center mb-16">
                                <span className="inline-block py-1 px-4 rounded-full bg-lime-100 mb-3 border">
                                    <h2 className="text-green-700 text-sm font-bold tracking-widest uppercase m-0">Why Choose Seaside?</h2>
                                </span>
                                <p className="text-2xl md:text-3xl font-medium text-slate-800 drop-shadow-sm">Purity you can taste, quality you can trust.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 text-center">

                                {/* Feature 1: Ultimate Purity */}
                                <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF99' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transform transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50">
                                        <Droplet className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Ultimate Purity</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed text-center font-medium">
                                        Our state-of-the-art filtration process removes 99.9% of impurities, heavy metals, and chemicals, giving you water that tastes exactly as nature intended.
                                    </p>
                                </div>

                                {/* Feature 2: Health & Minerals */}
                                <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF99' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transform transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50">
                                        <Activity className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Health & Wellness</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed text-center font-medium">
                                        We go beyond purification. Our system reintroduces essential electrolytes and balances the pH level to keep you perfectly hydrated and energized.
                                    </p>
                                </div>

                                {/* Feature 3: Eco-Friendly */}
                                <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300" style={{ backgroundColor: '#FFFFFF99' }}>
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transform transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50">
                                        <Leaf className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Eco-Friendly Refills</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed text-center font-medium">
                                        Bring your own containers or purchase our reusable jugs. Every refill helps reduce single-use plastic pollution and protects our environment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <footer className="bg-green-950 text-green-100 text-sm relative z-20 border-t border-green-900 mt-auto">
                        <div className="px-6 py-12">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <Leaf className="w-5 h-5 text-lime-400"/>
                                    <p>&copy; {new Date().getFullYear()} SEASIDE Purified Water. All rights reserved.</p>
                                </div>
                                <div className="flex space-x-5">
                                    <a href="#" className="hover:text-lime-300 transition-colors"><Twitter className="w-5 h-5" /></a>
                                    <a href="#" className="hover:text-lime-300 transition-colors"><Linkedin className="w-5 h-5" /></a>
                                    <a href="#" className="hover:text-lime-300 transition-colors"><Facebook className="w-5 h-5" /></a>
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default SeasideWaterLanding;