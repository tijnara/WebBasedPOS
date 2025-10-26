import React, { useEffect, useState } from 'react';
import { Button, cn } from './ui'; // Import cn
import { useRouter } from 'next/router';
import axios from 'axios';
import { useStore } from '../store/useStore'; // Import useStore

const Sidebar = () => {
    const router = useRouter();
    const { logout, user: storeUser } = useStore(s => ({ logout: s.logout, user: s.user })); // Get user and logout from store

    // This local state is still fine for fetching details if the storeUser is just an ID/email
    // But for this app, the user object is already in the store after login.
    // const [user, setUser] = useState(null);
    // useEffect(() => {
    //     ...
    // }, []);

    // Use the user from the store directly
    const user = storeUser;

    const links = [
        { name: 'Point of Sale', path: '/' },
        { name: 'Products', path: '/product-management' },
        { name: 'Customers', path: '/customer-management' },
        { name: 'History', path: '/history' },
        { name: 'Users', path: '/user-management' },
    ];

    const handleLogout = () => {
        logout(); // Use the logout function from the store
        router.push('/login');
    };

    return (
        // REMOVED conflicting Tailwind classes like w-64, h-full, bg-secondary, etc.
        // The ".sidebar" class is now fully controlled by styles/globals.css
        <div className="sidebar">
            <div className="brand p-4 font-bold text-lg border-b border-gray-700">
                SEASIDE POS
            </div>

            {/* Nav links scroll horizontally on mobile, stack vertically on desktop */}
            <nav className="flex-1 overflow-auto p-4 space-y-2">
                {links.map(link => (
                    <Button
                        key={link.path}
                        variant="ghost"
                        // UPDATED: Use cn() to conditionally apply the "active" class
                        // globals.css now styles ".sidebar .btn.active"
                        className={cn('w-full justify-start', {
                            'active': router.pathname === link.path
                        })}
                        onClick={() => router.push(link.path)}
                    >
                        {link.name}
                    </Button>
                ))}
            </nav>

            {/* This "meta" div is hidden on mobile and shown on desktop by globals.css */}
            <div className="meta p-4 border-t border-gray-700">
                <div className="text-sm mb-2">
                    Logged in as: <br />
                    {/* Use storeUser */}
                    <span className="font-medium">{user?.name || user?.first_name || 'User'}</span>
                    <br />
                    <span className="text-xs text-muted">{user?.email}</span>
                </div>
                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                    Logout
                </Button>
            </div>
        </div>
    );
};

export default Sidebar;