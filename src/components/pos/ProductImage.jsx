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

    let imageUrl = '';
    let altText = product.name;
    const lowerName = (product.name || '').toLowerCase();
    const lowerCategory = (product.category || '').toLowerCase();

    if (lowerName.includes('ice tube') || lowerName.includes('ice cubes') || lowerName.includes('ice cube') || lowerName.includes('ice tubes/cubes')) {
        imageUrl = '/icecubes.png';
    }
    else if (lowerName.includes('pet bottles')) {
        imageUrl = '/petbottles.png';
    }
    else if (lowerCategory.includes('container') || lowerName.includes('empty bottle') || lowerName.includes('container')) {
        imageUrl = '/container1.png';
    }
    else if (lowerCategory === 'water' || lowerName.includes('refill') || lowerName.includes('alkaline') || lowerName.includes('purified')) {
        imageUrl = '/refill.png';
    }

    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={altText}
                className={className}
                style={{
                    ...defaultImgStyle,
                    objectFit: 'contain',
                    padding: '4px',
                    ...style // Allow override
                }}
            />
        );
    }

    // Pass styles to icon as well
    return <PackageIcon className={`w-10 h-10 text-muted ${className || ''}`} style={style} />;
};
