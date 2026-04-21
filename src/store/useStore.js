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
                set({ user, sessionLoaded: true });
            },

            logout: async () => {
                try {
                    const currentUser = get().user;
                    await supabase.auth.signOut();
                    
                    if (currentUser) {
                        sessionStorage.removeItem(`pos_shift_prompted_${currentUser.id}`);
                    }
                    
                    set({ user: null, sessionLoaded: true, currentSale: {}, currentCustomer: null });
                } catch (error) {
                    get().addToast({ title: 'Logout Error', description: error.message, variant: 'destructive' });
                }
            },
            
            hydrate: async () => {
                if (typeof window === 'undefined' || get().sessionLoaded) return;
                
                const storedUser = get().user;
                if (storedUser) {
                    if (storedUser.isDemo) {
                        set({ sessionLoaded: true });
                        return;
                    }

                    const { data: userProfile, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', storedUser.email)
                        .single();

                    if (userProfile && !error) {
                        let role = userProfile.role || 'Staff';
                        if (role !== 'Admin' && role !== 'admin' && 
                           (String(userProfile.isadmin).trim().toLowerCase() === 'true' || userProfile.isadmin === true)) {
                            role = 'Admin';
                        }
                        set({ user: { ...userProfile, role }, sessionLoaded: true });
                    } else {
                        set({ user: null, sessionLoaded: true });
                    }
                } else {
                    set({ user: null, sessionLoaded: true });
                }
            }
        }),
        {
            name: 'pos_custom_user', 
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ user: state.user }), 
        }
    )
);

export default useStore;
