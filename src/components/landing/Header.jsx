import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const Header = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'HOME', href: '/' },
        { name: 'SERVICES', href: '/#services' },
        { name: 'PROCESS', href: '/#process' },
        { name: 'GALLERY', href: '/#gallery' },
        { name: 'LOCATION', href: '/#location' },
        { name: 'CONTACT', href: '/#contact' },
        { name: 'RESOURCES', href: '/resources' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 responsive-page ${
            scrolled ? 'bg-white shadow-md' : 'bg-white shadow-sm'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-24 md:h-28">

                    {/* Logo */}
                    <div className="flex items-center gap-3 py-2 select-none flex-shrink-0">
                        <img
                            src="/seasidelogo_.png"
                            alt="Seaside Logo"
                            className="w-12 h-12 md:w-16 md:h-16 object-contain"
                        />
                        <div className="flex flex-col items-start gap-0">
                            <span className="text-xl md:text-2xl lg:text-3xl font-black text-teal-700 tracking-wider leading-tight">SEASIDE</span>
                            <span className="text-[10px] md:text-xs font-bold uppercase text-gray-700 tracking-widest leading-tight">Purified Water Refilling Station</span>
                            <span className="text-[10px] md:text-xs italic text-green-700 font-medium leading-tight">Proudly hydrating Labrador, Pangasinan</span>
                        </div>
                    </div>

                    {/* DESKTOP NAVIGATION - FORCED HORIZONTAL & SPACED */}
                    {/* Changed from lg:flex to md:flex so it shows on laptops without going to hamburger */}
                    <div className="hidden md:flex items-center justify-end flex-1 pl-4">

                        {/* BULLETPROOF SPACING: gap: '35px' forces physical space between each link */}
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '35px' }}>
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-green-700 hover:text-teal-600 active:text-violet-500 font-bold tracking-wide"
                                    style={{ whiteSpace: 'nowrap', fontSize: '15px' }}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* Apple Green Login Button - Pushed away from links with margin-left */}
                        <Link href="/login" style={{ marginLeft: '40px' }}>
                            <button
                                className="px-6 py-2.5 text-white rounded-full font-extrabold shadow-md whitespace-nowrap"
                                style={{ backgroundColor: '#8DB600' }}
                            >
                                Staff Login
                            </button>
                        </Link>
                    </div>

                    {/* Mobile Hamburger Button - Only visible on tiny phone screens now */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-gray-700 ml-4"
                    >
                        {mobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
                    </button>
                </div>

                {/* Mobile Navigation Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-200 bg-white">
                        <div className="flex flex-col space-y-2 px-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="block px-4 py-2 text-green-700 text-base font-bold"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <Link href="/login">
                                <button className="w-full mt-2 px-4 py-3 text-white rounded-full font-bold text-base shadow-sm" style={{ backgroundColor: '#8DB600' }}>
                                    Staff Login
                                </button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Header;
