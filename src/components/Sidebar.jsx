import React, { useEffect, useState } from 'react';
import { Button, cn } from './ui';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
import { useSales } from '../hooks/useSales';
import Image from 'next/image'; // <-- ADDED: Import Image component

// --- SVG ICONS (Full, valid SVG content - Assuming they exist as before) ---
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
        className="md:hidden" // Only show on mobile
        onClick={onClick}
        aria-label="Toggle menu"
    >
        <HamburgerIcon />
    </Button>
);

const Sidebar = () => {
    const router = useRouter();
    const { user, logout } = useStore(s => ({
        user: s.user,
        logout: s.logout
    }));

    const { data: sales = [], isLoading: isLoadingSales } = useSales();
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

    const handleLogout = () => {
        setIsMobileMenuOpen(false);
        logout();
        router.push('/login');
    };

    const handleNavLinkClick = (path) => {
        setIsMobileMenuOpen(false);
        router.push(path);
    };

    const todaySales = sales.filter(sale => {
        const saleDate = new Date(sale.saleTimestamp);
        const today = new Date();
        return saleDate.toDateString() === today.toDateString();
    }).reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);

    // --- 1. ADD LOGIC TO GET USER INITIAL ---
    const userInitial = clientUser?.name ? clientUser.name.charAt(0).toUpperCase() : (clientUser?.email ? clientUser.email.charAt(0).toUpperCase() : '?');

    return (
        /* MODIFICATION: Removed layout classes: "flex", "flex-col", "md:w-[200px]", "w-full", "h-auto", "md:h-screen", "flex-shrink-0", "relative", "border-b", "md:border-b-0", "md:border-r". The ".sidebar" class from globals.css already handles all of this. */
        <div className="sidebar bg-white text-gray-900 border-gray-200">
            <div className="brand p-4 flex justify-between items-center h-16 border-b border-gray-200">

                {/* --- MODIFICATION START --- */}
                {/* Replaced span with a flex container for logo + text */}
                <div className="flex items-center gap-2">
                    <Image
                        src="/seaside.png"
                        alt="Seaside Logo"
                        width={32}
                        height={32}
                    />
                    <span className="font-bold text-lg text-primary">Seaside</span>
                </div>
                {/* --- MODIFICATION END --- */}

                <HamburgerButton onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
            </div>

            <nav className={cn(
                "flex-col p-4 space-y-2 md:space-y-4 md:flex flex-1 overflow-y-auto",
                isMobileMenuOpen || router.pathname ? 'flex' : 'hidden'
            )}>
                {links.map(link => {
                    const isActive = router.pathname === link.path;
                    return (
                        <Button
                            key={link.path}
                            variant="ghost"
                            className={cn(
                                'flex items-center gap-4 p-3 rounded-md hover:bg-gray-100 w-full justify-start text-gray-900 btn',
                                { 'active': isActive }
                            )}
                            onClick={() => handleNavLinkClick(link.path)}
                        >
                            <span className="w-6 h-6 flex-shrink-0">{link.icon}</span>
                            <span>{link.name}</span>
                        </Button>
                    );
                })}
            </nav>

            {/* User Info & Logout (Meta Container) */}
            <div className={cn(
                "p-4 border-t border-gray-200 text-gray-900 md:block meta-container",
                isMobileMenuOpen || router.pathname ? 'block' : 'hidden'
            )}>
                {clientUser && (
                    <div className="mb-4 p-3 bg-gray-100 rounded-md">
                        <p className="text-sm font-medium text-gray-600">Logged in as:</p>
                        <p className="text-lg font-semibold text-gray-900 truncate">{clientUser.name || clientUser.email}</p>
                    </div>
                )}
                <div className="mb-4 p-3 bg-gray-100 rounded-md">
                    <p className="text-sm font-medium text-gray-600">Sales Today:</p>
                    <p className="text-lg font-semibold text-gray-900 truncate">
                        {isLoadingSales ? 'Loading...' : `₱${todaySales.toFixed(2)}`}
                    </p>
                </div>
                {/* Logout Button (with user initial) */}
                <Button
                    variant="ghost"
                    className={cn('flex items-center gap-4 p-3 rounded-md hover:bg-gray-100 w-full justify-start text-gray-900')}
                    onClick={handleLogout}
                >
                    {clientUser ? (
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700 text-white flex items-center justify-center text-xs font-bold" title={clientUser.name || clientUser.email}>
                            {userInitial}
                        </span>
                    ) : (
                        <span className="w-6 h-6 flex-shrink-0"> <LogoutIcon className="h-5 w-5" /> </span>
                    )}
                    <span>Logout</span>
                </Button>
            </div>
        </div>
    );
};

export default Sidebar;

