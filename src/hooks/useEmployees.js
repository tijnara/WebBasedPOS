// src/hooks/useEmployees.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';

// 1. Fetches all active employees for the current store
export function useEmployees(storeId = null) {
    const userStoreId = useStore(s => s.user?.store_id);
    const targetStoreId = Number(storeId || userStoreId) || 1;

    return useQuery({
        queryKey: ['employees', targetStoreId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('store_id', targetStoreId)
                .eq('is_active', true)
                .order('name', { ascending: true });

            if (error) throw error;
            return data || [];
        }
    });
}

// 2. Handles Adding, Editing, and Deleting from the Manage Employees modal
export function useManageEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ action, employee }) => {
            const currentUser = useStore.getState().user;
            const storeId = Number(currentUser?.store_id) || 1;

            if (action === 'ADD') {
                const { error } = await supabase.from('employees').insert([{
                    store_id: storeId,
                    name: employee.name,
                    default_salary: parseFloat(employee.default_salary || 0),
                    salary_type: employee.salary_type || 'per_day',
                    container_multiplier: employee.container_multiplier ? parseInt(employee.container_multiplier) : null,
                    is_active: true
                }]);
                if (error) throw error;

                logActivity({
                    user: currentUser,
                    action: 'CREATE',
                    entity_type: 'EMPLOYEE',
                    description: `Added new employee: ${employee.name}`
                });
            }
            else if (action === 'EDIT') {
                const { error } = await supabase.from('employees')
                    .update({
                        name: employee.name,
                        default_salary: parseFloat(employee.default_salary || 0),
                        salary_type: employee.salary_type,
                        container_multiplier: employee.container_multiplier ? parseInt(employee.container_multiplier) : null
                    })
                    .eq('id', employee.id)
                    .eq('store_id', storeId);
                if (error) throw error;

                logActivity({
                    user: currentUser,
                    action: 'UPDATE',
                    entity_type: 'EMPLOYEE',
                    description: `Updated employee profile: ${employee.name}`
                });
            }
            else if (action === 'DELETE') {
                const { data: empToDelete } = await supabase
                    .from('employees')
                    .select('name')
                    .eq('id', employee.id)
                    .eq('store_id', storeId)
                    .single();

                const { error } = await supabase
                    .from('employees')
                    .delete()
                    .eq('id', employee.id)
                    .eq('store_id', storeId);
                if (error) throw error;

                if (empToDelete) {
                    logActivity({
                        user: currentUser,
                        action: 'DELETE',
                        entity_type: 'EMPLOYEE',
                        description: `Deleted employee profile: ${empToDelete.name}`
                    });
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        }
    });
}