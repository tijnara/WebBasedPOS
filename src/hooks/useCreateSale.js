import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useCreateSale() {
    const queryClient = useQueryClient();

    return useMutation({
        // 1. The function that performs the API call
        mutationFn: async (salePayload) => {
            console.log('useCreateSale: Creating sale with payload:', salePayload);
            // The payload is the object we built in POSPage.jsx
            // Ensure items array is valid JSON or structure Supabase expects
            const payloadToInsert = {
                ...salePayload,
                // If 'items' column is JSONB, it should be fine.
                // If it's a relation, you'd handle it differently (e.g., insert items separately)
                items: salePayload.items || [] // Ensure items is an array
            };

            const { data, error } = await supabase
                .from('sales')
                .insert([payloadToInsert]) // Supabase insert expects an array
                .select() // Select the newly created row(s)
                .single(); // Expect only one row back

            if (error) {
                console.error('useCreateSale: Supabase error:', error);
                throw error; // Throw error for React Query to handle
            }
            console.log('useCreateSale: Sale creation successful:', data);
            return data; // Return the created sale data
        },

        // 2. After the mutation succeeds
        onSuccess: (data) => {
            console.log('useCreateSale: Sale created! Invalidating sales query.', data);
            // This tells TanStack Query to re-fetch the 'sales' data
            // so your History page will be up-to-date.
            queryClient.invalidateQueries({ queryKey: ['sales'] });

            // Optional: You could potentially update product stock here
            // This is complex due to potential race conditions if multiple people sell
            // Best handled server-side with triggers or functions if possible
            // Example client-side (less reliable):
            // const itemsSold = data?.items || [];
            // queryClient.setQueryData(['products'], (oldProducts = []) => {
            //   return oldProducts.map(p => {
            //      const soldItem = itemsSold.find(item => item.productId === p.id);
            //      if (soldItem) {
            //          return { ...p, stock: (p.stock || 0) - soldItem.quantity };
            //      }
            //      return p;
            //   });
            // });
        },
        onError: (error) => {
            console.error('useCreateSale: Mutation failed:', error);
            // Error toast is likely handled in the component calling the mutation
        }
    });
}