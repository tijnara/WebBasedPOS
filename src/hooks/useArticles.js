// src/hooks/useArticles.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';

// --- Fetch Articles ---
export const useArticles = (storeId = null) => {
    const userStoreId = useStore(s => s.user?.store_id);
    const targetStoreId = Number(storeId || userStoreId) || 1;

    return useQuery({
        queryKey: ['articles', targetStoreId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .eq('store_id', targetStoreId)
                .order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
        },
    });
};

// --- Create Article ---
export const useCreateArticle = () => {
    const queryClient = useQueryClient();
    const currentUser = useStore(s => s.user);

    return useMutation({
        mutationFn: async (article) => {
            const user = useStore.getState().user || currentUser;
            const storeId = Number(article?.store_id || user?.store_id) || 1;

            const { data, error } = await supabase
                .from('articles')
                .insert([{ ...article, store_id: storeId }])
                .select();
            if (error) throw new Error(error.message);

            logActivity({
                user,
                action: 'CREATE',
                entity_type: 'ARTICLE',
                description: `Created new article: ${article.title || 'Untitled'}`
            });

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['articles'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
};

// --- Update Article ---
export const useUpdateArticle = () => {
    const queryClient = useQueryClient();
    const currentUser = useStore(s => s.user);

    return useMutation({
        mutationFn: async ({ id, ...updateData }) => {
            const user = useStore.getState().user || currentUser;
            const storeId = Number(user?.store_id) || 1;

            const { data, error } = await supabase
                .from('articles')
                .update(updateData)
                .eq('id', id)
                .eq('store_id', storeId)
                .select();
            if (error) throw new Error(error.message);

            logActivity({
                user,
                action: 'UPDATE',
                entity_type: 'ARTICLE',
                description: `Updated article: ${updateData.title || `ID ${id}`}`
            });

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['articles'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
};

// --- Delete Article ---
export const useDeleteArticle = () => {
    const queryClient = useQueryClient();
    const currentUser = useStore(s => s.user);

    return useMutation({
        mutationFn: async (id) => {
            const user = useStore.getState().user || currentUser;
            const storeId = Number(user?.store_id) || 1;

            const { data: art } = await supabase
                .from('articles')
                .select('title')
                .eq('id', id)
                .eq('store_id', storeId)
                .single();

            const { error } = await supabase
                .from('articles')
                .delete()
                .eq('id', id)
                .eq('store_id', storeId);
            if (error) throw new Error(error.message);

            if (art) {
                logActivity({
                    user,
                    action: 'DELETE',
                    entity_type: 'ARTICLE',
                    description: `Deleted article: ${art.title}`
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['articles'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
};

// --- Upload Image ---
export const useUploadArticleImage = () => {
    const currentUser = useStore(s => s.user);

    return useMutation({
        mutationFn: async (file) => {
            const user = useStore.getState().user || currentUser;
            const storeId = Number(user?.store_id) || 1;

            const fileExt = file.name.split('.').pop();
            const fileName = `article-${Date.now()}.${fileExt}`;
            const filePath = `store-${storeId}/articles/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('gallery').upload(filePath, file);
            if (uploadError) throw new Error(uploadError.message);

            const { data } = supabase.storage.from('gallery').getPublicUrl(filePath);

            logActivity({
                user,
                action: 'UPLOAD',
                entity_type: 'ARTICLE',
                description: `Uploaded article image: ${fileName}`
            });

            return data.publicUrl;
        },
    });
};