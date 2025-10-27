import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Ensure useQuery is imported
import directus from '../lib/directus';
// Removed: import { useCreateCustomer } from './useCreateCustomer'; // Not needed in this file

const customersKey = ['customers'];

// --- Hook for GETTING Customers ---
export function useCustomers() {
    return useQuery({ // Wrap in useQuery
        queryKey: customersKey,
        queryFn: async () => {
            console.log('useCustomers: Fetching...'); // Log start
            try {
                const response = await directus.items('customers').readByQuery({ limit: -1 });
                console.log('useCustomers: API Response:', response); // Log response

                if (!response.data || !Array.isArray(response.data)) {
                    console.error('useCustomers: Invalid response data structure:', response);
                    return []; // Return empty array on invalid data
                }

                // Map data
                const mappedData = response.data.map(c => ({
                    id: c.id,
                    name: c.name || 'Unnamed Customer',
                    email: c.email || 'N/A',
                    phone: c.phone || 'N/A',
                    // Check if dateAdded exists before creating Date object
                    dateAdded: c.dateAdded ? new Date(c.dateAdded) : null
                }));
                console.log('useCustomers: Mapped Data:', mappedData); // Log mapped data
                return mappedData;

            } catch(error) {
                console.error('useCustomers: Error fetching data:', error);
                throw error; // Re-throw error
            }
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
            queryClient.setQueryData(customersKey, (old = []) => // Add default empty array
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
            queryClient.setQueryData(customersKey, (old = []) => // Add default empty array
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