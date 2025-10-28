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
                    .select('*')
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
                    createdAt: c.created_at ? new Date(c.created_at) : null, // Use created_at instead of date_added
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
            const { id, ...payload } = customer;
            // Ensure dateAdded is not sent back if it's a Date object from mapping
            const updatePayload = { ...payload };
            if (updatePayload.dateAdded instanceof Date) {
                delete updatePayload.dateAdded; // Let Supabase handle created_at/updated_at
            }

            console.log('useUpdateCustomer: Updating ID', id, 'with payload:', updatePayload);
            const { data, error } = await supabase
                .from('customers')
                .update(updatePayload)
                .eq('id', id)
                .select() // Select the updated row
                .single(); // Expect one row

            if (error) {
                console.error('useUpdateCustomer: Supabase error:', error);
                throw error;
            }
            console.log('useUpdateCustomer: Update successful:', data);
            return data;
        },
        // Optimistic Updates (Optional but improves UI responsiveness)
        onMutate: async (updatedCustomer) => {
            await queryClient.cancelQueries({ queryKey: customersKey });
            const previousCustomers = queryClient.getQueryData(customersKey);
            // Ensure the updated data matches the expected structure
            const optimisticUpdateData = {
                ...updatedCustomer,
                dateAdded: updatedCustomer.dateAdded instanceof Date ? updatedCustomer.dateAdded : (updatedCustomer.created_at ? new Date(updatedCustomer.created_at) : null) // Remap date if needed
            };
            queryClient.setQueryData(customersKey, (old = []) =>
                old.map((c) => (c.id === updatedCustomer.id ? optimisticUpdateData : c))
            );
            console.log('useUpdateCustomer: Optimistic update applied for ID:', updatedCustomer.id);
            return { previousCustomers };
        },
        onError: (err, updatedCustomer, context) => {
            console.error('useUpdateCustomer: Mutation error, rolling back optimistic update for ID:', updatedCustomer.id, err);
            queryClient.setQueryData(customersKey, context.previousCustomers);
        },
        // Always refetch after error or success to ensure consistency
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
            return customerId; // Return the ID for optimistic updates
        },
        // Optimistic Updates
        onMutate: async (customerId) => {
            await queryClient.cancelQueries({ queryKey: customersKey });
            const previousCustomers = queryClient.getQueryData(customersKey);
            queryClient.setQueryData(customersKey, (old = []) =>
                old.filter((c) => c.id !== customerId)
            );
            console.log('useDeleteCustomer: Optimistic removal applied for ID:', customerId);
            return { previousCustomers };
        },
        onError: (err, customerId, context) => {
            console.error('useDeleteCustomer: Mutation error, rolling back optimistic removal for ID:', customerId, err);
            queryClient.setQueryData(customersKey, context.previousCustomers);
        },
        onSettled: (data, error, customerId) => {
            console.log('useDeleteCustomer: Mutation settled for ID:', customerId, 'Refetching customers.');
            queryClient.invalidateQueries({ queryKey: customersKey });
        },
    });
}