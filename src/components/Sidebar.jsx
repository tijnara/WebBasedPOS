import React, { useEffect, useState } from 'react';
import { Button, cn } from './ui';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
import { useSales } from '../hooks/useSales'; // Keep this import

// --- SVG ICONS (Updated with valid SVG content) ---
const HamburgerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M4.5 5.25a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15zM4.5 12a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15zM4.5 18.75a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15z" clipRule="evenodd" />
    </svg>
);
const HomeIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path d="M3 12l9-9 9 9-9 9-9-9z" />
    </svg>
);
const CartIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
        <circle cx="9" cy="20" r="2" />
        <circle cx="15" cy="20" r="2" />
    </svg>
);
const PackageIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path d="M3 3h18v18H3V3zm2 2v14h14V5H5z" />
        <path d="M7 7h10v10H7z" />
    </svg>
);
const UserIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-10 1.67-10 5v3h20v-3c0-3.33-6.69-5-10-5z" />
    </svg>
);
const ChartIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path d="M3 3h18v18H3V3zm2 2v14h14V5H5z" />
        <path d="M7 7h2v10H7zM11 10h2v7h-2zM15 5h2v12h-2z" />
    </svg>
);
const UsersIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-10 1.67-10 5v3h20v-3c0-3.33-6.69-5-10-5z" />
        <circle cx="6" cy="8" r="2" />
        <circle cx="18" cy="8" r="2" />
    </svg>
);
const SettingsIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-10 1.67-10 5v3h20v-3c0-3.33-6.69-5-10-5z" />
    </svg>
);
const LogoutIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path d="M10 17l5 5 5-5H10zm0-10l5-5 5 5H10zM3 3h2v18H3V3zm18 0h2v18h-2V3z" />
    </svg>
);
// --- END SVG ICONS ---

const HamburgerButton = ({ onClick }) => (
    <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onClick}
        aria-label="Toggle menu"
    >
        <HamburgerIcon />
    </Button>
);

const Sidebar = () => {
    const router = useRouter();
    const { user, logout } = useStore(s => ({ // <-- ADDED 'logout'
        user: s.user,
        logout: s.logout // <-- ADDED 'logout'
    }));

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const links = [
        { name: 'POS', path: '/', icon: <CartIcon className="h-5 w-5" /> },
        { name: 'Products', path: '/product-management', icon: <PackageIcon className="h-5 w-5" /> },
        { name: 'Customer', path: '/customer-management', icon: <UserIcon className="h-5 w-5" /> },
        { name: 'Sale History', path: '/history', icon: <ChartIcon className="h-5 w-5" /> },
        { name: 'Users', path: '/user-management', icon: <UsersIcon className="h-5 w-5" /> },
    ];

    useEffect(() => {
        const handleRouteChange = () => {
            setIsMobileMenuOpen(false);
        };
        router.events.on('routeChangeComplete', handleRouteChange);
        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
        };
    }, [router.events]);

    const getDisplayName = () => {
        if (user?.name) return user.name;
        if (user?.email) return user.email.split('@')[0];
        return 'User';
    };

    // --- ADDED HANDLER ---
    const handleLogout = () => {
        logout();
        router.push('/login'); // Or your login route
    };

    return (
        <div className="sidebar flex flex-col bg-gray-800 text-white w-[300px] h-full flex-shrink-0 relative">
            {/* Brand header */}
            <div className="brand p-4 flex justify-center items-center h-16 border-b border-gray-700">
                <span className="font-bold text-lg">Seaside</span>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 space-y-4">
                {links.map(link => (
                    <Button
                        key={link.path}
                        variant="ghost"
                        className={cn(
                            'flex items-center gap-4 p-3 rounded-md hover:bg-gray-700 w-full justify-start', // Added w-full and justify-start
                            { 'bg-gray-700': router.pathname === link.path }
                        )}
                        onClick={() => router.push(link.path)}
                    >
                        <span className="w-6 h-6 flex-shrink-0">{link.icon}</span>
                        <span>{link.name}</span>
                    </Button>
                ))}
            </nav>

            {/* --- ADDED LOGOUT BUTTON --- */}
            <div className="p-4 border-t border-gray-700">
                <Button
                    variant="ghost"
                    className={cn(
                        'flex items-center gap-4 p-3 rounded-md hover:bg-gray-700 w-full justify-start'
                    )}
                    onClick={handleLogout}
                >
                    <span className="w-6 h-6 flex-shrink-0">
                        <LogoutIcon className="h-5 w-5" />
                    </span>
                    <span>Logout</span>
                </Button>
            </div>
            {/* --- END LOGOUT BUTTON --- */}

        </div>
    );
};

export default Sidebar;