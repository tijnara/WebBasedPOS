// src/store/useStore.js
import { create } from 'zustand';
import api from '../lib/api';
import currency from 'currency.js';

// ... (persistence code remains the same) ...
const persistUserToStorage = (user) => {
    if (typeof window !== 'undefined') {
        try {
            if (user) {
                const userToStore = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    dateadded: user.dateadded,
                    isDemo: user.isDemo || false,
                    role: user.role
                };
                localStorage.setItem('pos_custom_user', JSON.stringify(userToStore));
            } else {
                localStorage.removeItem('pos_custom_user');
            }
        } catch (error) {
            console.error("Store: Error persisting user to localStorage", error);
        }
    }
};

const getUserFromStorage = () => {
    if (typeof window !== 'undefined') {
        const userJson = localStorage.getItem('pos_custom_user');
        if (!userJson) return null;
        try {
            const user = JSON.parse(userJson);
            if (user && user.id && user.email) {
                return user;
            } else {
                localStorage.removeItem('pos_custom_user');
                return null;
            }
        } catch (e) {
            localStorage.removeItem('pos_custom_user');
            return null;
        }
    }
    return null;
};

const initialUser = getUserFromStorage();

export const useStore = create((set, get) => ({
    user: initialUser,
    sessionLoaded: typeof window !== 'undefined',

    currentSale: {},
    currentCustomer: null,
    toasts: [],

    setCurrentCustomer: (cust) => set({ currentCustomer: cust }),

    // --- UPDATED: Support basePrice and image_url ---
    addItemToSale: (product, quantity = 1, overridePrice = null) =>
        set((state) => {
            const priceToParse = overridePrice !== null ? overridePrice : (product.price ?? 0);
            const price = Number(priceToParse);

            if (isNaN(price)) return {};

            // Key is ID + Active Price
            const key = `${product.id}__${price.toFixed(2)}`;
            const existing = state.currentSale[key];
            const currentQty = existing ? existing.quantity : 0;
            const newQty = Math.max(0, currentQty + quantity);

            if (newQty <= 0) {
                const { [key]: _, ...rest } = state.currentSale;
                return { currentSale: rest };
            }

            return {
                currentSale: {
                    ...state.currentSale,
                    [key]: {
                        productId: product.id,
                        name: product.name,
                        price,
                        image_url: product.image_url, // --- ADDED ---
                        // Store basePrice for future discount calculations
                        basePrice: existing?.basePrice ?? (product.price ?? price),
                        quantity: newQty,
                        // Preserve existing notes/discounts if simply incrementing
                        discountType: existing?.discountType || 'none',
                        discountValue: existing?.discountValue || 0,
                        note: existing?.note || ''
                    }
                }
            };
        }),

    // --- NEW: Update Cart Item (Handle edits from modal) ---
    updateCartItem: (oldKey, updates) => set((state) => {
        const item = state.currentSale[oldKey];
        if (!item) return {};

        // Calculate new effective price if provided, otherwise keep old
        const newPrice = updates.price !== undefined ? Number(updates.price) : item.price;
        const newQty = updates.quantity !== undefined ? Number(updates.quantity) : item.quantity;

        // If qty is 0, remove
        if (newQty <= 0) {
            const { [oldKey]: _, ...rest } = state.currentSale;
            return { currentSale: rest };
        }

        // Generate new key based on new price
        const newKey = `${item.productId}__${newPrice.toFixed(2)}`;

        // If key changed (price changed), we need to move the item
        if (newKey !== oldKey) {
            // Remove old
            const { [oldKey]: _, ...rest } = state.currentSale;

            // Check if target key exists (merging)
            const existingTarget = rest[newKey];
            const mergedQty = existingTarget ? existingTarget.quantity + newQty : newQty;

            return {
                currentSale: {
                    ...rest,
                    [newKey]: {
                        ...item,
                        ...updates,
                        quantity: mergedQty,
                        price: newPrice
                    }
                }
            };
        } else {
            // Just update in place
            return {
                currentSale: {
                    ...state.currentSale,
                    [oldKey]: { ...item, ...updates, quantity: newQty }
                }
            };
        }
    }),

    removeItemFromSale: (key) => set((state) => {
        const { [key]: _, ...rest } = state.currentSale;
        return { currentSale: rest };
    }),
    clearSale: () => {
        set({ currentSale: {}, currentCustomer: null });
    },
    getTotalAmount: () => {
        const sale = get().currentSale;
        return Object.values(sale).reduce((total, item) => {
            return total.add(currency(item.price).multiply(item.quantity));
        }, currency(0)).value;
    },
    addToast: (t) => {
        const id = Date.now() + Math.random();
        set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
        setTimeout(() => {
            get().dismissToast(id);
        }, 2000);
    },
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter(x => x.id !== id) })),

    setAuth: (user) => {
        persistUserToStorage(user);
        set({ user, sessionLoaded: true });
    },
    logout: () => {
        try {
            api.logout();
            persistUserToStorage(null);
            set({ user: null });
        } catch (error) {
            get().addToast({ title: 'Logout Error', description: error.message || 'Logout failed.', variant: 'destructive' });
        }
    },
    hydrate: () => {
        if (!get().sessionLoaded && typeof window !== 'undefined') {
            const userFromStorage = getUserFromStorage();
            set({ sessionLoaded: true, user: userFromStorage });
        } else if (get().sessionLoaded && typeof window !== 'undefined' && get().user === null && localStorage.getItem('pos_custom_user')) {
            const userFromStorage = getUserFromStorage();
            set({ user: userFromStorage });
        }
    }
}));

export default useStore;