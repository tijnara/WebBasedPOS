// src/hooks/useProductMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';

const productsKey = ['products'];

// --- Hook for CREATING Products ---
export function useCreateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newProduct) => {
            const currentUser = useStore.getState().user;
            const storeId = Number(newProduct?.store_id || currentUser?.store_id) || 1;
            const now = new Date().toISOString();

            const payload = {
                store_id: storeId,
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
            const currentUser = useStore.getState().user;
            const storeId = Number(currentUser?.store_id) || 1;
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

            Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

            const { data, error } = await supabase
                .from('products')
                .update(dbPayload)
                .eq('id', id)
                .eq('store_id', storeId)
                .select()
                .single();
            if (error) throw error;

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
            const currentUser = useStore.getState().user;
            const storeId = Number(currentUser?.store_id) || 1;

            const { data: productToDelete } = await supabase
                .from('products')
                .select('name')
                .eq('id', productId)
                .eq('store_id', storeId)
                .single();

            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId)
                .eq('store_id', storeId);
            if (error) throw error;

            if (productToDelete) {
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