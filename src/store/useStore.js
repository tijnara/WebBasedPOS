// src/store/useStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../lib/api';
import currency from 'currency.js';
import { supabase } from '../lib/supabaseClient';

const clearAuthAndShiftStorage = () => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem('pos_custom_user');
        localStorage.removeItem('seaside_last_active_at');
        sessionStorage.removeItem('pos_tab_initialized');

        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (key.startsWith('pos_shift_prompted_') || key.startsWith('demo_shift_'))) {
                sessionKeysToRemove.push(key);
            }
        }
        sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key));
    } catch {
        // Ignore storage access errors
    }
};

export const useStore = create(
    persist(
        (set, get) => ({
            user: null,
            sessionLoaded: false,
            currentSale: {},
            currentCustomer: null,
            toasts: [],
            darkMode: false,

            // Internal action to be called once hydration is complete
            _setSessionLoaded: () => set({ sessionLoaded: true }),

            // Helper to always resolve the active tenant store_id
            getStoreId: () => Number(get().user?.store_id) || 1,

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
                const normalizedUser = user
                    ? { ...user, store_id: Number(user.store_id) || 1 }
                    : null;

                if (typeof window !== 'undefined') {
                    try {
                        sessionStorage.setItem('pos_tab_initialized', 'true');
                        if (normalizedUser) {
                            localStorage.setItem('seaside_last_active_at', String(Date.now()));
                        } else {
                            clearAuthAndShiftStorage();
                        }
                    } catch {
                        // Ignore storage errors
                    }
                }
                set({ user: normalizedUser, sessionLoaded: true });
            },

            logout: async () => {
                try {
                    await supabase.auth.signOut();
                } catch (error) {
                    get().addToast({ title: 'Logout Error', description: error.message, variant: 'destructive' });
                } finally {
                    clearAuthAndShiftStorage();
                    set({ user: null, sessionLoaded: true, currentSale: {}, currentCustomer: null });
                }
            },

            toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
        }),
        {
            name: 'pos_custom_user',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ user: state.user, darkMode: state.darkMode }),
            onRehydrateStorage: () => (state) => {
                if (state && typeof state._setSessionLoaded === 'function') {
                    if (state.user && !state.user.store_id) {
                        state.user = { ...state.user, store_id: 1 };
                    }
                    state._setSessionLoaded();
                } else {
                    useStore.setState({ sessionLoaded: true });
                }
            },
        }
    )
);

// Ensure sessionLoaded is marked true on client even if rehydration callback fires before mount
if (typeof window !== 'undefined') {
    const markHydrated = () => {
        if (!useStore.getState().sessionLoaded) {
            useStore.setState({ sessionLoaded: true });
        }
    };
    if (useStore.persist?.hasHydrated?.()) {
        markHydrated();
    } else {
        queueMicrotask(markHydrated);
    }
}

export default useStore;