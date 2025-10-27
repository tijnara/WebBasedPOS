import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import directus from '../lib/directus';

const usersKey = ['users'];

// --- Hook for GETTING Users ---
export function useUsers() {
    return useQuery({
        queryKey: usersKey,
        queryFn: async () => {
            // NOTE: This requires admin permission
            const response = await directus.users.readByQuery({ limit: -1 });
            return response.data.map(u => ({
                id: u.id,
                name: `${u.first_name} ${u.last_name}`, // Combine names
                email: u.email,
                phone: u.phone || 'N/A', // Assuming 'phone' field exists
                // dateAdded: new Date(u.dateAdded) // 'dateAdded' may not exist on users
            }));
        },
    });
}

// --- Hook for CREATING Users ---
export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userPayload) => {
            // Directus user creation is special
            // You must provide email, password, and role
            // This assumes a default role ID.
            // PLEASE UPDATE 'role_id_here'
            const payload = {
                first_name: userPayload.name,
                email: userPayload.email,
                password: userPayload.password,
                phone: userPayload.phone,
                role: 'role_id_here' // <-- IMPORTANT: Set a default Role ID
            }
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
            // Map 'name' back to 'first_name'
            const updatePayload = {
                first_name: payload.name,
                email: payload.email,
                phone: payload.phone,
                // Only include password if it's not empty
                ...(payload.password && { password: payload.password })
            }
            return await directus.users.updateOne(id, updatePayload);
        },
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
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: usersKey });
        },
    });
}