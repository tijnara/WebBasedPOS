// src/components/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { Button, cn } from './ui';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
import debounce from 'lodash/debounce';
import Image from 'next/image';

// --- SVG ICONS (Keep necessary ones) ---
const CartIcon = ({ className }) => ( /* ... SVG ... */ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}><path d="M3 3h2l.4 2M7 13h10l4-8H5.4" /><circle cx="9" cy="20" r="2" /><circle cx="15" cy="20" r="2" /></svg> );
const PackageIcon = ({ className }) => ( /* ... SVG ... */ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}><path d="M3 3h18v18H3V3zm2 2v14h14V5H5z" /><path d="M7 7h10v10H7z" /></svg> );
const UserIcon = ({ className }) => ( /* ... SVG ... */ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-10 1.67-10 5v3h20v-3c0-3.33-6.69-5-10-5z" /></svg> );
const ChartIcon = ({ className }) => ( /* ... SVG ... */ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}><path d="M3 3h18v18H3V3zm2 2v14h14V5H5z" /><path d="M7 7h2v10H7zM11 10h2v7h-2zM15 5h2v12h-2z" /></svg> );
const UsersIcon = ({ className }) => ( /* ... SVG ... */ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-10 1.67-10 5v3h20v-3c0-3.33-6.69-5-10-5z" /><circle cx="6" cy="8" r="2" /><circle cx="18" cy="8" r="2" /></svg> );
// Removed HamburgerIcon


const Navbar = () => {
    const router = useRouter();
    const { user, logout } = useStore(s => ({
        user: s.user,
        logout: s.logout
    }));

    // Removed isMobileMenuOpen state
    const [clientUser, setClientUser] = useState(null);

    const links = [
        { name: 'Dashboard', path: '/dashboard', icon: <ChartIcon className="h-5 w-5" /> },
        { name: 'POS', path: '/', icon: <CartIcon className="h-5 w-5" /> },
        { name: 'Products', path: '/product-management', icon: <PackageIcon className="h-5 w-5" /> },
        { name: 'Customer', path: '/customer-management', icon: <UserIcon className="h-5 w-5" /> },
        { name: 'Sale History', path: '/history', icon: <ChartIcon className="h-5 w-5" /> },
        { name: 'Users', path: '/user-management', icon: <UsersIcon className="h-5 w-5" /> },
        { name: 'Report', path: '/report', icon: <ChartIcon className="h-5 w-5" /> }, // New Report tab
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
                }, 15 * 60 * 1000); // 15 minutes inactivity for mobile or desktop
            };
            const resetTimeout = debounce(() => {
                clearTimeout(timeout);
                startTimeout();
            }, 500);
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'hidden') {
                    clearTimeout(timeout);
                } else if (document.visibilityState === 'visible') {
                    resetTimeout();
                }
            };
            const handleWindowBlur = () => {
                clearTimeout(timeout);
            };
            const handleWindowFocus = () => {
                resetTimeout();
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
        // Navbar is hidden on mobile by globals.css
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

            {/* Navigation Links for Desktop */}
            <nav className="nav-links hidden md:flex">
                {links.map(link => {
                    const isActive = router.pathname === link.path || (link.path === '/' && router.pathname === '/');
                    return (
                        <Button
                            key={link.name}
                            className={
                                `nav-item${isActive ? ' active text-primary font-bold border-b-2 border-primary' : ''}`
                            }
                            onClick={() => {
                                if (router.pathname !== link.path) {
                                    router.push(link.path);
                                }
                            }}
                        >
                            {link.icon}
                            <span>{link.name}</span>
                        </Button>
                    );
                })}
            </nav>

            {/* User Info & Logout */}
            <div className="meta-container">
                {clientUser ? (
                    <>
                        <div className="user-info-text">
                            <span className="text-gray-600">Logged in as:</span>{' '}
                            <strong className="text-primary">{clientUser.name || clientUser.email}</strong>
                        </div>
                        <Button
                            variant="ghost"
                            className="text-destructive"
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