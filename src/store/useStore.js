// src/store/useStore.js
import { create } from 'zustand';
import api from '../lib/api'; // Ensure this points to your updated api.js
import currency from 'currency.js';

// Persistence for the custom user object (using localStorage for permanent login)
const persistUserToStorage = (user) => {
    // Ensure running on client-side
    if (typeof window !== 'undefined') {
        try {
            if (user) {
                // Only store non-sensitive, necessary user info
                const userToStore = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone, // Include if needed by UI
                    dateadded: user.dateadded, // Include if needed by UI
                    isDemo: user.isDemo || false, // <-- ADDED: Store the demo flag
                    // --- ADDED: Persist the role so we can check permissions ---
                    role: user.role
                };
                // --- CHANGED to localStorage ---
                localStorage.setItem('pos_custom_user', JSON.stringify(userToStore));
            } else {
                // --- CHANGED to localStorage ---
                localStorage.removeItem('pos_custom_user');
            }
        } catch (error) {
            console.error("Store: Error persisting user to localStorage", error);
        }
    }
};

const getUserFromStorage = () => {
    // Ensure running on client-side
    if (typeof window !== 'undefined') {
        // --- CHANGED to localStorage ---
        const userJson = localStorage.getItem('pos_custom_user');
        if (!userJson) return null;
        try {
            const user = JSON.parse(userJson);
            // Basic validation of stored data
            if (user && user.id && user.email) {
                return user;
            } else {
                // --- CHANGED to localStorage ---
                localStorage.removeItem('pos_custom_user');
                return null;
            }
        } catch (e) {
            // --- CHANGED to localStorage ---
            localStorage.removeItem('pos_custom_user'); // Clear invalid data
            return null;
        }
    }
    return null;
};

// Initialize state attempt (will run client-side on first render/hydration)
const initialUser = getUserFromStorage();

export const useStore = create((set, get) => ({
    // --- Auth State (Updated for Custom User Object) ---
    user: initialUser, // Load initial user from storage
    // session: null, // Removed - No Supabase session concept here
    // Use `sessionLoaded` to indicate if initial state (from storage) is ready client-side
    sessionLoaded: typeof window !== 'undefined',

    // --- UI / Cart State (Keep) ---
    currentSale: {},
    currentCustomer: null,
    toasts: [],

    // --- Setters (Keep Cart/Customer/Toast) ---
    setCurrentCustomer: (cust) => set({ currentCustomer: cust }),
    addItemToSale: (product, quantity = 1, overridePrice = null) =>
        set((state) => {

            // --- START OF FIX ---
            // Original code:
            // const price = parseFloat(overridePrice !== null ? overridePrice : product.price || 0);

            // Robust Fix:
            // 1. Determine the price to use. Use ?? to default null/undefined to 0.
            const priceToParse = overridePrice !== null ? overridePrice : (product.price ?? 0);
            // 2. Convert to a number. This handles numbers, strings, null, etc. safely.
            const price = Number(priceToParse);
            // --- END OF FIX ---

            if (isNaN(price)) {
                return {}; // Silently fail without updating state
            }
            const key = `${product.id}__${price.toFixed(2)}`; // Unique key per product & price combo
            const existing = state.currentSale[key];
            const currentQty = existing ? existing.quantity : 0;
            const newQty = Math.max(0, currentQty + quantity); // Don't allow negative quantity
            if (newQty <= 0) {
                const { [key]: _, ...rest } = state.currentSale;
                return { currentSale: rest };
            }
            return {
                currentSale: {
                    ...state.currentSale,
                    [key]: { productId: product.id, name: product.name, price, quantity: newQty }
                }
            };
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
        // Uses currency.js to add up values safely
        return Object.values(sale).reduce((total, item) => {
            return total.add(currency(item.price).multiply(item.quantity));
        }, currency(0)).value;
    },
    addToast: (t) => {
        const id = Date.now() + Math.random(); // Unique ID for the toast
        set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));

        // Automatically dismiss the toast after 2 seconds
        setTimeout(() => {
            get().dismissToast(id);
        }, 2000);
    },
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter(x => x.id !== id) })),

    // --- Auth (Updated for Custom Login) ---
    // Called after successful custom table login
    setAuth: (user) => {
        persistUserToStorage(user); // Persist user to localStorage
        // Set user and ensure sessionLoaded is true
        set({ user, sessionLoaded: true });
    },

    // checkSession is not needed for this custom auth approach
    // checkSession: async () => { /* REMOVED */ },

    // Logs the user out (client-side state clearing only)
    logout: () => { // Made synchronous as api.logout is now sync
        try {
            api.logout(); // Call the simplified api.logout
            persistUserToStorage(null); // Remove user from localStorage
            set({ user: null }); // Clear user state
        } catch (error) {
            get().addToast({ title: 'Logout Error', description: error.message || 'Logout failed.', variant: 'destructive' });
        }
    },
    // Function to ensure sessionLoaded is true after initial client-side hydration
    hydrate: () => {
        // This function now primarily ensures the store knows it's running client-side
        // and has attempted to load the initial user state from localStorage.
        if (!get().sessionLoaded && typeof window !== 'undefined') {
            // Try loading from storage again in case initialUser was null server-side
            const userFromStorage = getUserFromStorage();
            set({ sessionLoaded: true, user: userFromStorage });
        } else if (get().sessionLoaded && typeof window !== 'undefined' && get().user === null && localStorage.getItem('pos_custom_user')) { // --- CHANGED to localStorage ---
            // Handle edge case where initial state might be null but localStorage has data later
            const userFromStorage = getUserFromStorage();
            set({ user: userFromStorage });
        }
    }
}));

// Trigger hydrate on the client-side after initial load
if (typeof window !== 'undefined') {
    // Timeout helps ensure React hydration is complete before Zustand hydration check
    setTimeout(() => useStore.getState().hydrate(), 1);
}


export default useStore;