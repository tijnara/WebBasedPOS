import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

// --- Fetch Articles ---
export const useArticles = () => {
    return useQuery({
        queryKey: ['articles'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
        },
    });
};

// --- Create Article ---
export const useCreateArticle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (article) => {
            const { data, error } = await supabase.from('articles').insert([article]).select();
            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['articles'] });
        },
    });
};

// --- Update Article ---
export const useUpdateArticle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updateData }) => {
            const { data, error } = await supabase.from('articles').update(updateData).eq('id', id).select();
            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['articles'] });
        },
    });
};

// --- Delete Article ---
export const useDeleteArticle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('articles').delete().eq('id', id);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['articles'] });
        },
    });
};

// --- Upload Image ---
export const useUploadArticleImage = () => {
    return useMutation({
        mutationFn: async (file) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `article-${Date.now()}.${fileExt}`;
            const filePath = `articles/${fileName}`;
            
            const { error: uploadError } = await supabase.storage.from('gallery').upload(filePath, file);
            if (uploadError) throw new Error(uploadError.message);

            const { data } = supabase.storage.from('gallery').getPublicUrl(filePath);
            return data.publicUrl;
        },
    });
};