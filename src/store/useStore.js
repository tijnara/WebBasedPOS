// src/store/useStore.js
import { create } from 'zustand';
import api from '../lib/api'; // Ensure this points to your updated api.js

// Persistence for the custom user object (using localStorage)
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
                    // Add other relevant fields like 'role' if applicable, but NEVER password
                };
                localStorage.setItem('pos_custom_user', JSON.stringify(userToStore));
                console.log("Store: Persisted user to localStorage", userToStore);
            } else {
                localStorage.removeItem('pos_custom_user');
                console.log("Store: Removed user from localStorage");
            }
        } catch (error) {
            console.error("Store: Error persisting user to localStorage", error);
        }
    }
};

const getUserFromStorage = () => {
    // Ensure running on client-side
    if (typeof window !== 'undefined') {
        const userJson = localStorage.getItem('pos_custom_user');
        if (!userJson) return null;
        try {
            const user = JSON.parse(userJson);
            console.log("Store: Loaded user from localStorage", user);
            // Basic validation of stored data
            if (user && user.id && user.email) {
                return user;
            } else {
                console.warn("Store: Invalid user data found in localStorage, clearing.");
                localStorage.removeItem('pos_custom_user');
                return null;
            }
        } catch (e) {
            console.error("Store: Failed to parse user from localStorage", e);
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
    sessionLoaded: typeof window !== 'undefined' ? true : false,

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
            const key = `${product.id}__${price.toFixed(2)}`; // Unique key per product & price combo
            const existing = state.currentSale[key];
            const currentQty = existing ? existing.quantity : 0;
            const newQty = Math.max(0, currentQty + quantity); // Don't allow negative quantity
            if (newQty <= 0) {
                const { [key]: _, ...rest } = state.currentSale;
                console.log(`Store: Removing item ${key} from sale.`);
                return { currentSale: rest };
            }
            console.log(`Store: Adding/Updating item ${key} to quantity ${newQty}.`);
            return {
                currentSale: {
                    ...state.currentSale,
                    [key]: { productId: product.id, name: product.name, price, quantity: newQty }
                }
            };
        }),
    removeItemFromSale: (key) => set((state) => {
        console.log(`Store: Removing item ${key} explicitly.`);
        const { [key]: _, ...rest } = state.currentSale;
        return { currentSale: rest };
    }),
    clearSale: () => {
        console.log("Store: Clearing current sale and customer.");
        set({ currentSale: {}, currentCustomer: null });
    },
    getTotalAmount: () => {
        const sale = get().currentSale;
        return Object.values(sale).reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    addToast: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: Date.now() + Math.random() }] })), // Added random for better key uniqueness
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter(x => x.id !== id) })),

    // --- Auth (Updated for Custom Login) ---
    // Called after successful custom table login
    setAuth: (user) => {
        console.log("Store: Setting custom user state", user);
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
            console.log("Store: Logout successful, clearing custom user state.");
            persistUserToStorage(null); // Remove user from localStorage
            set({ user: null }); // Clear user state
        } catch (error) {
            console.error("Store: Logout failed:", error);
            get().addToast({ title: 'Logout Error', description: error.message || 'Logout failed.', variant: 'destructive' });
        }
    },
    // Function to ensure sessionLoaded is true after initial client-side hydration
    hydrate: () => {
        // This function now primarily ensures the store knows it's running client-side
        // and has attempted to load the initial user state from localStorage.
        if (!get().sessionLoaded && typeof window !== 'undefined') {
            console.log("Store: Hydrating sessionLoaded state on client.");
            // Try loading from storage again in case initialUser was null server-side
            const userFromStorage = getUserFromStorage();
            set({ sessionLoaded: true, user: userFromStorage });
        } else if (get().sessionLoaded && typeof window !== 'undefined' && get().user === null && localStorage.getItem('pos_custom_user')) {
            // Handle edge case where initial state might be null but localStorage has data later
            console.warn("Store: Re-hydrating user state from localStorage.");
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