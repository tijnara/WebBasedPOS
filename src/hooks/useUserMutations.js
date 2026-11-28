// src/hooks/useUserMutations.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';

const usersTableKey = ['usersTableData'];
const categoriesTableKey = ['userCategoriesData'];

// --- Fetch Categories (shared role definitions) ---
export function useUserCategories() {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: categoriesTableKey.concat([isDemo]),
        queryFn: async () => {
            if (isDemo) {
                return [
                    { id: 1, name: 'Admin', is_admin: true },
                    { id: 2, name: 'Staff', is_admin: false }
                ];
            }

            const { data, error } = await supabase
                .from('user_categories')
                .select('*')
                .order('id', { ascending: true });

            if (error) {
                console.error('Error fetching categories:', error);
                return [
                    { id: 1, name: 'Admin', is_admin: true },
                    { id: 2, name: 'Staff', is_admin: false }
                ];
            }

            return data || [];
        }
    });
}

// --- Fetch Users (scoped to store_id) ---
export function useUsers({ page = 1, itemsPerPage = 10, searchTerm = '', storeId = null } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);
    const userStoreId = useStore(s => s.user?.store_id);
    const targetStoreId = Number(storeId || userStoreId) || 1;

    return useQuery({
        queryKey: usersTableKey.concat([targetStoreId, isDemo, page, itemsPerPage, searchTerm]),
        queryFn: async () => {
            if (isDemo) return { users: [], totalPages: 1, totalCount: 0 };

            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage - 1;

            let query = supabase
                .from('users')
                .select(`
                    id, name, email, phone, dateadded, category_id, color,
                    user_categories:category_id ( id, name, is_admin )
                `, { count: 'exact' })
                .eq('store_id', targetStoreId)
                .order('name', { ascending: true })
                .range(startIndex, endIndex);

            if (searchTerm) {
                const term = searchTerm.trim().toLowerCase();
                query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
            }

            const { data, error, count } = await query;
            if (error) throw error;

            if (!data || !Array.isArray(data)) return { users: [], totalPages: 1, totalCount: 0 };

            const users = data.map(u => ({
                id: u.id,
                name: u.name || 'Unnamed User',
                email: u.email,
                phone: u.phone || 'N/A',
                color: u.color || '#3B82F6',
                categoryId: u.category_id,
                categoryName: u.user_categories?.name || 'Unknown',
                isAdmin: u.user_categories?.is_admin || false,
                dateAdded: u.dateadded ? new Date(u.dateadded) : null
            }));

            const totalCount = count || 0;
            const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
            return { users, totalPages, totalCount };
        },
    });
}

// --- Create User ---
export function useCreateUser() {
    const queryClient = useQueryClient();
    const addToast = useStore(s => s.addToast);
    const currentUser = useStore(s => s.user);

    return useMutation({
        mutationFn: async (userData) => {
            if (!userData.password) throw new Error('Password is required.');

            const user = useStore.getState().user || currentUser;
            const storeId = Number(userData?.store_id || user?.store_id) || 1;
            const capitalizeFirst = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', userData.email)
                .maybeSingle();
            if (existingUser) throw new Error(`Email ${userData.email} already exists.`);

            const payload = {
                store_id: storeId,
                name: capitalizeFirst(userData.name),
                email: userData.email,
                phone: userData.phone || null,
                password: userData.password,
                category_id: userData.categoryId,
                color: userData.color || '#3B82F6',
                dateadded: new Date().toISOString()
            };

            const { data, error } = await supabase.from('users').insert([payload]).select().single();
            if (error) throw error;

            logActivity({
                user,
                action: 'CREATE',
                entity_type: 'USER',
                description: `Created new user: ${payload.name}`
            });

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: usersTableKey });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
            addToast({ title: 'User Created', description: 'User created successfully.', variant: 'success' });
        },
        onError: (error) => {
            addToast({ title: 'Create Failed', description: error.message, variant: 'destructive' });
        }
    });
}

// --- Update User ---
export function useUpdateUser() {
    const queryClient = useQueryClient();
    const addToast = useStore(s => s.addToast);
    const currentUser = useStore(s => s.user);

    return useMutation({
        mutationFn: async (userData) => {
            const { id, ...payload } = userData;
            if (!id) throw new Error('User ID required.');

            const user = useStore.getState().user || currentUser;
            const storeId = Number(user?.store_id) || 1;

            const updateData = {
                name: payload.name,
                email: payload.email,
                phone: payload.phone || null,
                category_id: payload.categoryId,
                color: payload.color,
            };

            if (payload.password && payload.password.trim() !== '') {
                updateData.password = payload.password;
            }

            const { data, error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', id)
                .eq('store_id', storeId)
                .select()
                .single();
            if (error) throw error;

            logActivity({
                user,
                action: 'UPDATE',
                entity_type: 'USER',
                description: `Updated user details for: ${updateData.name}`
            });

            return data;
        },
        onSuccess: () => {
            addToast({ title: 'User Updated', description: 'User details updated.', variant: 'success' });
            queryClient.invalidateQueries({ queryKey: usersTableKey });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
        onError: (error) => {
            addToast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
        }
    });
}

// --- Delete User ---
export function useDeleteUser() {
    const queryClient = useQueryClient();
    const addToast = useStore(s => s.addToast);
    const currentUser = useStore(s => s.user);

    return useMutation({
        mutationFn: async (userId) => {
            const user = useStore.getState().user || currentUser;
            const storeId = Number(user?.store_id) || 1;

            const { data: userToDelete } = await supabase
                .from('users')
                .select('name')
                .eq('id', userId)
                .eq('store_id', storeId)
                .single();

            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId)
                .eq('store_id', storeId);
            if (error) throw error;

            if (userToDelete) {
                logActivity({
                    user,
                    action: 'DELETE',
                    entity_type: 'USER',
                    description: `Deleted user: ${userToDelete.name}`
                });
            }

            return userId;
        },
        onSuccess: () => {
            addToast({ title: 'User Deleted', description: 'User deleted successfully.', variant: 'success' });
            queryClient.invalidateQueries({ queryKey: usersTableKey });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
        onError: (error) => {
            addToast({ title: 'Delete Failed', description: error.message, variant: 'destructive' });
        }
    });
}

// --- Create User Category (Role) ---
export function useCreateUserCategory() {
    const queryClient = useQueryClient();
    const addToast = useStore(s => s.addToast);
    const currentUser = useStore(s => s.user);

    return useMutation({
        mutationFn: async (payload) => {
            const { data, error } = await supabase
                .from('user_categories')
                .insert([{ name: payload.name, is_admin: payload.isAdmin }])
                .select()
                .single();
            if (error) throw error;

            logActivity({
                user: currentUser,
                action: 'CREATE',
                entity_type: 'ROLE',
                description: `Created new user role: ${payload.name}`
            });

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userCategoriesData'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
            addToast({ title: 'Role Created', description: 'New role added successfully.', variant: 'success' });
        },
        onError: (error) => {
            addToast({ title: 'Create Failed', description: error.message, variant: 'destructive' });
        }
    });
}