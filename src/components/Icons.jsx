import React from 'react';
import { cn } from './ui';

export const CartIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
        <circle cx="9" cy="20" r="2" />
        <circle cx="15" cy="20" r="2" />
    </svg>
);

export const PackageIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path d="M3 3h18v18H3V3zm2 2v14h14V5H5z" />
        <path d="M7 7h10v10H7z" />
    </svg>
);

export const UserIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-10 1.67-10 5v3h20v-3c0-3.33-6.69-5-10-5z" />
    </svg>
);

export const ChartIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path d="M3 3h18v18H3V3zm2 2v14h14V5H5z" />
        <path d="M7 7h2v10H7zM11 10h2v7h-2zM15 5h2v12h-2z" />
    </svg>
);

export const UsersIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-10 1.67-10 5v3h20v-3c0-3.33-6.69-5-10-5z" />
        <circle cx="6" cy="8" r="2" />
        <circle cx="18" cy="8" r="2" />
    </svg>
);

export const HamburgerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M4.5 5.25a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15zM4.5 12a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15zM4.5 18.75a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15z" clipRule="evenodd" />
    </svg>
);

export const DocumentReportIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" />
        <rect x="7" y="8" width="10" height="2" rx="1" fill="#fff" />
        <rect x="7" y="12" width="10" height="2" rx="1" fill="#fff" />
        <rect x="7" y="16" width="6" height="2" rx="1" fill="#fff" />
    </svg>
);
