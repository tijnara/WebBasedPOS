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

export const EditIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

export const DeleteIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

export const ReceiptIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.586l-1.707 1.707A1 1 0 002 7v10a2 2 0 002 2h12a2 2 0 002-2V7a1 1 0 00-.293-.707L16 4.586V3a1 1 0 00-1-1H5zM4 7h12v10H4V7zm5 2a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-2 4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
);

export const ViewIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
);

export const GalleryIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
    </svg>
);

export const HomeIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path d="M11.47 3.84a.75.75 0 011.06 0l8.99 8.99a.75.75 0 01-1.06 1.06L12 5.66l-8.46 8.23a.75.75 0 01-1.06-1.06l8.99-8.99z" />
        <path d="M12 5.43l8 7.78V20a2 2 0 01-2 2H6a2 2 0 01-2-2v-6.79l8-7.78z" />
    </svg>
);

export const SettingsIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path fillRule="evenodd" d="M11.07 2.55a10.002 10.002 0 011.86 0l.93.26c.29.08.59.2.87.37l.9.52c.26.15.5.33.73.53l.72.62c.2.17.38.36.54.56l.52.62c-.16.2-.3.4-.43.6l-.26.46a10.002 10.002 0 010 2.3l.26.46c.13.2.27.4.43.6l.52.62c.16.2.34.39.54.56l.72.62c.23.2.47.38.73.53l.9.52c.28.17.58.29.87.37l.93.26a10.002 10.002 0 01-1.86 0l-.93-.26c-.29-.08-.59-.2-.87-.37l-.9-.52c-.26-.15-.5-.33-.73-.53l-.72-.62c-.2-.17-.38-.36-.54-.56l-.52-.62c-.16-.2-.3-.4-.43-.6l-.26-.46a10.002 10.002 0 010-2.3l.26-.46c.13-.2.27-.4.43-.6l.52-.62c.16-.2.34-.39.54-.56l.72-.62c.23-.2.47-.38-.73-.53l.9-.52c.28-.17.58-.29-.87-.37l.93-.26zM12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" clipRule="evenodd" />
    </svg>
);

export const BookOpen = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.1.02-.2.03-.3h2.02c-.01.1-.03.2-.03.3 0 3.03 2.47 5.5 5.5 5.5v2.43zm2.5-1.9c-1.5 0-2.82-.66-3.75-1.69.93-1.03 2.25-1.69 3.75-1.69s2.82.66 3.75 1.69c-.93 1.03-2.25-1.69-3.75-1.69zm2.48-3.5c-.18-.03-.36-.05-.55-.05-1.3 0-2.48.53-3.32 1.32-.84-.79-2.02-1.32-3.32-1.32-.19 0-.37.02-.55.05C5.02 13.55 4 12.38 4 11c0-3.86 3.14-7 7-7s7 3.14 7 7c0 1.38-1.02 2.55-2.52 3.53z" />
    </svg>
);

export const MailIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v.51l8 4.5 8-4.51V6H4zm8 6L4 8v10h16V8l-8 4z"/>
    </svg>
);
