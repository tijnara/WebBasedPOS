import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../lib/api';
import currency from 'currency.js';
import { supabase } from '../lib/supabaseClient';

export const useStore = create(
    persist(
        (set, get) => ({
            user: null,
            sessionLoaded: false,
            currentSale: {},
            currentCustomer: null,
            toasts: [],
            darkMode: false,

            // Internal action to be called by the persist middleware once hydration is complete
            _setSessionLoaded: () => set({ sessionLoaded: true }),

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
                set({ user });
            },

            logout: async () => {
                try {
                    await supabase.auth.signOut();
                    set({ user: null, currentSale: {}, currentCustomer: null });
                } catch (error) {
                    get().addToast({ title: 'Logout Error', description: error.message, variant: 'destructive' });
                }
            },
            
            toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
        }),
        {
            name: 'pos_custom_user', 
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ user: state.user, darkMode: state.darkMode }),
            onRehydrateStorage: () => (state) => {
                state._setSessionLoaded();
            },
        }
    )
);

export default useStore;