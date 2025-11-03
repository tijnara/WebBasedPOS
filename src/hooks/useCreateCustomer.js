import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore'; // <-- 1. Import useStore

export function useCreateCustomer() {
    const queryClient = useQueryClient();
    const user = useStore(s => s.user); // <-- 2. Get the current user from the store

    return useMutation({
        // 1. The function that performs the API call
        mutationFn: async (customerPayload) => {
            console.log('useCreateCustomer: Creating customer with payload:', customerPayload);
            // Ensure payload matches Supabase table structure
            // Supabase typically handles 'id' and 'created_at' automatically
            const capitalizeFirst = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

            // --- MODIFIED PAYLOAD ---
            const payload = {
                name: capitalizeFirst(customerPayload.name),
                email: customerPayload.email || null, // Use null for empty optional fields
                phone: customerPayload.phone || null,
                address: customerPayload.address || null, // Added address
                created_at: customerPayload.created_at || new Date().toISOString(), // Explicitly set created_at
                created_by: user?.id || null, // <-- 3. Add the logged-in user's ID
            };
            // --- END MODIFICATION ---

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