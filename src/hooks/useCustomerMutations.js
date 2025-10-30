import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

const customersKey = ['customers'];

// --- Hook for GETTING Customers ---
export function useCustomers() {
    return useQuery({
        queryKey: customersKey,
        queryFn: async () => {
            try {
                // Fetch all customers from Supabase, order by name
                const { data, error } = await supabase
                    .from('customers')
                    .select('id, name, email, phone, created_at') // Select the correct date column
                    .order('name', { ascending: true });

                if (error) {
                    // Intentionally rethrow for React Query error handling
                    throw error;
                }

                const responseData = data;
                if (!responseData || !Array.isArray(responseData)) {
                    return [];
                }

                // Return mapped data directly
                return responseData.map(c => ({
                    id: c.id,
                    name: c.name || 'Unnamed Customer',
                    email: c.email || 'N/A',
                    phone: c.phone || 'N/A',
                    dateAdded: c.created_at ? new Date(c.created_at) : null,
                }));
            } catch(error) {
                // Intentionally rethrow for React Query error handling
                throw error;
            }
        },
    });
}

// --- Hook for UPDATING Customers ---
export function useUpdateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (customer) => {
            const { id, dateAdded, ...payload } = customer;
            const { data, error } = await supabase
                .from('customers')
                .update(payload)
                .eq('id', id)
                .select('id, name, email, phone, created_at')
                .single();
            if (error) {
                // Intentionally rethrow for React Query error handling
                throw error;
            }
            return { ...data, dateAdded: data.created_at ? new Date(data.created_at) : null };
        },
        onMutate: async (updatedCustomer) => {
            await queryClient.cancelQueries({ queryKey: customersKey });
            const previousCustomers = queryClient.getQueryData(customersKey);
            queryClient.setQueryData(customersKey, (old = []) =>
                old.map((c) => (c.id === updatedCustomer.id ? { ...c, ...updatedCustomer } : c))
            );
            return { previousCustomers };
        },
        onError: (err, updatedCustomer, context) => {
            if (context?.previousCustomers) {
                queryClient.setQueryData(customersKey, context.previousCustomers);
            }
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
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', customerId);
            if (error) {
                // Intentionally rethrow for React Query error handling
                throw error;
            }
            return customerId;
        },
        onMutate: async (customerId) => {
            await queryClient.cancelQueries({ queryKey: customersKey });
            const previousCustomers = queryClient.getQueryData(customersKey);
            queryClient.setQueryData(customersKey, (old = []) =>
                old.filter((c) => c.id !== customerId)
            );
            return { previousCustomers };
        },
        onError: (err, customerId, context) => {
            if (context?.previousCustomers) {
                queryClient.setQueryData(customersKey, context.previousCustomers);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: customersKey });
        },
    });
}