import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

const customersKey = ['customers'];

const MOCK_CUSTOMERS = [
    { id: 'mock-c-1', name: 'Demo Customer A', email: 'demo.customer.a@seaside.com', phone: '09110000001', dateAdded: new Date('2025-11-01T08:00:00') },
    { id: 'mock-c-2', name: 'Demo Customer B', email: 'demo.customer.b@seaside.com', phone: '09110000002', dateAdded: new Date('2025-11-02T09:00:00') },
    { id: 'mock-c-3', name: 'Demo Customer C', email: 'demo.customer.c@seaside.com', phone: '09110000003', dateAdded: new Date('2025-11-03T10:00:00') },
];

// --- Hook for GETTING Customers ---
export function useCustomers() {
    const isDemo = useStore(s => s.user?.isDemo);
    return useQuery({
        queryKey: customersKey.concat([isDemo]),
        queryFn: async () => {
            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 400));
                return MOCK_CUSTOMERS;
            }
            try {
                // Fetch all customers from Supabase, order by name
                const { data, error } = await supabase
                    .from('customers')
                    .select('id, name, email, phone, created_at') // Select the correct date column
                    .order('name', { ascending: true });

                if (error) {
                    // Intentionally rethrow for React Query error handling
                    throw error;
                }

                const responseData = data;
                if (!responseData || !Array.isArray(responseData)) {
                    return [];
                }

                // Return mapped data directly
                return responseData.map(c => ({
                    id: c.id,
                    name: c.name || 'Unnamed Customer',
                    email: c.email || 'N/A',
                    phone: c.phone || 'N/A',
                    dateAdded: c.created_at ? new Date(c.created_at) : null,
                }));
            } catch(error) {
                // Intentionally rethrow for React Query error handling
                throw error;
            }
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
                .select('id, name, email, phone, created_at')
                .single();
            if (error) {
                // Intentionally rethrow for React Query error handling
                throw error;
            }
            return { ...data, dateAdded: data.created_at ? new Date(data.created_at) : null };
        },
        onMutate: async (updatedCustomer) => {
            await queryClient.cancelQueries({ queryKey: customersKey });
            const previousCustomers = queryClient.getQueryData(customersKey);
            queryClient.setQueryData(customersKey, (old = []) =>
                old.map((c) => (c.id === updatedCustomer.id ? { ...c, ...updatedCustomer } : c))
            );
            return { previousCustomers };
        },
        onError: (err, updatedCustomer, context) => {
            if (context?.previousCustomers) {
                queryClient.setQueryData(customersKey, context.previousCustomers);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: customersKey });
        },
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
            };

            const { data, error } = await supabase
                .from('customers')
                .insert([payload])
                .select()
                .single();

            if (error) {
                throw error;
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customersKey });
        },
    });
}

// --- Hook for DELETING Customers ---
export function useDeleteCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (customerId) => {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', customerId);
            if (error) {
                // Intentionally rethrow for React Query error handling
                throw error;
            }
            return customerId;
        },
        onMutate: async (customerId) => {
            await queryClient.cancelQueries({ queryKey: customersKey });
            const previousCustomers = queryClient.getQueryData(customersKey);
            queryClient.setQueryData(customersKey, (old = []) =>
                old.filter((c) => c.id !== customerId)
            );
            return { previousCustomers };
        },
        onError: (err, customerId, context) => {
            if (context?.previousCustomers) {
                queryClient.setQueryData(customersKey, context.previousCustomers);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: customersKey });
        },
    });
}