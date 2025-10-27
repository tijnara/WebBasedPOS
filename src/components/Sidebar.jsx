import React, { useEffect, useState } from 'react'; // Import useState
import { Button, cn } from './ui';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';

// Hamburger Icon SVG
const HamburgerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
    </svg>
);

// Hamburger Button Component (visible only on mobile)
const HamburgerButton = ({ onClick }) => (
    <Button
        variant="ghost"
        size="icon"
        className="md:hidden" // md:hidden makes it visible only below the 'md' breakpoint
        onClick={onClick}
    >
        <HamburgerIcon />
    </Button>
);

const Sidebar = () => {
    const router = useRouter();
    const { logout, user } = useStore(s => ({ logout: s.logout, user: s.user }));

    // State to manage the mobile menu's open/closed status
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const links = [
        { name: 'Point of Sale', path: '/' },
        { name: 'Products', path: '/product-management' },
        { name: 'Customers', path: '/customer-management' },
        { name: 'History', path: '/history' },
        { name: 'Users', path: '/user-management' },
    ];

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    // Close mobile menu on route change
    useEffect(() => {
        const handleRouteChange = () => {
            setIsMobileMenuOpen(false);
        };
        router.events.on('routeChangeComplete', handleRouteChange);
        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
        };
    }, [router.events]);

    return (
        <div className="sidebar">
            {/* The brand header now contains the title and the hamburger button */}
            <div className="brand p-4 font-bold text-lg border-b border-gray-700">
                <span>SEASIDE POS</span>
                <HamburgerButton onClick={() => setIsMobileMenuOpen(s => !s)} />
            </div>

            {/* This wrapper div hides/shows both nav and meta on mobile */}
            <div className={cn(
                'w-full flex-1 flex flex-col', // Base styles for the wrapper
                { 'hidden': !isMobileMenuOpen }, // Hides content if menu is closed
                'md:flex' // On medium screens and up, ALWAYS show (overrides 'hidden')
            )}>

                {/* Navigation links */}
                <nav className="flex-1 overflow-auto p-4 space-y-2">
                    {links.map(link => (
                        <Button
                            key={link.path}
                            variant="ghost"
                            className={cn('w-full justify-start', {
                                'active': router.pathname === link.path
                            })}
                            onClick={() => router.push(link.path)}
                        >
                            {link.name}
                        </Button>
                    ))}
                </nav>

                {/* Meta/User section (now visible on mobile when menu is open) */}
                <div className="meta p-4 border-t border-gray-700">
                    <div className="text-sm mb-2">
                        Logged in as: <br />
                        <span className="font-medium">{user?.name || user?.first_name || 'User'}</span>
                        <br />
                        <span className="text-xs text-muted">{user?.email}</span>
                    </div>
                    <Button variant="destructive" className="w-full" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;