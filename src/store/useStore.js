// src/store/useStore.js
import { create } from 'zustand';
import api from '../lib/api';

// Optional: Basic persistence for the custom user object (not secure like a session)
const persistUserToStorage = (user) => {
    if (typeof window !== 'undefined') {
        if (user) {
            // Only store necessary, non-sensitive user info
            const userToStore = {
                id: user.id,
                name: user.name,
                email: user.email,
                // Add other relevant fields like 'role' if applicable, but NOT password
            };
            localStorage.setItem('pos_custom_user', JSON.stringify(userToStore));
            console.log("Store: Persisted user to localStorage", userToStore);
        } else {
            localStorage.removeItem('pos_custom_user');
            console.log("Store: Removed user from localStorage");
        }
    }
};

const getUserFromStorage = () => {
    if (typeof window !== 'undefined') {
        const userJson = localStorage.getItem('pos_custom_user');
        if (!userJson) return null;
        try {
            const user = JSON.parse(userJson);
            console.log("Store: Loaded user from localStorage", user);
            return user;
        } catch (e) {
            console.error("Store: Failed to parse user from localStorage", e);
            localStorage.removeItem('pos_custom_user'); // Clear invalid data
            return null;
        }
    }
    return null;
};


export const useStore = create((set, get) => ({
    // --- Auth State (Updated for Custom User Object) ---
    user: getUserFromStorage(), // Load initial user from storage if persisted
    // profile: null, // Removed - assuming user object from 'users' table has all needed info
    // session: null, // Removed - No Supabase session
    // Set to true immediately - no async session check needed, but check if user exists from storage
    sessionLoaded: true, // Renamed from sessionLoaded for clarity, indicates initial state is ready


    // --- UI / Cart State (Keep) ---
    currentSale: {},
    currentCustomer: null,
    toasts: [],

    // --- Setters (Keep Cart/Customer/Toast) ---
    setCurrentCustomer: (cust) => set({ currentCustomer: cust }),
    addItemToSale: (product, quantity = 1, overridePrice = null) =>
        set((state) => {
            const price = parseFloat(overridePrice !== null ? overridePrice : product.price || 0);
            if (isNaN(price)) {
                console.error("Invalid price for product:", product);
                return {};
            }
            const key = `${product.id}__${price.toFixed(2)}`;
            const existing = state.currentSale[key];
            const currentQty = existing ? existing.quantity : 0;
            const newQty = Math.max(0, currentQty + quantity);
            if (newQty <= 0) {
                const { [key]: _, ...rest } = state.currentSale;
                console.log(`Removing item ${key} from sale.`);
                return { currentSale: rest };
            }
            console.log(`Adding/Updating item ${key} to quantity ${newQty}.`);
            return {
                currentSale: {
                    ...state.currentSale,
                    [key]: { productId: product.id, name: product.name, price, quantity: newQty }
                }
            };
        }),
    removeItemFromSale: (key) => set((state) => {
        console.log(`Removing item ${key} explicitly.`);
        const { [key]: _, ...rest } = state.currentSale;
        return { currentSale: rest };
    }),
    clearSale: () => {
        console.log("Clearing current sale and customer.");
        set({ currentSale: {}, currentCustomer: null });
    },
    getTotalAmount: () => {
        const sale = get().currentSale;
        return Object.values(sale).reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    addToast: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: Date.now() }] })),
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter(x => x.id !== id) })),

    // --- Auth (Updated for Custom Login) ---
    // Called after successful custom table login
    setAuth: (user) => {
        console.log("Store: Setting custom user state", user);
        persistUserToStorage(user); // Persist user to localStorage
        // No session to set, just the user object from your 'users' table
        set({ user, sessionLoaded: true }); // Ensure sessionLoaded remains true
    },

    // checkSession is no longer needed as there's no external session to check
    // checkSession: async () => { ... REMOVED ... },

    // Logs the user out (client-side state clearing only)
    logout: async () => {
        try {
            // Call the simplified api.logout (which does nothing async)
            await api.logout();
            console.log("Store: Logout successful, clearing custom user state.");
            persistUserToStorage(null); // Remove user from localStorage
            set({ user: null }); // Clear user state
        } catch (error) {
            // Should not happen with the simplified logout, but keep for safety
            console.error("Store: Logout failed:", error);
            get().addToast({ title: 'Logout Error', description: error.message, variant: 'destructive' });
        }
    },
}));

export default useStore;