// src/store/useStore.js
import { create } from 'zustand';
import api from '../lib/api'; // Import the updated api functions

export const useStore = create((set, get) => ({
    // --- Auth State (Updated for Supabase) ---
    user: null, // Stores the Supabase user object (from auth.users)
    profile: null, // Stores additional profile data (from your 'profiles' table)
    session: null, // Stores the Supabase session object
    sessionLoaded: false, // Tracks if the initial session check is done

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
                return {}; // Prevent adding item with invalid price
            }

            const key = `${product.id}__${price.toFixed(2)}`; // Use product ID + price as key
            const existing = state.currentSale[key];

            const currentQty = existing ? existing.quantity : 0;
            const newQty = Math.max(0, currentQty + quantity); // Ensure quantity doesn't go below 0

            // If new quantity is 0 or less, remove the item
            if (newQty <= 0) {
                const { [key]: _, ...rest } = state.currentSale;
                console.log(`Removing item ${key} from sale.`);
                return { currentSale: rest };
            }

            // Otherwise, add or update the item
            console.log(`Adding/Updating item ${key} to quantity ${newQty}.`);
            return {
                currentSale: {
                    ...state.currentSale,
                    [key]: {
                        productId: product.id,
                        name: product.name,
                        price, // Use the calculated price
                        quantity: newQty
                    }
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

    // --- Toasts (Keep) ---
    addToast: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: Date.now() }] })),
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter(x => x.id !== id) })),

    // --- Auth (Updated for Supabase) ---
    // Called after successful login OR when session is checked/refreshed
    setAuth: (user, session, profile) => {
        // Supabase handles session persistence automatically via localStorage
        console.log("Store: Setting Auth State", { user, session, profile });
        set({ user, session, profile, sessionLoaded: true }); // Mark session as loaded
    },

    // Checks the current Supabase session and fetches profile
    checkSession: async () => {
        // Prevent multiple checks running concurrently if called rapidly
        if (get().sessionLoaded && get().session !== undefined) {
            // console.log("Store: Session check already performed or in progress.");
            // return; // Or maybe allow re-check? Depends on logic. Re-checking is safer.
        }
        set({ sessionLoaded: false }); // Indicate checking has started

        try {
            const { session, user } = await api.getCurrentSession();
            let profile = null;
            if (user) {
                profile = await api.getUserProfile(user.id);
            }
            console.log("Store: Checked session, calling setAuth", { user, session, profile });
            get().setAuth(user, session, profile); // Use setAuth to update state
        } catch (error) {
            console.error("Store: Error in checkSession:", error);
            // Ensure sessionLoaded is true even on error, and clear auth state
            set({ user: null, session: null, profile: null, sessionLoaded: true });
        }
    },

    // Logs the user out
    logout: async () => {
        try {
            await api.logout();
            console.log("Store: Logout successful, clearing state.");
            set({ user: null, session: null, profile: null });
        } catch (error) {
            console.error("Store: Logout failed:", error);
            get().addToast({ title: 'Logout Error', description: error.message, variant: 'destructive' });
        }
    },

}));

export default useStore;