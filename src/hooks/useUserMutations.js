// src/hooks/useUserMutations.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import useStore from '../store/useStore';

const usersTableKey = ['usersTableData'];

// --- Hook for GETTING Data from 'users' Table ---
export function useUsers({ page = 1, itemsPerPage = 10, searchTerm = '' } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);
    const MOCK_USERS = [
        { id: 'mock-u-1', name: 'Demo Admin', email: 'demo.admin@seaside.com', phone: '09110000010', role: 'Admin', dateAdded: new Date('2025-11-01T08:00:00') },
        { id: 'mock-u-2', name: 'Demo Staff', email: 'demo.staff@seaside.com', phone: '09110000011', role: 'Staff', dateAdded: new Date('2025-11-02T09:00:00') },
    ];

    return useQuery({
        queryKey: usersTableKey.concat([isDemo, page, itemsPerPage, searchTerm]),
        queryFn: async () => {
            if (isDemo) {
                // ... (demo logic remains similar, just ensuring mock data has roles)
                await new Promise(resolve => setTimeout(resolve, 400));
                let filtered = MOCK_USERS;
                if (searchTerm) {
                    const term = searchTerm.trim().toLowerCase();
                    filtered = filtered.filter(u =>
                        (u.name && u.name.toLowerCase().includes(term)) ||
                        (u.email && u.email.toLowerCase().includes(term))
                    );
                }
                const totalCount = filtered.length;
                const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
                const startIdx = (page - 1) * itemsPerPage;
                const endIdx = startIdx + itemsPerPage;
                return { users: filtered.slice(startIdx, endIdx), totalPages, totalCount };
            }

            try {
                const startIndex = (page - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage - 1;

                // --- UPDATED: Select 'role' and 'isadmin' ---
                let query = supabase
                    .from('users')
                    .select('id, name, email, phone, dateadded, role, isadmin', { count: 'exact' })
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
                    role: u.role || 'Staff', // Default to Staff if missing
                    isAdmin: u.isadmin,      // Map database isadmin to local prop
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

            // Check existing email
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
                role: userData.role || 'Staff', // --- UPDATED: Send role to DB ---
                dateadded: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('users')
                .insert([payload])
                .select()
                .single();

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
                role: payload.role, // --- UPDATED: Allow updating role ---
            };

            if (payload.password && payload.password.trim() !== '') {
                updateData.password = payload.password;
            }

            const { data, error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

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