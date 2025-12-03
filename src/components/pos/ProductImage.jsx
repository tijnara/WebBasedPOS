import React from 'react';

const PackageIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
);

export const ProductImage = ({ product, className, style }) => {
    // Merge custom styles with defaults
    const defaultImgStyle = {
        width: '80px',
        height: '80px',
        objectFit: 'cover',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
    };

    if (product.image_url) {
        return (
            <img
                src={product.image_url}
                alt={product.name}
                className={className}
                style={{ ...defaultImgStyle, ...style }}
            />
        );
    }

    // Generic placeholder for products without an image
    return (
        <div className={`flex items-center justify-center bg-gray-100 rounded text-gray-400 ${className}`} style={style}>
            <PackageIcon className="w-1/2 h-1/2" />
        </div>
    );
};
