import React from 'react';
import { Button, cn } from './ui';
import { useRouter } from 'next/router';

const Sidebar = () => {
    const router = useRouter();

    const links = [
        { name: 'Point of Sale', path: '/' },
        { name: 'Products', path: '/product-management' },
        { name: 'Customers', path: '/customer-management' },
        { name: 'History', path: '/history' },
    ];

    return (
        <div className="sidebar bg-secondary text-white h-full w-64 flex flex-col">
            <div className="brand p-4 font-bold text-lg border-b border-gray-700">
                SEASIDE POS
            </div>
            <nav className="flex-1 overflow-auto">
                {links.map(link => (
                    <Button
                        key={link.path}
                        variant="ghost"
                        className={cn(
                            'w-full justify-start',
                            router.pathname === link.path && 'bg-gray-800'
                        )}
                        onClick={() => router.push(link.path)}
                    >
                        {link.name}
                    </Button>
                ))}
            </nav>
            <div className="meta p-4">
                <Button variant="primary" className="w-full">
                    Today's Sales $451.49
                </Button>
            </div>
        </div>
    );
};

export default Sidebar;
