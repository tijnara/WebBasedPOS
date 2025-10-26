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
    token: getTokenFromStorage(),
    user: getUserFromStorage(),
    userId: null,
    isAuthReady: true,
    products: [],
    customers: [],
    sales: [],
    currentSale: {},
    currentCustomer: null,
    loading: { products: true, customers: true, sales: true },
    toasts: [],

    // setters
    setProducts: (products) => set({ products, loading: { ...get().loading, products: false } }),
    setCustomers: (customers) => set({ customers, loading: { ...get().loading, customers: false } }),
    setSales: (sales) => set({ sales, loading: { ...get().loading, sales: false } }),
    setCurrentCustomer: (cust) => set({ currentCustomer: cust }),
    setLoading: (key, val) => set({ loading: { ...get().loading, [key]: val } }),

    addItemToSale: (product, quantity = 1, overridePrice = null) =>
        set((state) => {
            const price = parseFloat(overridePrice !== null ? overridePrice : product.price || 0);
            if (isNaN(price)) {
                console.error("Invalid price for product:", product);
                return {}; // Prevent adding item with invalid price
            }

            // Use product.id and price to create a unique key for items with potentially different prices (e.g., discounts)
            // If overridePrice isn't used often, just product.id might be sufficient as the key.
            const key = `${product.id}__${price.toFixed(2)}`;
            const existing = state.currentSale[key];

            // Calculate new quantity, ensuring it doesn't go below 0
            const currentQty = existing ? existing.quantity : 0;
            const newQty = Math.max(0, currentQty + quantity); // Use Math.max to prevent negative quantity

            // If the new quantity is 0 or less, remove the item
            if (newQty <= 0) {
                // Create a new object excluding the key to be removed
                const { [key]: _, ...rest } = state.currentSale;
                return { currentSale: rest };
            }

            // Otherwise, update or add the item
            return {
                currentSale: {
                    ...state.currentSale,
                    [key]: {
                        productId: product.id,
                        name: product.name,
                        price, // Store the numeric price
                        quantity: newQty
                    }
                }
            };
        }),

    // Function to remove an item completely, regardless of quantity
    removeItemFromSale: (key) => set((state) => {
        const { [key]: _, ...rest } = state.currentSale;
        return { currentSale: rest };
    }),

    clearSale: () => set({ currentSale: {}, currentCustomer: null }),

    // Renamed to getSubtotalAmount for clarity
    getTotalAmount: () => { // This calculates subtotal before tax
        const sale = get().currentSale;
        return Object.values(sale).reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    // toasts
    addToast: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: Date.now() }] })),
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter(x => x.id !== id) })),

    // auth
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

    fetchUser: async () => {
        try {
            const response = await fetch('http://localhost:8055/items/users');
            const data = await response.json();
            if (data?.data?.length) {
                set({ user: data.data[0] });
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        }
    },
}));

export default useStore;