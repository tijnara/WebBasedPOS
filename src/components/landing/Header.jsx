import React, { useState } from 'react';
import Link from 'next/link';
import OptimizedImage from './OptimizedImage';
import { useStore } from '../../store/useStore';
import { useSettings } from '../../hooks/useSettings';
import { Button } from '../ui';
import { Menu, X } from 'lucide-react';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const user = useStore(state => state.user);
    const { data: settings } = useSettings();

    return (
        <>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-black">
                Skip to main content
            </a>
            <header className="px-6 py-2 relative z-50 sticky top-0 backdrop-blur-sm border-b border-white/20 shadow-sm w-full bg-white/80">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-xl shadow-sm border border-green-100 bg-white/80">
                            <OptimizedImage
                                src={settings?.logo_url || "/seasidelogo_.png"}
                                alt="SEASIDE Logo"
                                width={100}
                                height={100}
                                className="object-contain w-[100px] h-[100px]"
                                priority
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-7xl font-extrabold tracking-wider leading-none mb-1 text-green-950">
                                {settings?.business_name ? settings.business_name.split(' ')[0] : 'SEASIDE'}
                            </span>
                            <span className="text-[8px] tracking-[0.25em] font-bold uppercase leading-tight text-green-800">
                                {settings?.business_name ? settings.business_name.substring(settings.business_name.indexOf(' ') + 1) : 'Water Refilling Station'}
                            </span>
                            <span className="text-[9px] font-semibold tracking-wide text-green-700 mt-0.5">Proudly hydrating Labrador, Pangasinan</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="hidden md:flex justify-end items-center text-[10px] sm:text-xs mb-4">
                            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-2">
                                {user ? (
                                    <a href="/pos">
                                        <Button as="a" className="bg-lime-500 hover:bg-green-500 active:bg-violet-500 text-black px-5 py-1.5 rounded-full transition-colors font-bold text-[11px] shadow-sm ml-2">
                                            Continue to Office
                                        </Button>
                                    </a>
                                ) : (
                                    <a href="/login">
                                        <Button as="a" className="bg-lime-500 hover:bg-green-500 active:bg-violet-500 text-black px-5 py-1.5 rounded-full transition-colors font-bold text-[11px] shadow-sm ml-2">
                                            Staff Login
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </div>
                        <nav className="hidden md:flex flex-wrap items-center justify-center lg:justify-end gap-x-1 gap-y-2 text-[12px] font-bold tracking-wide">
                            <Link href="/" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">HOME</Link>
                            <Link href="#services" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">SERVICES</Link>
                            <Link href="#process" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">PROCESS</Link>
                            <Link href="#gallery" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">GALLERY</Link>
                            <Link href="#location" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">LOCATION</Link>
                            <Link href="#contact" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">CONTACT</Link>
                            <Link href="/resources" className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 active:text-violet-500 transition-all duration-300">RESOURCES</Link>
                        </nav>
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                                aria-expanded={isMenuOpen}
                            >
                                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
                {isMenuOpen && (
                    <div className="md:hidden mt-4">
                        <nav className="flex flex-col items-center gap-y-4 text-[12px] font-bold tracking-wide">
                            <Link href="/" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">HOME</Link>
                            <Link href="#services" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">SERVICES</Link>
                            <Link href="#process" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">PROCESS</Link>
                            <Link href="#gallery" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">GALLERY</Link>
                            <Link href="#location" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">LOCATION</Link>
                            <Link href="#contact" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">CONTACT</Link>
                            <Link href="/resources" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-full text-green-700 hover:bg-green-100 transition-all duration-300">RESOURCES</Link>
                            {user ? (
                                <a href="/pos">
                                    <Button as="a" onClick={() => setIsMenuOpen(false)} className="bg-lime-500 hover:bg-green-500 active:bg-violet-500 text-black px-5 py-1.5 rounded-full transition-colors font-bold text-[11px] shadow-sm mt-2">
                                        Continue to Office
                                    </Button>
                                </a>
                            ) : (
                                <a href="/login">
                                    <Button as="a" onClick={() => setIsMenuOpen(false)} className="bg-lime-500 hover:bg-green-500 active:bg-violet-500 text-black px-5 py-1.5 rounded-full transition-colors font-bold text-[11px] shadow-sm mt-2">
                                        Staff Login
                                    </Button>
                                </a>
                            )}
                        </nav>
                    </div>
                )}
            </header>
        </>
    );
};

export default Header;
