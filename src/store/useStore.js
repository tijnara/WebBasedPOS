import { create } from 'zustand';

const getTokenFromStorage = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('pos_token');
    }
    return null;
};

const getUserFromStorage = () => {
    if (typeof window !== 'undefined') {
        const user = localStorage.getItem('pos_user');
        return user ? JSON.parse(user) : null;
    }
    return null;
};

export const useStore = create((set, get) => ({
    // --- Auth State (Keep) ---
    token: getTokenFromStorage(),
    user: getUserFromStorage(),
    isAuthReady: true, // This seems to be set to true always, might be legacy

    // --- Server State (REMOVED) ---
    // products: [],
    // customers: [],
    // sales: [],
    // loading: { products: true, customers: true, sales: true },

    // --- UI / Cart State (Keep) ---
    currentSale: {},
    currentCustomer: null,
    toasts: [],

    // --- Setters (Keep Cart/Customer/Toast) ---
    // REMOVED: setProducts, setCustomers, setSales, setLoading
    setCurrentCustomer: (cust) => set({ currentCustomer: cust }),

    addItemToSale: (product, quantity = 1, overridePrice = null) =>
        set((state) => {
            const price = parseFloat(overridePrice !== null ? overridePrice : product.price || 0);
            if (isNaN(price)) {
                console.error("Invalid price for product:", product);
                return {}; // Prevent adding item with invalid price
            }

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
                        quantity: newQty
                    }
                }
            };
        }),

    removeItemFromSale: (key) => set((state) => {
        const { [key]: _, ...rest } = state.currentSale;
        return { currentSale: rest };
    }),

    clearSale: () => set({ currentSale: {}, currentCustomer: null }),

    getTotalAmount: () => {
        const sale = get().currentSale;
        return Object.values(sale).reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    // --- Toasts (Keep) ---
    addToast: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: Date.now() }] })),
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter(x => x.id !== id) })),

    // --- Auth (Keep) ---
    setAuth: (token, user) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('pos_token', token);
            localStorage.setItem('pos_user', JSON.stringify(user));
        }
        set({ token, user });
    },

    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('pos_token');
            localStorage.removeItem('pos_user');
        }
        set({ token: null, user: null });
    },

    // REMOVED: fetchUser (this should be done with a useQuery hook, e.g., useUser)
}));

export default useStore;