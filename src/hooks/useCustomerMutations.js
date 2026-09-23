// src/hooks/useCustomerMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';

// The base key used for invalidation
const customersKey = ['customers'];

// --- Hook for CREATING Customers ---
export function useCreateCustomer() {
    const queryClient = useQueryClient();
    const currentUserId = useStore(s => s.user?.id);

    return useMutation({
        mutationFn: async (customerPayload) => {
            const capitalizeFirst = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

            const payload = {
                name: capitalizeFirst(customerPayload.name),
                email: customerPayload.email || null,
                phone: customerPayload.phone || null,
                address: customerPayload.address || null,
                created_at: customerPayload.created_at || new Date().toISOString(),
                created_by: currentUserId || null,
                credit_balance: 0 // Initialize with 0 credit
            };

            const { data, error } = await supabase
                .from('customers')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;

            // --- Log Activity ---
            const currentUser = useStore.getState().user;
            logActivity({
                user: currentUser,
                action: 'CREATE',
                entity_type: 'CUSTOMER',
                description: `Registered new customer: ${payload.name}`
            });

            return data;
        },
        onSuccess: () => {
            // Invalidate all customer queries (lists, search results, etc.)
            queryClient.invalidateQueries({ queryKey: customersKey });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}

// --- Hook for UPDATING Customers ---
export function useUpdateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (customer) => {
            const { id, dateAdded, ...payload } = customer; // Exclude UI-only fields
            const { data, error } = await supabase
                .from('customers')
                .update(payload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // --- Log Activity ---
            const currentUser = useStore.getState().user;
            logActivity({
                user: currentUser,
                action: 'UPDATE',
                entity_type: 'CUSTOMER',
                description: `Updated customer details for: ${payload.name || `ID #${id}`}`
            });

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customersKey });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}

// --- Hook for DELETING Customers ---
export function useDeleteCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (customerId) => {
            // Fetch customer name first for the log
            const { data: customerToDelete } = await supabase
                .from('customers')
                .select('name')
                .eq('id', customerId)
                .single();

            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', customerId);

            if (error) throw error;

            // --- Log Activity ---
            if (customerToDelete) {
                const currentUser = useStore.getState().user;
                logActivity({
                    user: currentUser,
                    action: 'DELETE',
                    entity_type: 'CUSTOMER',
                    description: `Deleted customer profile: ${customerToDelete.name}`
                });
            }

            return customerId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customersKey });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}

// --- NEW: Hook for REPAYING Debt (Utang) ---
export function useRepayDebt() {
    const queryClient = useQueryClient();
    const addToast = useStore(s => s.addToast);

    return useMutation({
        mutationFn: async ({ customerId, amount }) => {
            // Fetch customer name first for the log context
            const { data: customer } = await supabase
                .from('customers')
                .select('name')
                .eq('id', customerId)
                .single();

            // Call the RPC function to deduct amount (pass negative value to reduce debt)
            // Ensure you have created the 'update_customer_credit' RPC function in Supabase
            const { error } = await supabase.rpc('update_customer_credit', {
                p_customer_id: customerId,
                p_amount: -Math.abs(amount)
            });

            if (error) throw error;

            // --- Log Activity ---
            const currentUser = useStore.getState().user;
            logActivity({
                user: currentUser,
                action: 'UPDATE',
                entity_type: 'CUSTOMER',
                description: `Recorded debt payment of ₱${amount} for ${customer?.name || `Customer #${customerId}`}`
            });

            return { customerId, amount };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customersKey });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
            addToast({ title: 'Payment Recorded', description: `Credit balance updated successfully.`, variant: 'success' });
        },
        onError: (error) => {
            console.error(error);
            addToast({ title: 'Error', description: error.message || 'Failed to record payment.', variant: 'destructive' });
        }
    });
}