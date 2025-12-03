import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

// Key for product queries
const productsKey = ['products'];

// --- Hook for CREATING Products ---
export function useCreateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newProduct) => {
            const now = new Date().toISOString();
            const payload = {
                name: newProduct.name,
                price: newProduct.price,
                image_url: newProduct.image_url,
                barcode: newProduct.barcode || null,
                stock_quantity: newProduct.stock || 0,
                min_stock_level: newProduct.minStock || 5,
                cost_price: newProduct.cost || 0,
                category: newProduct.category || 'Uncategorized',
                created_at: now,
                updated_at: now,
            };
            const { data, error } = await supabase
                .from('products')
                .insert([payload])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productsKey });
        },
    });
}

// --- Hook for UPDATING Products ---
export function useUpdateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (product) => {
            const { id, ...payload } = product;
            const now = new Date().toISOString();
            const dbPayload = {
                name: payload.name,
                price: payload.price,
                image_url: payload.image_url,
                barcode: payload.barcode || null,
                stock_quantity: payload.stock || 0,
                min_stock_level: payload.minStock || 5,
                cost_price: payload.cost || 0,
                category: payload.category || 'Uncategorized',
                updated_at: now,
            };
            const { data, error } = await supabase
                .from('products')
                .update(dbPayload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productsKey });
        },
    });
}

// --- Hook for DELETING Products ---
export function useDeleteProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (productId) => {
            const { error } = await supabase.from('products').delete().eq('id', productId);
            if (error) throw error;
            return productId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productsKey });
        },
    });
}