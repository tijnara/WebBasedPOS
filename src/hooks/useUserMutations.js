// src/hooks/useUserMutations.js (Simplified for Custom Table CRUD - INSECURE PASSWORD HANDLING)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import useStore from '../store/useStore';
// import bcrypt from 'bcryptjs'; // <-- REMOVED PASSWORD HASHING

// Key for the custom users table query
const usersTableKey = ['usersTableData']; // Changed key to avoid confusion with auth

// --- Hook for GETTING Data from 'users' Table ---
// NOTE: Ensure RLS allows this fetch (e.g., only for admins or specific roles)
export function useUsers() {
    return useQuery({
        queryKey: usersTableKey,
        queryFn: async () => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('id, name, email, phone, dateadded'); // Ensure sensitive fields like `password` are excluded

                if (error) {
                    throw error;
                }

                if (!data || !Array.isArray(data)) return [];

                return data.map(u => ({
                    id: u.id,
                    name: u.name || 'Unnamed User',
                    email: u.email,
                    phone: u.phone || 'N/A',
                    dateAdded: u.dateadded ? new Date(u.dateadded) : null
                }));
            } catch (error) {
                throw error;
            }
        },
    });
}


// --- Hook for CREATING Users in 'users' Table ---
// !! INSECURE !! Assumes plain text password. Requires server-side hashing in practice.
export function useCreateUser() {
    const queryClient = useQueryClient();
    const addToast = useStore(s => s.addToast);

    return useMutation({
        mutationFn: async (userData) => {
            if (!userData.password) {
                throw new Error("Password is required to create a user.");
            }

            const capitalizeFirst = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

            // Check if the email already exists
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('id')
                .eq('email', userData.email)
                .single();

            if (checkError && checkError.code !== 'PGRST116') { // Ignore "No rows found" error
                throw new Error("Failed to check for existing email.");
            }

            if (existingUser) {
                throw new Error(`Email ${userData.email} already exists.`);
            }

            const payload = {
                name: capitalizeFirst(userData.name),
                email: userData.email,
                phone: userData.phone || null,
                password: userData.password, // Store plain text password
                dateadded: new Date().toISOString() // Set dateadded on creation
            };

            const { data, error } = await supabase
                .from('users')
                .insert([payload])
                .select('id, name, email, phone, dateadded') // Exclude password from response
                .single();

            if (error) {
                if (error.code === '23505') { // Postgres unique violation code
                    throw new Error(`Email ${userData.email} already exists.`);
                }
                throw error;
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: usersTableKey });
            addToast({ title: 'User Created', description: `User created.`, variant: 'success' });
        },
        onError: (error) => {
            addToast({ title: 'Create Failed', description: error.message, variant: 'destructive' });
        }
    });
}

// --- Hook for UPDATING Users in 'users' Table ---
// !! INSECURE !! Allows updating potentially plain text password.
export function useUpdateUser() {
    const queryClient = useQueryClient();
    const addToast = useStore(s => s.addToast);

    return useMutation({
        mutationFn: async (userData) => {
            const { id, dateAdded, ...payload } = userData; // userData from form { id, name, email, phone, password?, dateAdded? }
            if (!id) throw new Error("User ID is required for update.");

            const updateData = {
                name: payload.name,
                email: payload.email,
                phone: payload.phone || null,
                // dateadded should typically not be updated manually
            };

            // Only include password if it's provided and not empty
            // ** SECURITY RISK: HASH PASSWORD SERVER-SIDE BEFORE UPDATING **
            if (payload.password && payload.password.trim() !== '') {
                updateData.password = payload.password; // <-- Updating plain text password
            }

            const { data, error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', id)
                .select('id, name, email, phone, dateadded') // Exclude password from response
                .single();

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    throw new Error(`Email ${updateData.email} might already be in use by another user.`);
                }
                // Intentionally rethrow for React Query error handling
                throw error;
            }
            return { ...data, dateAdded: data.dateadded ? new Date(data.dateadded) : null };
        },
        // Optional: Add optimistic updates like in other hooks if desired
        onMutate: async (updatedUser) => {
            await queryClient.cancelQueries({ queryKey: usersTableKey });
            const previousUsers = queryClient.getQueryData(usersTableKey);
            // Ensure dateAdded is handled correctly in optimistic update
            const optimisticUserData = {
                ...updatedUser,
                // Use the dateAdded from the input form data if available, otherwise parse from the existing cache
                dateAdded: updatedUser.dateAdded instanceof Date
                    ? updatedUser.dateAdded
                    : (previousUsers?.find(u => u.id === updatedUser.id)?.dateAdded || null)
            };
            queryClient.setQueryData(usersTableKey, (old = []) =>
                old.map((u) => (u.id === updatedUser.id ? optimisticUserData : u))
            );
            return { previousUsers };
        },
        onSuccess: () => {
            addToast({ title: 'User Updated', description: `User updated.`, variant: 'success' });
        },
        onError: (error, variables, context) => {
            if (context?.previousUsers) {
                queryClient.setQueryData(usersTableKey, context.previousUsers); // Rollback optimistic update
            }
            addToast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: usersTableKey });
        }
    });
}

// --- Hook for DELETING Users from 'users' Table ---
export function useDeleteUser() {
    const queryClient = useQueryClient();
    const addToast = useStore(s => s.addToast);

    return useMutation({
        mutationFn: async (userId) => {
            if (!userId) throw new Error("User ID is required for deletion.");

            // ** IMPORTANT: This ONLY deletes the row from your `users` table. **
            // It does NOT delete the user from Supabase Auth if they exist there.

            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) {
                // Intentionally rethrow for React Query error handling
                throw error;
            }
            return userId; // Return ID for potential optimistic update
        },
        // Optional: Add optimistic updates
        onMutate: async (userIdToDelete) => {
            await queryClient.cancelQueries({ queryKey: usersTableKey });
            const previousUsers = queryClient.getQueryData(usersTableKey);
            queryClient.setQueryData(usersTableKey, (old = []) =>
                old.filter((u) => u.id !== userIdToDelete)
            );
            return { previousUsers };
        },
        onSuccess: () => {
            addToast({ title: 'User Deleted', description: `User deleted successfully.`, variant: 'success' });
        },
        onError: (error, userId, context) => {
            if (context?.previousUsers) {
                queryClient.setQueryData(usersTableKey, context.previousUsers); // Rollback optimistic update
            }
            addToast({ title: 'Delete Failed', description: error.message, variant: 'destructive' });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: usersTableKey });
        }
    });
}