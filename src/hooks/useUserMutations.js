import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import useStore from '../store/useStore'; // Import store to get current user ID

// Key for the profiles query
const profilesKey = ['profiles'];

// --- Hook for GETTING ALL User Profiles (Admin/Specific Use Case) ---
// Assumes RLS allows fetching multiple profiles (e.g., for an admin)
export function useUsers() {
    return useQuery({
        queryKey: profilesKey,
        queryFn: async () => {
            console.log('useUsers (Profiles): Fetching all profiles...');
            try {
                // Adjust select query as needed (e.g., 'id, full_name, email, phone, role')
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*');

                if (error) throw error;

                const responseData = data;
                console.log('useUsers (Profiles): API Response:', responseData);

                if (!responseData || !Array.isArray(responseData)) {
                    console.error('useUsers (Profiles): Invalid response data structure:', responseData);
                    return [];
                }

                // Map profile data
                const mappedData = responseData.map(u => ({
                    id: u.id, // This should match auth.users.id
                    name: u.full_name || u.raw_user_meta_data?.full_name || 'Unnamed User', // Check both places if needed
                    email: u.email, // Assuming email might be stored here too, otherwise get from auth user
                    phone: u.phone || 'N/A',
                    // Add other profile fields like 'role' if they exist
                    // role: u.role
                }));
                console.log('useUsers (Profiles): Mapped Data:', mappedData);
                return mappedData;

            } catch (error) {
                console.error('useUsers (Profiles): Error fetching data:', error);
                throw error;
            }
        },
        // Enable this query only if needed, e.g., on an admin page
        // enabled: !!isAdminUser, // Example: only run if user is admin
    });
}

// --- Hook for GETTING CURRENT User Profile ---
// Fetches profile for the currently logged-in user
export function useCurrentUserProfile() {
    // Get the user ID from the Zustand store
    const userId = useStore(state => state.user?.id);

    return useQuery({
        // Include userId in the queryKey so it refetches if the user changes
        queryKey: ['currentUserProfile', userId],
        queryFn: async () => {
            if (!userId) {
                console.log('useCurrentUserProfile: No user ID, skipping fetch.');
                return null; // Don't fetch if no user is logged in
            }
            console.log('useCurrentUserProfile: Fetching profile for user ID:', userId);
            try {
                const { data, error, status } = await supabase
                    .from('profiles')
                    .select(`*`) // Select desired profile columns
                    .eq('id', userId)
                    .single(); // Expect exactly one row

                // Handle cases where profile might not exist yet (common after signup)
                if (error && status === 406) { // 406 Not Acceptable -> .single() found 0 rows
                    console.log('useCurrentUserProfile: No profile found for user, returning null.');
                    return null;
                }
                if (error) throw error; // Throw other errors

                console.log('useCurrentUserProfile: Profile data:', data);
                // Map if necessary, though direct use might be fine
                return {
                    id: data.id,
                    name: data.full_name || 'Unnamed User',
                    email: data.email, // If stored in profile
                    phone: data.phone || 'N/A',
                    //... other fields
                };
            } catch (error) {
                console.error('useCurrentUserProfile: Error fetching profile:', error);
                throw error;
            }
        },
        // Only run the query if the userId is available
        enabled: !!userId,
        staleTime: 1000 * 60 * 15, // Keep profile data fresh for 15 mins
    });
}


// --- Hook for CREATING User Profiles (NOT Auth Users) ---
// Typically called *after* successful Supabase Auth signup to add profile details
export function useCreateUserProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userProfilePayload) => {
            // Payload MUST include 'id' matching the auth.users.id
            // Example payload: { id: 'user-uuid', full_name: 'Test User', phone: '123' }
            if (!userProfilePayload.id) {
                throw new Error("Profile creation requires an 'id' matching the authenticated user.");
            }
            console.log('useCreateUserProfile: Creating profile with payload:', userProfilePayload);
            const { data, error } = await supabase
                .from('profiles')
                .insert([userProfilePayload]) // Use insert for creating
                .select()
                .single();

            if (error) {
                console.error('useCreateUserProfile: Supabase error:', error);
                throw error;
            }
            console.log('useCreateUserProfile: Create successful:', data);
            return data;
        },
        onSuccess: (data) => {
            // Invalidate the general profiles list if used
            queryClient.invalidateQueries({ queryKey: profilesKey });
            // Directly update the currentUserProfile cache
            if (data?.id) {
                queryClient.setQueryData(['currentUserProfile', data.id], data);
                console.log('useCreateUserProfile: Updated currentUserProfile cache for ID:', data.id);
                // Also update profile in Zustand store
                useStore.setState({ profile: data });
            }
        },
        onError: (error) => {
            console.error("useCreateUserProfile: Mutation failed:", error);
        }
    });
}

