// src/hooks/useGalleryMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';

const galleryKey = ['gallery'];

export function useCreateGalleryItem() {
    const queryClient = useQueryClient();
    const currentUser = useStore(s => s.user);

    return useMutation({
        mutationFn: async (newItem) => {
            const user = useStore.getState().user || currentUser;
            const storeId = Number(newItem?.store_id || user?.store_id) || 1;

            const { data, error } = await supabase
                .from('gallery')
                .insert([{ ...newItem, store_id: storeId }])
                .select()
                .single();
            if (error) throw error;

            logActivity({
                user,
                action: 'CREATE',
                entity_type: 'GALLERY',
                description: `Added new gallery item: ${newItem.title || 'Untitled'}`
            });

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: galleryKey });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}

export function useUpdateGalleryItem() {
    const queryClient = useQueryClient();
    const currentUser = useStore(s => s.user);

    return useMutation({
        mutationFn: async (item) => {
            const user = useStore.getState().user || currentUser;
            const storeId = Number(user?.store_id) || 1;
            const { id, ...payload } = item;

            const { data, error } = await supabase
                .from('gallery')
                .update(payload)
                .eq('id', id)
                .eq('store_id', storeId)
                .select()
                .single();
            if (error) throw error;

            logActivity({
                user,
                action: 'UPDATE',
                entity_type: 'GALLERY',
                description: `Updated gallery item: ${payload.title || `ID ${id}`}`
            });

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: galleryKey });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}

export function useDeleteGalleryItem() {
    const queryClient = useQueryClient();
    const currentUser = useStore(s => s.user);

    return useMutation({
        mutationFn: async (id) => {
            const user = useStore.getState().user || currentUser;
            const storeId = Number(user?.store_id) || 1;

            const { data: item } = await supabase
                .from('gallery')
                .select('title')
                .eq('id', id)
                .eq('store_id', storeId)
                .single();

            const { error } = await supabase
                .from('gallery')
                .delete()
                .eq('id', id)
                .eq('store_id', storeId);
            if (error) throw error;

            if (item) {
                logActivity({
                    user,
                    action: 'DELETE',
                    entity_type: 'GALLERY',
                    description: `Deleted gallery item: ${item.title}`
                });
            }

            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: galleryKey });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}