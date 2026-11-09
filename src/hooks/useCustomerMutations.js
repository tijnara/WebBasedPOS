// src/hooks/useCustomerMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';

// The base key used for invalidation
const customersKey = ['customers'];

// --- Hook for CREATING or MERGING to Existing Customer ---
export function useSaveCustomerEntry() {
    const queryClient = useQueryClient();
    const currentUserId = useStore(s => s.user?.id);
    const currentUser = useStore(s => s.user);

    return useMutation({
        mutationFn: async ({
                               mode = 'new', // 'new' | 'existing'
                               existingCustomerId = null,
                               name,
                               phone,
                               address,
                               email,
                               linkSales = true
                           }) => {
            let targetCustomerId = existingCustomerId;
            let customerName = name?.trim() || '';

            // 1. ADD NEW CUSTOMER
            if (mode === 'new') {
                if (!customerName) throw new Error('Customer name is required.');

                const payload = {
                    name: customerName,
                    phone: phone?.trim() || null,
                    address: address?.trim() || null,
                    email: email?.trim() || null,
                    created_by: currentUserId || null,
                    created_at: new Date().toISOString(),
                    credit_balance: 0,
                    status: 'Active',
                    is_active: true
                };

                const { data: newCust, error: insertErr } = await supabase
                    .from('customers')
                    .insert([payload])
                    .select()
                    .single();

                if (insertErr) throw insertErr;
                targetCustomerId = newCust.id;
                customerName = newCust.name;

                logActivity({
                    user: currentUser,
                    action: 'CREATE',
                    entity_type: 'CUSTOMER',
                    description: `Registered new customer: ${customerName}`
                });
            }
            // 2. ADD / MERGE TO EXISTING CUSTOMER
            else {
                if (!targetCustomerId) throw new Error('Please select an existing customer account.');

                const updates = {};
                if (phone !== undefined && phone !== null && phone.trim()) updates.phone = phone.trim();
                if (address !== undefined && address !== null && address.trim()) updates.address = address.trim();
                if (email !== undefined && email !== null && email.trim()) updates.email = email.trim();
                updates.status = 'Active';
                updates.is_active = true;

                if (Object.keys(updates).length > 0) {
                    const { error: updateErr } = await supabase
                        .from('customers')
                        .update(updates)
                        .eq('id', targetCustomerId);

                    if (updateErr) throw updateErr;
                }

                logActivity({
                    user: currentUser,
                    action: 'UPDATE',
                    entity_type: 'CUSTOMER',
                    description: `Merged/updated customer profile #${targetCustomerId} (${customerName})`
                });
            }

            // 3. Retroactively link past unlinked sales matching customer name
            let linkedSalesCount = 0;
            if (linkSales && customerName && targetCustomerId) {
                const { data: updatedSales, error: salesErr } = await supabase
                    .from('sales')
                    .update({ customerid: targetCustomerId })
                    .is('customerid', null)
                    .ilike('customername', customerName)
                    .select('id');

                if (!salesErr && updatedSales) {
                    linkedSalesCount = updatedSales.length;
                }
            }

            return { customerId: targetCustomerId, customerName, linkedSalesCount };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customersKey });
            queryClient.invalidateQueries({ queryKey: ['customers-all-lookup'] });
            queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
            queryClient.invalidateQueries({ queryKey: ['missed-customers-v3'] });
            queryClient.invalidateQueries({ queryKey: ['missed-customers-direct-audit'] });
        }
    });
}

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
                credit_balance: 0,
                status: 'Active',
                is_active: true
            };

            const { data, error } = await supabase
                .from('customers')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;

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
            queryClient.invalidateQueries({ queryKey: customersKey });
            queryClient.invalidateQueries({ queryKey: ['customers-all-lookup'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}

// --- Hook for UPDATING Customers ---
export function useUpdateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (customer) => {
            const { id, dateAdded, ...payload } = customer;
            const { data, error } = await supabase
                .from('customers')
                .update(payload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

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
            queryClient.invalidateQueries({ queryKey: ['customers-all-lookup'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}

// --- Hook for DELETING Customers ---
export function useDeleteCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (customerId) => {
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
            queryClient.invalidateQueries({ queryKey: ['customers-all-lookup'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}

// --- Hook for REPAYING Debt (Utang) ---
export function useRepayDebt() {
    const queryClient = useQueryClient();
    const addToast = useStore(s => s.addToast);

    return useMutation({
        mutationFn: async ({ customerId, amount }) => {
            const { data: customer } = await supabase
                .from('customers')
                .select('name')
                .eq('id', customerId)
                .single();

            const { error } = await supabase.rpc('update_customer_credit', {
                p_customer_id: customerId,
                p_amount: -Math.abs(amount)
            });

            if (error) throw error;

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