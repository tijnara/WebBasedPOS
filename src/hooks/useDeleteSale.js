// src/hooks/useDeleteSale.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function useDeleteSale() {
    const queryClient = useQueryClient();
    const addToast = useStore(s => s.addToast);

    return useMutation({
        mutationFn: async (saleId) => {
            // First, delete associated line items
            const { error: itemsError } = await supabase
                .from('sale_items')
                .delete()
                .eq('sale_id', saleId);

            if (itemsError) throw itemsError;

            // Then, delete the main sale record
            const { error: saleError } = await supabase
                .from('sales')
                .delete()
                .eq('id', saleId);

            if (saleError) throw saleError;
            return saleId;
        },
        onSuccess: () => {
            // Refresh lists and summary totals
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
            addToast({
                title: 'Transaction Deleted',
                description: 'The record has been removed from the database.',
                variant: 'success'
            });
        },
        onError: (error) => {
            addToast({
                title: 'Delete Failed',
                description: error.message,
                variant: 'destructive'
            });
        }
    });
}