// src/hooks/useUserMutations.js (Simplified for Custom Table CRUD - INSECURE PASSWORD HANDLING)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import useStore from '../store/useStore';

// Key for the custom users table query
const usersTableKey = ['usersTableData']; // Changed key to avoid confusion with auth

// --- Hook for GETTING Data from 'users' Table ---
// NOTE: Ensure RLS allows this fetch (e.g., only for admins or specific roles)
export function useUsers() {
    return useQuery({
        queryKey: usersTableKey,
        queryFn: async () => {
            console.log('useUsers (Table): Fetching all users...');
            try {
                // Select needed columns, **EXCLUDE password**
                const { data, error } = await supabase
                    .from('users')
                    .select('id, name, email, phone, dateadded'); // Adjust columns as per your schema

                if (error) {
                    console.error('useUsers (Table): Supabase query error:', error);
                    throw error;
                }

                console.log('useUsers (Table): API Response:', data);
                if (!data || !Array.isArray(data)) return [];

                // Map data from your 'users' table
                return data.map(u => ({
                    id: u.id,
                    name: u.name || 'Unnamed User',
                    email: u.email,
                    phone: u.phone || 'N/A',
                    // Adjust 'dateadded' based on your actual column name
                    dateAdded: u.dateadded ? new Date(u.dateadded) : (u.created_at ? new Date(u.created_at) : null)
                }));
            } catch (error) {
                console.error('useUsers (Table): Error fetching data:', error);
                throw error;
            }
        },
        // Consider enabling only for specific roles/pages if needed
        // enabled: userHasAdminRole,
    });
}


// --- Hook for CREATING Users in 'users' Table ---
// !! INSECURE !! Assumes plain text password. Requires server-side hashing in practice.
export function useCreateUser() {
    const queryClient = useQueryClient();
    const addToast = useStore(s => s.addToast);

    return useMutation({
        mutationFn: async (userData) => {
            // userData includes { name, email, phone, password } from the form
            if (!userData.password) {
                throw new Error("Password is required to create a user.");
            }
            console.warn('useCreateUser: Attempting to save user with plain text password (INSECURE):', userData.email);

            // ** SECURITY RISK: HASH PASSWORD SERVER-SIDE BEFORE INSERTING **
            // In a real app, you'd call an Edge Function here to hash the password securely.
            // const { data, error } = await supabase.functions.invoke('create-user-securely', {
            //    body: userData,
            // });
            // For DEMO ONLY - inserting plain text password:
            const capitalizeFirst = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
            const payload = {
                name: capitalizeFirst(userData.name),
                email: userData.email,
                phone: userData.phone || null,
                password: userData.password, // <-- Storing plain text password - BAD PRACTICE
                dateadded: new Date().toISOString() // Set dateadded on creation
            };
            const { data, error } = await supabase
                .from('users')
                .insert([payload])
                .select('id, name, email, phone, dateadded') // Exclude password from response
                .single();

            if (error) {
                console.error('useCreateUser: Supabase error:', error);
                // Check for unique constraint violation (e.g., duplicate email)
                if (error.code === '23505') { // Postgres unique violation code
                    throw new Error(`Email ${userData.email} already exists.`);
                }
                throw error;
            }
            console.log('useCreateUser: Create successful (excluding password):', data);
            return data;
        },
        onSuccess: (data) => {
            console.log('useCreateUser: Success! Invalidating users table query.', data);
            queryClient.invalidateQueries({ queryKey: usersTableKey });
            addToast({ title: 'User Created', description: `User ${data.email} created.`, variant: 'success' });
        },
        onError: (error) => {
            console.error('useCreateUser: Mutation failed:', error);
            // Toast is now added directly in the mutation hook
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
            // Exclude dateAdded from payload sent for update
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
                console.warn("useUpdateUser: Updating password with plain text (INSECURE) for user:", id);
                // In a real app, call an Edge Function:
                // await supabase.functions.invoke('update-user-password-securely', { body: { userId: id, password: payload.password } });
                // For DEMO ONLY:
                updateData.password = payload.password; // <-- Updating plain text password
            } else {
                console.log("useUpdateUser: Password field empty or not provided, skipping password update for user:", id);
            }

            console.log('useUpdateUser: Updating user ID', id); // Avoid logging updateData if it contains password
            const { data, error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', id)
                .select('id, name, email, phone, dateadded') // Exclude password from response
                .single();

            if (error) {
                console.error('useUpdateUser: Supabase error:', error);
                if (error.code === '23505') { // Unique constraint violation
                    throw new Error(`Email ${updateData.email} might already be in use by another user.`);
                }
                throw error;
            }
            console.log('useUpdateUser: Update successful:', data);
            // Map dateAdded back for consistency in optimistic update if needed
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
        onSuccess: (data) => {
            console.log('useUpdateUser: Success!', data);
            // Invalidation happens in onSettled now
            addToast({ title: 'User Updated', description: `User ${data.email} updated.`, variant: 'success' });
        },
        onError: (error, variables, context) => { // variables contains the input userData
            console.error('useUpdateUser: Mutation failed for ID:', variables.id, error);
            if (context?.previousUsers) {
                queryClient.setQueryData(usersTableKey, context.previousUsers); // Rollback optimistic update
            }
            addToast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
        },
        onSettled: (data, error, updatedUser) => {
            // Always refetch after error or success to ensure data consistency
            console.log('useUpdateUser: Mutation settled for ID:', updatedUser.id, 'Refetching users table data.');
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
            console.log('useDeleteUser: Deleting user ID:', userId);

            // ** IMPORTANT: This ONLY deletes the row from your `users` table. **
            // It does NOT delete the user from Supabase Auth if they exist there.

            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) {
                console.error('useDeleteUser: Supabase error:', error);
                throw error;
            }
            console.log('useDeleteUser: Delete successful for ID:', userId);
            return userId; // Return ID for potential optimistic update
        },
        // Optional: Add optimistic updates
        onMutate: async (userIdToDelete) => {
            await queryClient.cancelQueries({ queryKey: usersTableKey });
            const previousUsers = queryClient.getQueryData(usersTableKey);
            queryClient.setQueryData(usersTableKey, (old = []) =>
                old.filter((u) => u.id !== userIdToDelete)
            );
            console.log('useDeleteUser: Optimistic removal applied for ID:', userIdToDelete);
            return { previousUsers };
        },
        onSuccess: (userId) => {
            console.log('useDeleteUser: Success for ID:', userId);
            // Invalidation happens in onSettled
            addToast({ title: 'User Deleted', description: `User deleted successfully.`, variant: 'success' });
        },
        onError: (error, userId, context) => {
            console.error('useDeleteUser: Mutation failed for ID:', userId, error);
            if (context?.previousUsers) {
                queryClient.setQueryData(usersTableKey, context.previousUsers); // Rollback optimistic update
            }
            addToast({ title: 'Delete Failed', description: error.message, variant: 'destructive' });
        },
        onSettled: (data, error, userId) => {
            // Always refetch to ensure consistency, even after optimistic updates
            console.log('useDeleteUser: Mutation settled for ID:', userId, '. Refetching users table data.');
            queryClient.invalidateQueries({ queryKey: usersTableKey });
        }
    });
}