import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useCreateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        // 1. The function that performs the API call
        mutationFn: async (customerPayload) => {
            console.log('useCreateCustomer: Creating customer with payload:', customerPayload);
            // Ensure payload matches Supabase table structure
            // Supabase typically handles 'id' and 'created_at' automatically
            const payload = {
                name: customerPayload.name,
                email: customerPayload.email || null, // Use null for empty optional fields
                phone: customerPayload.phone || null,
                created_at: customerPayload.created_at || new Date().toISOString(), // Explicitly set created_at
            };

            const { data, error } = await supabase
                .from('customers')
                .insert([payload]) // Supabase expects an array
                .select()          // Select the newly created row
                .single();         // Expect only one row back

            if (error) {
                console.error('useCreateCustomer: Supabase error:', error);
                throw error; // Let React Query handle the error state
            }
            console.log('useCreateCustomer: Create successful:', data);
            return data; // Return the newly created customer data
        },

        // 2. After the mutation succeeds, refresh the customers list
        onSuccess: (data) => {
            console.log('useCreateCustomer: Success! Invalidating customers query.', data);
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
        onError: (error) => {
            console.error('useCreateCustomer: Mutation failed:', error);
        }
    });
}