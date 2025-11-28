import React from 'react';
import { Button } from '../ui';
import currency from 'currency.js';

const MobileCartBar = ({ itemCount, subtotal, onOpenCart }) => {
    if (itemCount === 0) {
        return null;
    }

    return (
        <div className="mobile-cart-bar">
            <Button
                variant="primary"
                className="w-full h-12 text-lg rounded-lg"
                onClick={onOpenCart}
            >
                {itemCount} {itemCount > 1 ? 'Items' : 'Item'} • {currency(subtotal).format()} | View Cart &rarr;
            </Button>
        </div>
    );
};

export default MobileCartBar;
