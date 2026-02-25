import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

const galleryKey = ['gallery'];

export function useCreateGalleryItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newItem) => {
            const { data, error } = await supabase
                .from('gallery')
                .insert([newItem])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: galleryKey });
        },
    });
}

export function useUpdateGalleryItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item) => {
            const { id, ...payload } = item;
            const { data, error } = await supabase
                .from('gallery')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: galleryKey });
        },
    });
}

export function useDeleteGalleryItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('gallery').delete().eq('id', id);
            if (error) throw error;
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: galleryKey });
        },
    });
}
