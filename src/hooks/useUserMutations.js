import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import directus from '../lib/directus';

const usersKey = ['users'];

// --- Hook for GETTING Users ---
export function useUsers() {
    return useQuery({
        queryKey: usersKey,
        queryFn: async () => {
            console.log('useUsers: Fetching...'); // Log start
            try {
                // NOTE: Fetching '/items/users' might require specific permissions
                // If this fails with 403, check Directus roles/permissions
                const response = await directus.items('users').readByQuery({ limit: -1 });
                console.log('useUsers: API Response:', response); // Log response

                if (!response.data || !Array.isArray(response.data)) {
                    console.error('useUsers: Invalid response data structure:', response);
                    return [];
                }

                // --- CORRECTED MAPPING ---
                const mappedData = response.data.map(u => ({
                    id: u.id,
                    // Use the 'name' field directly from your API response
                    name: u.name || 'Unnamed User',
                    email: u.email,
                    phone: u.phone || 'N/A',
                }));
                console.log('useUsers: Mapped Data:', mappedData); // Log mapped data
                return mappedData;

            } catch (error) {
                console.error('useUsers: Error fetching data:', error);
                // Check if it's an auth error (Directus SDK might throw differently)
                if (error.message?.includes('401') || error.message?.includes('403')) {
                    console.warn('useUsers: Authentication/Permission error detected.');
                    // Optionally trigger logout here if needed, though directus.js should handle it
                }
                throw error;
            }
        },
    });
}

// --- Hook for CREATING Users ---
export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userPayload) => {
            // Map 'name' to 'first_name' if your Directus setup expects it
            // Adjust role ID as needed
            const payload = {
                first_name: userPayload.name, // Assuming Directus needs first_name
                // last_name: '', // Add if needed
                email: userPayload.email,
                password: userPayload.password,
                phone: userPayload.phone,
                role: 'YOUR_DEFAULT_ROLE_ID_HERE' // <-- IMPORTANT: Replace with actual Role ID from Directus
            }
            // Use directus.users.createOne for user creation
            return await directus.users.createOne(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: usersKey });
        },
    });
}

// --- Hook for UPDATING Users ---
export function useUpdateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (user) => {
            const { id, ...payload } = user;
            // Map 'name' back to 'first_name' if needed
            const updatePayload = {
                first_name: payload.name, // Assuming Directus needs first_name
                email: payload.email,
                phone: payload.phone,
                ...(payload.password && { password: payload.password })
            }
            return await directus.users.updateOne(id, updatePayload);
        },
        // Add optimistic updates similar to products/customers if desired
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: usersKey });
        },
    });
}

// --- Hook for DELETING Users ---
export function useDeleteUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId) => {
            return await directus.users.deleteOne(userId);
        },
        // Add optimistic updates similar to products/customers if desired
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: usersKey });
        },
    });
}