// src/components/pos/ProductImage.jsx
import React from 'react';
import Product3DVisual from './Product3DVisual';

export const ProductImage = ({ product, className = 'w-10 h-10', style }) => {
    const imgUrl = String(product?.image_url || '').trim();
    const isCustomUploadedPhoto =
        imgUrl &&
        !imgUrl.startsWith('3d:') &&
        !product?.icon_3d_key &&
        (imgUrl.startsWith('http') || imgUrl.startsWith('data:'));

    if (isCustomUploadedPhoto) {
        return (
            <img
                src={imgUrl}
                alt={product?.name || 'Product'}
                className={className}
                style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    ...style
                }}
            />
        );
    }

    return (
        <div
            className={`flex items-center justify-center ${className}`}
            style={{ width: style?.width || '100%', height: style?.height || '100%' }}
        >
            <Product3DVisual product={product} className="w-full h-full" />
        </div>
    );
};

export default ProductImage;