import React, { useEffect, useState } from 'react';
import { Button, cn } from './ui';
import { useRouter } from 'next/router';
import axios from 'axios';

const Sidebar = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Fetch user data from the API
        axios.get('http://localhost:8055/items/users')
            .then(response => {
                const userData = response.data.data[0]; // Assuming the first user is the logged-in user
                setUser(userData);
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
            });
    }, []);

    const links = [
        { name: 'Point of Sale', path: '/' },
        { name: 'Products', path: '/product-management' },
        { name: 'Customers', path: '/customer-management' },
        { name: 'History', path: '/history' },
        { name: 'Users', path: '/user-management' },
    ];

    const handleLogout = () => {
        // Logout logic here
        router.push('/login');
    };

    return (
        <div className="sidebar bg-secondary text-white h-full w-64 flex flex-col">
            <div className="brand p-4 font-bold text-lg border-b border-gray-700">
                SEASIDE POS
            </div>
            <nav className="flex-1 overflow-auto p-4 space-y-2">
                {links.map(link => (
                    <Button
                        key={link.path}
                        variant="ghost"
                        className={`w-full justify-start text-white hover:bg-gray-700 ${router.pathname === link.path ? 'bg-gray-800' : ''}`}
                        onClick={() => router.push(link.path)}
                    >
                        {link.name}
                    </Button>
                ))}
            </nav>
            <div className="meta p-4 border-t border-gray-700">
                <div className="text-sm mb-2">
                    Logged in as: <br />
                    <span className="font-medium">{user?.name}</span>
                    <br />
                    <span className="text-xs text-gray-400">{user?.email}</span>
                </div>
                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                    Logout
                </Button>
            </div>
        </div>
    );
};

export default Sidebar;