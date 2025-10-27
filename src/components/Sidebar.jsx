import React, { useEffect, useState } from 'react';
import { Button, cn } from './ui';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';

// Hamburger Icon SVG
const HamburgerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
    </svg>
);

// Hamburger Button Component
const HamburgerButton = ({ onClick }) => (
    <Button
        variant="ghost"
        size="icon"
        className="md:hidden" // Only show on small screens
        onClick={onClick}
        aria-label="Toggle menu" // Accessibility
    >
        <HamburgerIcon />
    </Button>
);

const Sidebar = () => {
    const router = useRouter();
    // Get logout function and the custom user object from store
    const { logout, user } = useStore(s => ({
        logout: s.logout,
        user: s.user // This is now the object from your 'users' table
    }));

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Define links
    const links = [
        { name: 'Point of Sale', path: '/' },
        { name: 'Products', path: '/product-management' },
        { name: 'Customers', path: '/customer-management' },
        { name: 'History', path: '/history' },
        // Conditionally show Users link based on role if needed
        // { name: 'Users', path: '/user-management', roles: ['admin'] },
        { name: 'Users', path: '/user-management' }, // Simpler version
    ];

    // Filter links (keep simple for now)
    const visibleLinks = links;

    const handleLogout = async () => {
        // Use the store's simplified logout
        await logout();
        // Redirect handled by AuthGate, but explicit push is fine
        router.push('/login');
    };

    // Close mobile menu on route change
    useEffect(() => {
        const handleRouteChange = () => {
            setIsMobileMenuOpen(false);
        };
        router.events.on('routeChangeComplete', handleRouteChange);
        // Clean up the event listener on component unmount
        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
        };
    }, [router.events]);

    // Determine the display name from the custom user object
    const getDisplayName = () => {
        if (user?.name) return user.name; // Use the 'name' field from your 'users' table
        if (user?.email) return user.email.split('@')[0]; // Fallback to part of email
        return 'User'; // Default fallback
    };


    return (
        // Sidebar container: Column layout, fixed width on desktop, full width on mobile
        <div className="sidebar flex flex-col bg-white border-b md:border-b-0 md:border-r border-gray-200 md:w-64 flex-shrink-0 relative md:h-screen">

            {/* Brand header */}
            <div className="brand p-4 font-bold text-lg text-primary flex justify-between items-center h-16 border-b border-gray-200">
                <span>SEASIDE POS</span>
                <HamburgerButton onClick={() => setIsMobileMenuOpen(s => !s)} />
            </div>

            {/* Mobile menu wrapper: Absolute position below header on mobile, static on desktop */}
            <div className={cn(
                'absolute md:static top-16 left-0 right-0 md:top-auto md:left-auto md:right-auto', // Positioning
                'bg-white border-r border-l border-b md:border-none', // Borders
                'flex-1 flex flex-col overflow-y-auto md:overflow-visible', // Layout & Overflow
                { 'hidden': !isMobileMenuOpen }, // Hide on mobile if closed
                'md:flex' // Always display flex on medium+ screens
            )}>

                {/* Navigation Links */}
                <nav className="flex-1 p-4 space-y-2">
                    {visibleLinks.map(link => (
                        <Button
                            key={link.path}
                            variant="ghost" // Use ghost variant for base style
                            className={cn(
                                'w-full justify-start text-left h-auto py-2 px-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900', // Base styles
                                { // Active state using primary colors
                                    'bg-blue-50 text-primary font-semibold': router.pathname === link.path,
                                }
                            )}
                            onClick={() => router.push(link.path)}
                        >
                            {link.name}
                        </Button>
                    ))}
                </nav>

                {/* Meta/User section: Pushed to bottom */}
                <div className="meta p-4 border-t border-gray-200 mt-auto">
                    <div className="text-sm mb-2 text-gray-700">
                        Logged in as: <br />
                        <span className="font-medium text-gray-900 block truncate">{getDisplayName()}</span><br />
                        <span className="text-xs text-gray-500 block truncate">{user?.email}</span>
                        {/* Optional: Display role if available in user object */}
                        {/* {user?.role && <span className="text-xs text-blue-600 block capitalize mt-1">Role: {user.role}</span>} */}
                    </div>
                    <Button
                        variant="destructive" // Use destructive variant for logout
                        className="w-full"
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;