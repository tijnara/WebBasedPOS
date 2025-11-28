import React from 'react';

export default function CartDrawer({ cartItems, onRemove, onClose, visible, createSaleMutation }) {
  // Defensive fallback for createSaleMutation
  const safeCreateSaleMutation = createSaleMutation && typeof createSaleMutation.isPending !== 'undefined'
    ? createSaleMutation
    : { isPending: false };

  return (
    <div className={`cart-drawer ${visible ? 'open' : ''}`}>
      <div className="cart-header">
        <span>Cart</span>
        <button onClick={onClose}>Close</button>
      </div>
      <div className="cart-items">
        {cartItems.length === 0 ? (
          <div className="empty-cart">No items in cart.</div>
        ) : (
          cartItems.map(item => (
            <div className="cart-item" key={item.key}>
              <span className="item-name">{item.name}</span>
              <span className="item-qty">x{item.quantity}</span>
              <span className="item-price">₱{(item.price * item.quantity).toFixed(2)}</span>
              <button className="remove-btn" onClick={() => onRemove(item.key)}>Remove</button>
            </div>
          ))
        )}
      </div>
      {/* Example usage of createSaleMutation.isPending for disabling actions */}
      <button disabled={safeCreateSaleMutation.isPending}>Checkout</button>
    </div>
  );
}
