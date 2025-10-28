import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

// Key for product queries
const productsKey = ['products'];

// --- Hook for CREATING Products ---
export function useCreateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newProduct) => {
            console.log('useCreateProduct: Creating product with payload:', newProduct);
            // Supabase handles ID generation (if primary key is identity/default)
            // Ensure payload matches table columns (e.g., name, price, category, stock)
            const payload = {
                name: newProduct.name,
                price: newProduct.price,
                category: newProduct.category,
                // Removed stock field
            };

            const { data, error } = await supabase
                .from('products')
                .insert([payload]) // Pass payload in an array
                .select()         // Select the created product
                .single();        // Expect one result

            if (error) {
                console.error('useCreateProduct: Supabase error:', error);
                throw error;
            }
            console.log('useCreateProduct: Create successful:', data);
            return data;
        },
        onSuccess: (data) => {
            console.log('useCreateProduct: Success! Invalidating products query.', data);
            // Invalidate the 'products' query to refetch the list
            queryClient.invalidateQueries({ queryKey: productsKey });
        },
        onError: (error) => {
            console.error('useCreateProduct: Mutation failed:', error);
        }
    });
}

// --- Hook for UPDATING Products ---
export function useUpdateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (product) => {
            const { id, ...payload } = product;
            console.log('useUpdateProduct: Updating ID', id, 'with payload:', payload);
            const { data, error } = await supabase
                .from('products')
                .update(payload)  // Pass the fields to update
                .eq('id', id)     // Specify which row to update using 'eq' (equals)
                .select()         // Select the updated product data
                .single();        // Expect one result

            if (error) {
                console.error('useUpdateProduct: Supabase error:', error);
                throw error;
            }
            console.log('useUpdateProduct: Update successful:', data);
            return data;
        },
        // Optimistic update (optional but improves perceived performance)
        onMutate: async (updatedProduct) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: productsKey });
            // Snapshot the previous value
            const previousProducts = queryClient.getQueryData(productsKey);
            // Optimistically update to the new value
            queryClient.setQueryData(productsKey, (old = []) =>
                old.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
            );
            console.log('useUpdateProduct: Optimistic update applied for ID:', updatedProduct.id);
            // Return a context object with the snapshotted value
            return { previousProducts };
        },
        // If the mutation fails, use the context returned from onMutate to roll back
        onError: (err, updatedProduct, context) => {
            console.error('useUpdateProduct: Mutation error, rolling back optimistic update for ID:', updatedProduct.id, err);
            queryClient.setQueryData(productsKey, context.previousProducts);
        },
        // Always refetch after error or success
        onSettled: (data, error, updatedProduct) => {
            console.log('useUpdateProduct: Mutation settled for ID:', updatedProduct.id, 'Refetching products.');
            queryClient.invalidateQueries({ queryKey: productsKey });
        },
    });
}

// --- Hook for DELETING Products ---
export function useDeleteProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (productId) => {
            console.log('useDeleteProduct: Deleting ID:', productId);
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId); // Specify which row to delete

            if (error) {
                console.error('useDeleteProduct: Supabase error:', error);
                throw error;
            }
            console.log('useDeleteProduct: Delete successful for ID:', productId);
            // Delete doesn't return data by default in Supabase, return the id
            return productId;
        },
        // Optimistic update
        onMutate: async (productId) => {
            await queryClient.cancelQueries({ queryKey: productsKey });
            const previousProducts = queryClient.getQueryData(productsKey);
            // Optimistically remove the product from the list
            queryClient.setQueryData(productsKey, (old = []) =>
                old.filter((p) => p.id !== productId)
            );
            console.log('useDeleteProduct: Optimistic removal applied for ID:', productId);
            return { previousProducts };
        },
        onError: (err, productId, context) => {
            console.error('useDeleteProduct: Mutation error, rolling back optimistic removal for ID:', productId, err);
            queryClient.setQueryData(productsKey, context.previousProducts);
        },
        onSettled: (data, error, productId) => {
            console.log('useDeleteProduct: Mutation settled for ID:', productId, 'Refetching products.');
            queryClient.invalidateQueries({ queryKey: productsKey });
        },
    });
}