// --- Hook for UPDATING User Profiles (NOT Auth Users) ---
// Used for updating non-auth details like name, phone, etc.
export function useUpdateUserProfile() {
    const queryClient = useQueryClient();
    const currentUserId = useStore(state => state.user?.id); // Get current user ID

    return useMutation({
        mutationFn: async (profileUpdatePayload) => {
            // Expects payload like { id: 'user-uuid', full_name: 'New Name', phone: '456' }
            const { id, ...updateData } = profileUpdatePayload;
            if (!id) {
                throw new Error("Profile update requires an 'id'.");
            }
            // Optional: Ensure users can only update their own profile unless admin
            // if (id !== currentUserId && !isAdmin) throw new Error("Permission denied.");

            console.log('useUpdateUserProfile: Updating profile ID', id, 'with data:', updateData);
            const { data, error } = await supabase
                .from('profiles')
                .update(updateData) // Only pass fields to update
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('useUpdateUserProfile: Supabase error:', error);
                throw error;
            }
            console.log('useUpdateUserProfile: Update successful:', data);
            return data;
        },
        // Optional: Optimistic Updates
        onMutate: async (updatedProfile) => {
            const profileQueryKey = ['currentUserProfile', updatedProfile.id];
            await queryClient.cancelQueries({ queryKey: profileQueryKey });
            const previousProfile = queryClient.getQueryData(profileQueryKey);
            queryClient.setQueryData(profileQueryKey, old => ({ ...old, ...updatedProfile }));
            console.log('useUpdateUserProfile: Optimistic update applied for ID:', updatedProfile.id);
            // Also optimistically update the main list if needed
            // await queryClient.cancelQueries({ queryKey: profilesKey });
            // const previousProfiles = queryClient.getQueryData(profilesKey);
            // queryClient.setQueryData(profilesKey, (oldProfiles = []) => /* map logic */);
            return { previousProfile /*, previousProfiles */ };
        },
        onError: (err, updatedProfile, context) => {
            console.error('useUpdateUserProfile: Mutation error, rolling back optimistic update for ID:', updatedProfile.id, err);
            queryClient.setQueryData(['currentUserProfile', updatedProfile.id], context.previousProfile);
            // if (context.previousProfiles) {
            //    queryClient.setQueryData(profilesKey, context.previousProfiles);
            //}
        },
        onSettled: (data, error, updatedProfile) => {
            console.log('useUpdateUserProfile: Mutation settled for ID:', updatedProfile.id, 'Refetching profile.');
            // Invalidate both current profile and potentially the list
            queryClient.invalidateQueries({ queryKey: ['currentUserProfile', updatedProfile.id] });
            queryClient.invalidateQueries({ queryKey: profilesKey });
            // Also update profile in Zustand store on success
            if (data && !error && updatedProfile.id === currentUserId) {
                useStore.setState({ profile: data });
            }
        },
    });
}

