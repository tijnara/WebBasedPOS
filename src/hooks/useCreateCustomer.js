import { useMutation, useQueryClient } from '@tanstack/react-query';
import directus from '../lib/directus';

export function useCreateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        // 1. The function that performs the API call
        mutationFn: async (customerPayload) => {
            return await directus.items('customers').createOne(customerPayload);
        },

        // 2. After the mutation succeeds, refresh the customers list
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
}