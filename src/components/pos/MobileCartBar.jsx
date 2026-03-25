// src/components/pos/MobileCartBar.jsx
import React from 'react';
import { Button } from '../ui';
import currency from 'currency.js';

const MobileCartBar = ({ itemCount, totalQty, subtotal, onOpenCart }) => {
    if (itemCount === 0) {
        return null;
    }

    return (
        <div className="mobile-cart-bar responsive-page">
            <Button
                variant="primary"
                className="w-full h-12 text-base font-medium rounded-lg shadow-lg flex items-center justify-between px-4"
                onClick={onOpenCart}
            >
                <span>{itemCount} {itemCount > 1 ? 'Items' : 'Item'} • {totalQty} pcs</span>
                <span>{currency(subtotal, { symbol: '₱', precision: 2 }).format()}</span>
                <span>View Cart &rarr;</span>
            </Button>
        </div>
    );
};

export default MobileCartBar;