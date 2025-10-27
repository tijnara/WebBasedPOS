import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import directus from '../lib/directus';
import { useCreateCustomer } from './useCreateCustomer'; // We already made this!

const customersKey = ['customers'];

// --- Hook for GETTING Customers ---
export function useCustomers() {
    return useQuery({
        queryKey: customersKey,
        queryFn: async () => {
            const response = await directus.items('customers').readByQuery({ limit: -1 });
            // Map data just like you did in _app.js
            return response.data.map(c => ({
                id: c.id,
                name: c.name,
                email: c.email || 'N/A',
                phone: c.phone || 'N/A',
                dateAdded: new Date(c.dateAdded)
            }));
        },
    });
}

// --- Hook for UPDATING Customers ---
export function useUpdateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (customer) => {
            const { id, ...payload } = customer;
            return await directus.items('customers').updateOne(id, payload);
        },
        onMutate: async (updatedCustomer) => {
            await queryClient.cancelQueries({ queryKey: customersKey });
            const previousCustomers = queryClient.getQueryData(customersKey);
            queryClient.setQueryData(customersKey, (old) =>
                old.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
            );
            return { previousCustomers };
        },
        onError: (err, updatedCustomer, context) => {
            queryClient.setQueryData(customersKey, context.previousCustomers);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: customersKey });
        },
    });
}

// --- Hook for DELETING Customers ---
export function useDeleteCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (customerId) => {
            return await directus.items('customers').deleteOne(customerId);
        },
        onMutate: async (customerId) => {
            await queryClient.cancelQueries({ queryKey: customersKey });
            const previousCustomers = queryClient.getQueryData(customersKey);
            queryClient.setQueryData(customersKey, (old) =>
                old.filter((c) => c.id !== customerId)
            );
            return { previousCustomers };
        },
        onError: (err, customerId, context) => {
            queryClient.setQueryData(customersKey, context.previousCustomers);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: customersKey });
        },
    });
}