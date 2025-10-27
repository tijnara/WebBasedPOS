import { useMutation, useQueryClient } from '@tanstack/react-query';
import directus from '../lib/directus';

export function useCreateSale() {
    const queryClient = useQueryClient();

    return useMutation({
        // 1. The function that performs the API call
        mutationFn: async (salePayload) => {
            // The payload is the object we built in POSPage.jsx
            return await directus.items('sales').createOne(salePayload);
        },

        // 2. After the mutation succeeds (either online or later offline)
        onSuccess: () => {
            console.log('Sale created! Invalidating sales query.');
            // This tells TanStack Query to re-fetch the 'sales' data
            // so your History page will be up-to-date.
            queryClient.invalidateQueries({ queryKey: ['sales'] });
        },
    });
}