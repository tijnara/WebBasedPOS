// src/components/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { Button, cn } from './ui';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
import debounce from 'lodash/debounce';
import Image from 'next/image';

// --- SVG ICONS (Keep necessary ones) ---
const CartIcon = ({ className }) => ( /* ... SVG ... */ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}> <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" /> <circle cx="9" cy="20" r="2" /> <circle cx="15" cy="20" r="2" /> </svg> );
const PackageIcon = ({ className }) => ( /* ... SVG ... */ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}> <path d="M3 3h18v18H3V3zm2 2v14h14V5H5z" /> <path d="M7 7h10v10H7z" /> </svg> );
const UserIcon = ({ className }) => ( /* ... SVG ... */ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}> <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-10 1.67-10 5v3h20v-3c0-3.33-6.69-5-10-5z" /> </svg> );
const ChartIcon = ({ className }) => ( /* ... SVG ... */ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}> <path d="M3 3h18v18H3V3zm2 2v14h14V5H5z" /> <path d="M7 7h2v10H7zM11 10h2v7h-2zM15 5h2v12h-2z" /> </svg> );
const UsersIcon = ({ className }) => ( /* ... SVG ... */ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}> <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-10 1.67-10 5v3h20v-3c0-3.33-6.69-5-10-5z" /> <circle cx="6" cy="8" r="2" /> <circle cx="18" cy="8" r="2" /> </svg> );
// Removed unused icons like Hamburger, Home, Settings, LogoutIcon (using initial now)

// Hamburger might be needed for mobile dropdown
const HamburgerIcon = () => ( /* ... SVG ... */ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"> <path fillRule="evenodd" d="M4.5 5.25a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15zM4.5 12a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15zM4.5 18.75a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15z" clipRule="evenodd" /> </svg> );


const Navbar = () => {
    const router = useRouter();
    const { user, logout } = useStore(s => ({
        user: s.user,
        logout: s.logout
    }));

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [clientUser, setClientUser] = useState(null);

    const links = [
        { name: 'POS', path: '/', icon: <CartIcon className="h-5 w-5" /> },
        { name: 'Products', path: '/product-management', icon: <PackageIcon className="h-5 w-5" /> },
        { name: 'Customer', path: '/customer-management', icon: <UserIcon className="h-5 w-5" /> },
        { name: 'Sale History', path: '/history', icon: <ChartIcon className="h-5 w-5" /> },
        { name: 'Users', path: '/user-management', icon: <UsersIcon className="h-5 w-5" /> },
    ];

    useEffect(() => {
        setClientUser(user);
    }, [user]);

    useEffect(() => {
        const logoutAfterInactivity = () => {
            let timeout;

            const startTimeout = () => {
                timeout = setTimeout(() => {
                    logout();
                    router.push('/login');
                }, 15 * 60 * 1000); // 15 minutes inactivity for mobile
            };

            const resetTimeout = debounce(() => {
                clearTimeout(timeout);
                startTimeout();
            }, 500); // Debounce reset timeout by 500ms

            const handleVisibilityChange = () => {
                if (document.visibilityState === 'hidden') {
                    clearTimeout(timeout); // Pause timer when tab is hidden
                } else if (document.visibilityState === 'visible') {
                    resetTimeout(); // Resume or reset timer when tab is visible
                }
            };

            const handleWindowBlur = () => {
                clearTimeout(timeout); // Pause timer when browser loses focus
            };

            const handleWindowFocus = () => {
                resetTimeout(); // Resume or reset timer when browser gains focus
            };

            startTimeout();
            window.addEventListener('mousemove', resetTimeout);
            window.addEventListener('keydown', resetTimeout);
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('blur', handleWindowBlur);
            window.addEventListener('focus', handleWindowFocus);

            return () => {
                clearTimeout(timeout);
                window.removeEventListener('mousemove', resetTimeout);
                window.removeEventListener('keydown', resetTimeout);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('blur', handleWindowBlur);
                window.removeEventListener('focus', handleWindowFocus);
            };
        };

        logoutAfterInactivity();
    }, [logout, router]);

    return (
        <div className="navbar">
            {/* Brand Logo and Name */}
            <div className="brand">
                <Image
                    src="/seaside.png"
                    alt="Seaside Logo"
                    width={32}
                    height={32}
                />
                <span className="font-bold text-lg text-primary hidden md:inline">Seaside</span>
            </div>

            {/* Hamburger Menu for Mobile */}
            <button
                className="hamburger-button md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Open menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
            >
                <HamburgerIcon />
            </button>

            {/* Navigation Links for Desktop */}
            <nav className="nav-links hidden md:flex">
                {links.map(link => (
                    <Button
                        key={link.name}
                        className="nav-item"
                        onClick={() => router.push(link.path)}
                    >
                        {link.icon}
                        <span>{link.name}</span>
                    </Button>
                ))}
            </nav>

            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
                <div className="fixed top-16 left-0 w-full bg-white shadow-lg z-50 md:hidden">
                    <nav className="flex flex-col p-4 gap-2">
                        {links.map(link => (
                            <Button
                                key={link.name}
                                className="w-full text-left py-3 px-4 border-b border-gray-200 nav-item"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    router.push(link.path);
                                }}
                            >
                                {link.icon}
                                <span className="ml-2">{link.name}</span>
                            </Button>
                        ))}
                    </nav>
                </div>
            )}

            {/* User Info & Logout */}
            <div className="meta-container">
                {clientUser ? (
                    <>
                        <div className="user-info-text">
                            Logged in as: <strong>{clientUser.name || clientUser.email}</strong>
                        </div>
                        <Button
                            variant="ghost"
                            className="btn"
                            onClick={logout}
                            title="Logout"
                        >
                            Logout
                        </Button>
                    </>
                ) : (
                    <div className="user-info-text">
                        Loading user information...
                    </div>
                )}
            </div>
        </div>
    );
};

export default Navbar;
