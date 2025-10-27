import { useQuery } from '@tanstack/react-query';

export function useSales() {
    return useQuery({
        queryKey: ['sales'],
        queryFn: async () => {
            // Replace with your new data fetching logic
            return [];
        },
    });
}