// --- Hook for DELETING User Profiles (NOT Auth Users) ---
// Deleting the auth user requires admin privileges. This only deletes the profile row.
export function useDeleteUserProfile() {
    const queryClient = useQueryClient();
    const currentUserId = useStore(state => state.user?.id); // Get current user ID

    return useMutation({
        mutationFn: async (userIdToDelete) => {
            if (!userIdToDelete) {
                throw new Error("User ID is required for deletion.");
            }
            // Optional: Add admin check here if needed
            // if (!isAdmin) throw new Error("Permission denied.");

            console.log('useDeleteUserProfile: Deleting profile for ID:', userIdToDelete);
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userIdToDelete);

            if (error) {
                console.error('useDeleteUserProfile: Supabase error:', error);
                throw error;
            }
            console.log('useDeleteUserProfile: Delete successful for profile ID:', userIdToDelete);
            return userIdToDelete;
        },
        // Optional: Optimistic Updates
        onMutate: async (userIdToDelete) => {
            // Optimistically remove from the main list
            await queryClient.cancelQueries({ queryKey: profilesKey });
            const previousProfiles = queryClient.getQueryData(profilesKey);
            queryClient.setQueryData(profilesKey, (old = []) =>
                old.filter((p) => p.id !== userIdToDelete)
            );
            // If deleting the current user's profile, also clear that cache
            let previousProfile = null;
            if (userIdToDelete === currentUserId) {
                await queryClient.cancelQueries({ queryKey: ['currentUserProfile', userIdToDelete] });
                previousProfile = queryClient.getQueryData(['currentUserProfile', userIdToDelete]);
                queryClient.setQueryData(['currentUserProfile', userIdToDelete], null);
            }
            console.log('useDeleteUserProfile: Optimistic removal applied for ID:', userIdToDelete);
            return { previousProfiles, previousProfile, deletedUserId: userIdToDelete };
        },
        onError: (err, userIdToDelete, context) => {
            console.error('useDeleteUserProfile: Mutation error, rolling back optimistic removal for ID:', userIdToDelete, err);
            queryClient.setQueryData(profilesKey, context.previousProfiles);
            if (context.deletedUserId === currentUserId && context.previousProfile) {
                queryClient.setQueryData(['currentUserProfile', context.deletedUserId], context.previousProfile);
            }
        },
        onSettled: (data, error, userIdToDelete) => {
            console.log('useDeleteUserProfile: Mutation settled for ID:', userIdToDelete, 'Refetching profiles.');
            queryClient.invalidateQueries({ queryKey: profilesKey });
            // Also invalidate current user profile if it was deleted
            if (userIdToDelete === currentUserId) {
                queryClient.invalidateQueries({ queryKey: ['currentUserProfile', userIdToDelete] });
                // Clear profile from Zustand store if current user's profile deleted
                if (!error) {
                    useStore.setState({ profile: null });
                }
            }
        },
    });
}

// --- Hooks for AUTHENTICATION actions ---

// Example: Hook for creating an Auth user (Sign Up)
export function useSignUpUser() {
    const queryClient = useQueryClient();
    // Optional: Get the create profile mutation hook if you want to create profile immediately
    const createProfile = useCreateUserProfile();

    return useMutation({
        mutationFn: async ({ email, password, options }) => {
            console.log('useSignUpUser: Signing up with email:', email);
            // 'options.data' can contain additional metadata like 'full_name'
            const { data, error } = await supabase.auth.signUp({ email, password, options });
            if (error) {
                console.error('useSignUpUser: Supabase signup error:', error);
                throw error;
            }
            console.log('useSignUpUser: Signup successful:', data);

            // IMPORTANT: Supabase often requires email confirmation by default.
            // The user object might be returned but the session might be null until confirmed.

            // Optionally create profile immediately after successful sign up
            // Check if user object exists and has an ID
            if (data.user?.id) {
                try {
                    console.log('useSignUpUser: Attempting to create profile for new user:', data.user.id);
                    await createProfile.mutateAsync({
                        id: data.user.id,
                        email: data.user.email, // Store email in profile if desired
                        full_name: options?.data?.full_name || email.split('@')[0], // Use provided name or default
                        // Add other default profile fields if needed (e.g., role: 'customer')
                    });
                    console.log('useSignUpUser: Profile creation successful (or triggered).');
                } catch (profileError) {
                    console.error('useSignUpUser: Failed to create profile after signup:', profileError);
                    // Decide how to handle this - maybe alert user, maybe log, maybe ignore
                    // Don't throw here usually, as signup itself succeeded
                }
            } else {
                console.warn("useSignUpUser: Signup response did not contain user ID, cannot create profile immediately.");
            }

            return data; // Return the auth sign up response ({ user, session })
        },
        onSuccess: (data) => {
            console.log('useSignUpUser: Mutation succeeded.');
            // If sign up automatically logs in (e.g., email confirmation disabled),
            // you might want to update the store here, but typically you wait for
            // the user to log in after confirming their email.
            // The onAuthStateChange listener in _app.js should handle session updates.

            // You might invalidate the 'profiles' list if an admin is creating users
            // queryClient.invalidateQueries({ queryKey: profilesKey });
        },
        onError: (error) => {
            console.error('useSignUpUser: Mutation failed:', error);
        }
    });
}

