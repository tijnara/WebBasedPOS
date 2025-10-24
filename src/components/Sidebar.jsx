import React from 'react';
import { cn } from './ui';
import { useRouter } from 'next/router';

const Sidebar = () => {
    const router = useRouter();

    const links = [
        { name: 'POS', path: '/' },
        { name: 'Customer Management', path: '/customer-management' },
        { name: 'Product Management', path: '/product-management' },
        { name: 'History', path: '/history' },
    ];

    return (
        <div className="sidebar bg-secondary text-white h-full w-64 flex flex-col">
            <div className="sidebar-header p-4 font-bold text-lg border-b border-gray-700">
                WebBasedPOS
            </div>
            <div className="sidebar-links flex-1 overflow-auto">
                {links.map(link => (
                    <button
                        key={link.path}
                        className={cn(
                            'block w-full text-left px-4 py-2 hover:bg-gray-700',
                            router.pathname === link.path && 'bg-gray-800'
                        )}
                        onClick={() => router.push(link.path)}
                    >
                        {link.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
