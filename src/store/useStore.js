import { create } from 'zustand';

export const useStore = create((set, get) => ({
    userId: null,
    isAuthReady: true, // not using firebase in this port
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
            // FIX: Ensure price is a number using parseFloat
            const price = parseFloat(overridePrice !== null ? overridePrice : product.price || 0);

            const key = `${product.id}__${price.toFixed(2)}`;
            const existing = state.currentSale[key];
            const newQty = (existing ? existing.quantity : 0) + quantity;
            if (newQty <= 0) {
                const { [key]: _, ...rest } = state.currentSale;
                return { currentSale: rest };
            }
            return { currentSale: { ...state.currentSale, [key]: { productId: product.id, name: product.name, price, quantity: newQty } } };
        }),

    removeItemFromSale: (key) => set((state) => { const { [key]: _, ...rest } = state.currentSale; return { currentSale: rest }; }),
    clearSale: () => set({ currentSale: {}, currentCustomer: null }),

    getTotalAmount: () => {
        const sale = get().currentSale;
        return Object.values(sale).reduce((t, i) => t + i.price * i.quantity, 0);
    },

    // toasts
    addToast: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: Date.now() }] })),
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter(x => x.id !== id) })),
}));

export default useStore;