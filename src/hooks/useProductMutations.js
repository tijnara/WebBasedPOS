import { useMutation, useQueryClient } from '@tanstack/react-query';
import directus from '../lib/directus';

const productsKey = ['products'];

// --- Hook for CREATING Products ---
export function useCreateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newProduct) => {
            // Directus creates the ID, so we don't pass one
            const { id, ...payload } = newProduct;
            return await directus.items('products').createOne(payload);
        },
        onSuccess: () => {
            // Invalidate the 'products' query to refetch
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
            return await directus.items('products').updateOne(id, payload);
        },
        // Optimistic update
        onMutate: async (updatedProduct) => {
            await queryClient.cancelQueries({ queryKey: productsKey });
            const previousProducts = queryClient.getQueryData(productsKey);
            queryClient.setQueryData(productsKey, (old) =>
                old.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
            );
            return { previousProducts };
        },
        onError: (err, updatedProduct, context) => {
            queryClient.setQueryData(productsKey, context.previousProducts);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: productsKey });
        },
    });
}

// --- Hook for DELETING Products ---
export function useDeleteProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (productId) => {
            return await directus.items('products').deleteOne(productId);
        },
        // Optimistic update
        onMutate: async (productId) => {
            await queryClient.cancelQueries({ queryKey: productsKey });
            const previousProducts = queryClient.getQueryData(productsKey);
            queryClient.setQueryData(productsKey, (old) =>
                old.filter((p) => p.id !== productId)
            );
            return { previousProducts };
        },
        onError: (err, productId, context) => {
            queryClient.setQueryData(productsKey, context.previousProducts);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: productsKey });
        },
    });
}