// Example: Hook for updating Auth user details (like email or password)
export function useUpdateAuthUser() {
    const queryClient = useQueryClient();
    const addToast = useStore(state => state.addToast);

    return useMutation({
        mutationFn: async (updateData) => {
            // updateData could be { email: 'new@example.com' } or { password: 'new_password' }
            // Or { data: { full_name: 'Updated Name' } } for metadata
            console.log('useUpdateAuthUser: Updating auth user with:', updateData);
            const { data, error } = await supabase.auth.updateUser(updateData);
            if (error) {
                console.error('useUpdateAuthUser: Supabase update error:', error);
                throw error;
            }
            console.log('useUpdateAuthUser: Update successful:', data);
            return data;
        },
        onSuccess: (data) => {
            console.log('useUpdateAuthUser: Mutation succeeded.');
            // Update user/profile state in Zustand store
            useStore.getState().checkSession(); // Re-fetch session and profile
            addToast({ title: 'User Updated', description: 'Your details have been updated.', variant: 'success' });
            // Optionally invalidate profile queries if metadata was updated
            // queryClient.invalidateQueries({ queryKey: ['currentUserProfile', data.user.id] });
            // queryClient.invalidateQueries({ queryKey: profilesKey });
        },
        onError: (error) => {
            console.error('useUpdateAuthUser: Mutation failed:', error);
            addToast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
        }
    });
}


// Example: Hook for DELETING an Auth user (Requires ADMIN privileges)
// This should ideally call a secure Supabase Edge Function.
// **DO NOT** call supabase.auth.admin.deleteUser directly from the client-side
// unless you have VERY specific RLS policies and understand the risks.
export function useDeleteAuthUserAdmin() {
    const queryClient = useQueryClient();
    const addToast = useStore(state => state.addToast);

    return useMutation({
        mutationFn: async (userIdToDelete) => {
            console.warn('useDeleteAuthUserAdmin: Attempting to delete user via Edge Function (placeholder):', userIdToDelete);
            // **Replace with your actual Edge Function call**
            // Example:
            // const { data, error } = await supabase.functions.invoke('delete-user-admin', {
            //   body: { userId: userIdToDelete }
            // });
            // if (error) throw error;
            // return data; // Function might return success message or deleted user ID

            // Placeholder simulation:
            if (!userIdToDelete) throw new Error("User ID required");
            console.log(`Simulating deletion of auth user ${userIdToDelete}. In production, call an Edge Function.`);
            // You might also delete the corresponding profile row here or in the Edge Function
            // await supabase.from('profiles').delete().eq('id', userIdToDelete);
            return { message: `User ${userIdToDelete} deletion simulated.` }; // Simulate success
        },
        onSuccess: (data, userIdToDelete) => {
            console.log('useDeleteAuthUserAdmin: Deletion successful for user:', userIdToDelete, data);
            addToast({ title: 'User Deleted', description: `User ${userIdToDelete} has been deleted.`, variant: 'success' });
            // Invalidate user/profile lists
            queryClient.invalidateQueries({ queryKey: profilesKey });
            queryClient.invalidateQueries({ queryKey: ['currentUserProfile', userIdToDelete] }); // In case admin deletes self? Unlikely needed.
        },
        onError: (error, userIdToDelete) => {
            console.error('useDeleteAuthUserAdmin: Deletion failed for user:', userIdToDelete, error);
            addToast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
        }
    });
}