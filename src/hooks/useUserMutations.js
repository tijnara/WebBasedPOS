// src/hooks/useUserMutations.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import useStore from '../store/useStore';

const usersTableKey = ['usersTableData'];
const categoriesTableKey = ['userCategoriesData'];

// --- NEW Hook: Fetch Categories ---
export function useUserCategories() {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: categoriesTableKey.concat([isDemo]),
        queryFn: async () => {
            // 1. Fallback for Demo Mode
            if (isDemo) {
                return [
                    { id: 1, name: 'Admin', is_admin: true },
                    { id: 2, name: 'Staff', is_admin: false }
                ];
            }

            // 2. Fetch from Supabase
            const { data, error } = await supabase
                .from('user_categories')
                .select('*')
                .order('id', { ascending: true });
            
            if (error) {
                console.error("Error fetching categories:", error);
                // Return a safe fallback so the UI doesn't break entirely
                return [
                    { id: 1, name: 'Admin', is_admin: true },
                    { id: 2, name: 'Staff', is_admin: false }
                ];
            }
            
            return data || [];
        }
    });
}

// --- Hook for GETTING Data from 'users' Table ---
export function useUsers({ page = 1, itemsPerPage = 10, searchTerm = '' } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: usersTableKey.concat([isDemo, page, itemsPerPage, searchTerm]),
        queryFn: async () => {
            if (isDemo) {
                return { users: [], totalPages: 1, totalCount: 0 }; // Handle demo mode as needed
            }

            try {
                const startIndex = (page - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage - 1;

                // --- REVERTED: Use the explicit join syntax ---
                let query = supabase
                    .from('users')
                    .select(`
                        id, name, email, phone, dateadded, category_id,
                        user_categories ( id, name, is_admin )
                    `, { count: 'exact' })
                    .order('name', { ascending: true })
                    .range(startIndex, endIndex);

                if (searchTerm) {
                    const term = searchTerm.trim().toLowerCase();
                    query = query.or(
                        `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`
                    );
                }

                const { data, error, count } = await query;
                if (error) throw error;

                if (!data || !Array.isArray(data)) return { users: [], totalPages: 1, totalCount: 0 };

                const users = data.map(u => ({
                    id: u.id,
                    name: u.name || 'Unnamed User',
                    email: u.email,
                    phone: u.phone || 'N/A',
                    categoryId: u.category_id,
                    categoryName: u.user_categories?.name || 'Unknown',
                    isAdmin: u.user_categories?.is_admin || false, 
                    dateAdded: u.dateadded ? new Date(u.dateadded) : null
                }));

                const totalCount = count || 0;
                const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
                return { users, totalPages, totalCount };
            } catch (error) {
                throw error;
            }
        },
    });
}

// --- Hook for CREATING Users ---
export function useCreateUser() {
    const queryClient = useQueryClient();
    const addToast = useStore(s => s.addToast);

    return useMutation({
        mutationFn: async (userData) => {
            if (!userData.password) throw new Error("Password is required.");

            const capitalizeFirst = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', userData.email)
                .maybeSingle();

            if (existingUser) throw new Error(`Email ${userData.email} already exists.`);

            const payload = {
                name: capitalizeFirst(userData.name),
                email: userData.email,
                phone: userData.phone || null,
                password: userData.password,
                category_id: userData.categoryId, 
                dateadded: new Date().toISOString()
            };

            const { data, error } = await supabase.from('users').insert([payload]).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: usersTableKey });
            addToast({ title: 'User Created', description: `User created successfully.`, variant: 'success' });
        },
        onError: (error) => {
            addToast({ title: 'Create Failed', description: error.message, variant: 'destructive' });
        }
    });
}

// --- Hook for UPDATING Users ---
export function useUpdateUser() {
    const queryClient = useQueryClient();
    const addToast = useStore(s => s.addToast);

    return useMutation({
        mutationFn: async (userData) => {
            const { id, ...payload } = userData;
            if (!id) throw new Error("User ID required.");

            const updateData = {
                name: payload.name,
                email: payload.email,
                phone: payload.phone || null,
                category_id: payload.categoryId,
            };

            if (payload.password && payload.password.trim() !== '') {
                updateData.password = payload.password;
            }

            const { data, error } = await supabase.from('users').update(updateData).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            addToast({ title: 'User Updated', description: `User details updated.`, variant: 'success' });
            queryClient.invalidateQueries({ queryKey: usersTableKey });
        },
        onError: (error) => {
            addToast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
        }
    });
}

// --- Hook for DELETING Users ---
export function useDeleteUser() {
    const queryClient = useQueryClient();
    const addToast = useStore(s => s.addToast);

    return useMutation({
        mutationFn: async (userId) => {
            const { error } = await supabase.from('users').delete().eq('id', userId);
            if (error) throw error;
            return userId;
        },
        onSuccess: () => {
            addToast({ title: 'User Deleted', description: `User deleted successfully.`, variant: 'success' });
            queryClient.invalidateQueries({ queryKey: usersTableKey });
        },
        onError: (error) => {
            addToast({ title: 'Delete Failed', description: error.message, variant: 'destructive' });
        }
    });
}