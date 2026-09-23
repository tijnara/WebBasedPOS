// src/hooks/useProductMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';

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
                parent_product_id: newProduct.parent_product_id || null,
                conversion_rate: newProduct.conversion_rate || 1,
                is_hidden: newProduct.is_hidden || false,
                created_at: now,
                updated_at: now,
            };
            const { data, error } = await supabase
                .from('products')
                .insert([payload])
                .select()
                .single();
            if (error) throw error;

            // --- Log Activity ---
            const currentUser = useStore.getState().user;
            logActivity({
                user: currentUser,
                action: 'CREATE',
                entity_type: 'PRODUCT',
                description: `Created new product: ${payload.name}`
            });

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productsKey });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
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
                stock_quantity: payload.stock,
                min_stock_level: payload.minStock,
                cost_price: payload.cost,
                category: payload.category,
                parent_product_id: payload.parent_product_id,
                conversion_rate: payload.conversion_rate,
                updated_at: now,
            };

            if (payload.is_hidden !== undefined) {
                dbPayload.is_hidden = payload.is_hidden;
            }

            // Remove undefined fields so they are not sent to Supabase
            Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

            const { data, error } = await supabase
                .from('products')
                .update(dbPayload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;

            // --- Log Activity ---
            const currentUser = useStore.getState().user;
            logActivity({
                user: currentUser,
                action: 'UPDATE',
                entity_type: 'PRODUCT',
                description: `Updated product details for: ${dbPayload.name || `ID #${id}`}`
            });

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productsKey });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}

// --- Hook for DELETING Products ---
export function useDeleteProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (productId) => {
            // Fetch product name first for the log
            const { data: productToDelete } = await supabase
                .from('products')
                .select('name')
                .eq('id', productId)
                .single();

            const { error } = await supabase.from('products').delete().eq('id', productId);
            if (error) throw error;

            // --- Log Activity ---
            if (productToDelete) {
                const currentUser = useStore.getState().user;
                logActivity({
                    user: currentUser,
                    action: 'DELETE',
                    entity_type: 'PRODUCT',
                    description: `Deleted product: ${productToDelete.name}`
                });
            }

            return productId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productsKey });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}