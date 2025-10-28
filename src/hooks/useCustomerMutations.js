import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

const customersKey = ['customers'];

// --- Hook for GETTING Customers ---
export function useCustomers() {
    return useQuery({
        queryKey: customersKey,
        queryFn: async () => {
            console.log('useCustomers: Fetching...');
            try {
                // Fetch all customers from Supabase, order by name
                const { data, error } = await supabase
                    .from('customers')
                    .select('id, name, email, phone, created_at') // Select the correct date column
                    .order('name', { ascending: true });

                if (error) throw error;

                const responseData = data;
                console.log('useCustomers: API Response:', responseData);

                if (!responseData || !Array.isArray(responseData)) {
                    console.error('useCustomers: Invalid response data structure:', responseData);
                    return [];
                }

                // Map data
                const mappedData = responseData.map(c => ({
                    id: c.id,
                    name: c.name || 'Unnamed Customer',
                    email: c.email || 'N/A',
                    phone: c.phone || 'N/A',
                    // FIX: Map created_at to dateAdded
                    dateAdded: c.created_at ? new Date(c.created_at) : null,
                }));
                console.log('useCustomers: Mapped Data:', mappedData);
                return mappedData;

            } catch(error) {
                console.error('useCustomers: Error fetching data:', error);
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
            // Exclude the mapped 'dateAdded' from the update payload
            const { id, dateAdded, ...payload } = customer;

            console.log('useUpdateCustomer: Updating ID', id, 'with payload:', payload);
            const { data, error } = await supabase
                .from('customers')
                .update(payload)
                .eq('id', id)
                .select('id, name, email, phone, created_at') // Select created_at
                .single();

            if (error) {
                console.error('useUpdateCustomer: Supabase error:', error);
                throw error;
            }
            console.log('useUpdateCustomer: Update successful:', data);
            // Map created_at to dateAdded in the response
            return { ...data, dateAdded: data.created_at ? new Date(data.created_at) : null };
        },
        // Optimistic Updates
        onMutate: async (updatedCustomer) => {
            await queryClient.cancelQueries({ queryKey: customersKey });
            const previousCustomers = queryClient.getQueryData(customersKey);

            queryClient.setQueryData(customersKey, (old = []) =>
                old.map((c) => (c.id === updatedCustomer.id ? { ...c, ...updatedCustomer } : c)) // Optimistically update
            );
            console.log('useUpdateCustomer: Optimistic update applied for ID:', updatedCustomer.id);
            return { previousCustomers };
        },
        onError: (err, updatedCustomer, context) => {
            console.error('useUpdateCustomer: Mutation error, rolling back optimistic update for ID:', updatedCustomer.id, err);
            if (context?.previousCustomers) {
                queryClient.setQueryData(customersKey, context.previousCustomers);
            }
        },
        onSettled: (data, error, updatedCustomer) => {
            console.log('useUpdateCustomer: Mutation settled for ID:', updatedCustomer.id, 'Refetching customers.');
            queryClient.invalidateQueries({ queryKey: customersKey });
        },
    });
}

// --- Hook for DELETING Customers ---
export function useDeleteCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (customerId) => {
            // ... (delete logic remains the same) ...
            console.log('useDeleteCustomer: Deleting ID:', customerId);
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', customerId);

            if (error) {
                console.error('useDeleteCustomer: Supabase error:', error);
                throw error;
            }
            console.log('useDeleteCustomer: Delete successful for ID:', customerId);
            return customerId;
        },
        // Optimistic Updates
        onMutate: async (customerId) => {
            // ... (optimistic mutate logic remains the same) ...
            await queryClient.cancelQueries({ queryKey: customersKey });
            const previousCustomers = queryClient.getQueryData(customersKey);
            queryClient.setQueryData(customersKey, (old = []) =>
                old.filter((c) => c.id !== customerId)
            );
            console.log('useDeleteCustomer: Optimistic removal applied for ID:', customerId);
            return { previousCustomers };
        },
        onError: (err, customerId, context) => {
            // ... (optimistic error logic remains the same) ...
            console.error('useDeleteCustomer: Mutation error, rolling back optimistic removal for ID:', customerId, err);
            if (context?.previousCustomers) {
                queryClient.setQueryData(customersKey, context.previousCustomers);
            }
        },
        onSettled: (data, error, customerId) => {
            // ... (optimistic settled logic remains the same) ...
            console.log('useDeleteCustomer: Mutation settled for ID:', customerId, 'Refetching customers.');
            queryClient.invalidateQueries({ queryKey: customersKey });
        },
    });
}