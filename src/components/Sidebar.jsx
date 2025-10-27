import React, { useEffect, useState } from 'react';
import { Button, cn } from './ui';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
// No need to import api.js here anymore, logout is handled by the store

// Hamburger Icon SVG (keep as is)
const HamburgerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
    </svg>
);

// Hamburger Button Component (keep as is)
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
    // Get logout function, user object, and profile object from store
    const { logout, user, profile } = useStore(s => ({
        logout: s.logout,
        user: s.user,
        profile: s.profile
    }));

    // State to manage the mobile menu's open/closed status
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Define links - adjust paths/names as needed
    const links = [
        { name: 'Point of Sale', path: '/' },
        { name: 'Products', path: '/product-management' },
        { name: 'Customers', path: '/customer-management' },
        { name: 'History', path: '/history' },
        // Optional: Conditionally show Users link based on role
        // { name: 'Users', path: '/user-management', roles: ['admin'] },
        { name: 'Users', path: '/user-management' }, // Simpler version for now
    ];

    // Filter links based on user role (Example)
    // const userRole = profile?.role || 'user'; // Assuming role is in profile
    // const visibleLinks = links.filter(link => !link.roles || link.roles.includes(userRole));
    const visibleLinks = links; // Simpler version for now

    const handleLogout = async () => {
        // The store's logout function now handles the API call and state clearing
        await logout();
        // Redirect is handled by AuthGate, but explicit push ensures quick redirect
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

    // Determine the display name: Profile name > User metadata name > Email
    const getDisplayName = () => {
        if (profile?.full_name) return profile.full_name;
        if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
        if (user?.email) return user.email.split('@')[0]; // Fallback to part of email
        return 'User';
    };


    return (
        <div className="sidebar">
            {/* Brand header with title and hamburger */}
            <div className="brand p-4 font-bold text-lg border-b border-gray-700 flex justify-between items-center">
                <span>SEASIDE POS</span>
                <HamburgerButton onClick={() => setIsMobileMenuOpen(s => !s)} />
            </div>

            {/* Wrapper div hides/shows both nav and meta on mobile */}
            <div className={cn(
                'w-full flex-1 flex flex-col', // Base styles
                { 'hidden': !isMobileMenuOpen }, // Hide if menu closed on mobile
                'md:flex' // Always show on medium+ screens
            )}>

                {/* Navigation links */}
                <nav className="flex-1 overflow-auto p-4 space-y-2">
                    {visibleLinks.map(link => (
                        <Button
                            key={link.path}
                            variant="ghost"
                            className={cn('w-full justify-start text-left h-auto py-2 px-3', { // Adjusted style
                                'active bg-primary text-primary-foreground hover:bg-primary/90': router.pathname === link.path, // Active state
                                'hover:bg-accent hover:text-accent-foreground': router.pathname !== link.path // Hover state
                            })}
                            onClick={() => router.push(link.path)}
                        >
                            {link.name}
                        </Button>
                    ))}
                </nav>

                {/* Meta/User section */}
                <div className="meta p-4 border-t border-gray-700 mt-auto"> {/* Added mt-auto */}
                    <div className="text-sm mb-2">
                        Logged in as: <br />
                        <span className="font-medium">{getDisplayName()}</span>
                        <br />
                        <span className="text-xs text-muted">{user?.email}</span>
                        {/* Optionally display role */}
                        {/* {profile?.role && <span className="text-xs text-muted block capitalize">Role: {profile.role}</span>} */}
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