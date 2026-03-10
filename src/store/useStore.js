// src/store/useStore.js
import { create } from 'zustand';
import api from '../lib/api';
import currency from 'currency.js';
import { supabase } from '../lib/supabaseClient'; // Import supabase client

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
    sessionLoaded: false, // Start as false until we check the session

    currentSale: {},
    currentCustomer: null,
    toasts: [],

    setCurrentCustomer: (cust) => set({ currentCustomer: cust }),

    addItemToSale: (product, quantity = 1, overridePrice = null) =>
        set((state) => {
            const priceToParse = overridePrice !== null ? overridePrice : (product.price ?? 0);
            const price = Number(priceToParse);

            if (isNaN(price)) return {};

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
                        image_url: product.image_url,
                        basePrice: existing?.basePrice ?? (product.price ?? price),
                        quantity: newQty,
                        discountType: existing?.discountType || 'none',
                        discountValue: existing?.discountValue || 0,
                        note: existing?.note || ''
                    }
                }
            };
        }),

    updateCartItem: (oldKey, updates) => set((state) => {
        const item = state.currentSale[oldKey];
        if (!item) return {};

        const newPrice = updates.price !== undefined ? Number(updates.price) : item.price;
        const newQty = updates.quantity !== undefined ? Number(updates.quantity) : item.quantity;

        if (newQty <= 0) {
            const { [oldKey]: _, ...rest } = state.currentSale;
            return { currentSale: rest };
        }

        const newKey = `${item.productId}__${newPrice.toFixed(2)}`;

        if (newKey !== oldKey) {
            const { [oldKey]: _, ...rest } = state.currentSale;
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
    logout: async () => {
        try {
            await supabase.auth.signOut();
            persistUserToStorage(null);
            set({ user: null, sessionLoaded: true });
        } catch (error) {
            get().addToast({ title: 'Logout Error', description: error.message || 'Logout failed.', variant: 'destructive' });
        }
    },
    hydrate: async () => {
        if (typeof window === 'undefined' || get().sessionLoaded) return;

        set({ sessionLoaded: false });

        // Get the user from localStorage instead of Supabase Auth
        const storedUser = getUserFromStorage();

        if (storedUser) {
            if (storedUser.isDemo) {
                // Restore demo user without querying the database
                get().setAuth(storedUser);
            } else {
                // Verify the real user still exists in the database
                const { data: userProfile, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', storedUser.email)
                    .single();
                
                if (userProfile && !error) {
                    let role = 'Staff';
                    if (
                        (typeof userProfile.isadmin === 'string' && userProfile.isadmin.trim().toLowerCase() === 'true') || 
                        userProfile.isadmin === true
                    ) {
                        role = 'Admin';
                    }
                    get().setAuth({ ...userProfile, role });
                } else {
                    // User no longer exists or was deleted
                    get().setAuth(null);
                }
            }
        } else {
            // No session found
            get().setAuth(null);
        }
        
        set({ sessionLoaded: true });
    }
}));

export default useStore;