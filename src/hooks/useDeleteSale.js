// src/hooks/useDeleteSale.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';

export function useDeleteSale() {
    const queryClient = useQueryClient();
    const { addToast, user } = useStore();

    return useMutation({
        mutationFn: async ({ saleId, reason }) => {
            // 0. Fetch sale details BEFORE deletion for activity logging
            const { data: saleToDelete } = await supabase
                .from('sales')
                .select('customername, totalamount')
                .eq('id', saleId)
                .single();

            // 1. Fetch items to identify what to restore
            const { data: items, error: fetchError } = await supabase
                .from('sale_items')
                .select('product_id, quantity, product_name')
                .eq('sale_id', saleId);

            if (fetchError) throw fetchError;

            // 2. Restore Inventory and Log Stock Movements
            if (items && items.length > 0) {
                for (const item of items) {
                    // Restore stock quantity
                    const { error: stockError } = await supabase.rpc('increment_stock', {
                        p_product_id: item.product_id,
                        p_quantity: item.quantity
                    });

                    if (stockError) console.error(`Stock restore failed for ${item.product_name}`);

                    // Log restoration in audit trail (stock_movements)
                    await supabase.from('stock_movements').insert({
                        product_id: item.product_id,
                        quantity_change: item.quantity,
                        type: 'correction', // or 'cancellation'
                        staff_id: user?.id,
                        remarks: `Sale ${saleId} deleted. Reason: ${reason}`
                    });
                }
            }

            // 3. Delete records (Line items must go first due to FK constraints)
            const { error: itemsDeleteError } = await supabase
                .from('sale_items')
                .delete()
                .eq('sale_id', saleId);

            if (itemsDeleteError) throw itemsDeleteError;

            const { error: saleError } = await supabase
                .from('sales')
                .delete()
                .eq('id', saleId);

            if (saleError) throw saleError;

            // 4. Fire activity log
            if (saleToDelete) {
                const currentUser = useStore.getState().user;
                logActivity({
                    user: currentUser,
                    action: 'DELETE',
                    entity_type: 'SALE',
                    description: `Voided sale #${saleId} for ${saleToDelete.customername || 'Walk-in'} (₱${saleToDelete.totalamount}). Reason: ${reason}`
                });
            }

            return saleId;
        },
        onSuccess: () => {
            // Invalidate queries to refresh UI across Dashboard, POS, and Reports
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['spoilage-report'] });

            addToast({
                title: 'Transaction deleted successfully',
                description: 'Inventory has been updated.',
                variant: 'success'
            });
        },
        onError: (error) => {
            addToast({ title: 'Delete Failed', description: error.message, variant: 'destructive' });
        }
    });
}