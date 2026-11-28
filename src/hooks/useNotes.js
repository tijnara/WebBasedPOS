// src/hooks/useNotes.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';

const notesKey = ['notes'];

let MOCK_NOTES = [
    { id: 'mock-1', content: 'Follow up with supplier for 5-Gal jugs.', created_at: new Date().toISOString(), created_by: 'mock-id', users: { name: 'Demo Staff A', color: '#EF4444' } },
    { id: 'mock-2', content: 'Check inventory for 500ml PET bottles.', created_at: new Date().toISOString(), created_by: 'mock-id', users: { name: 'Demo Staff B', color: '#10B981' } },
];

export function useNotes(storeId = null) {
    const isDemo = useStore(s => s.user?.isDemo);
    const userStoreId = useStore(s => s.user?.store_id);
    const targetStoreId = Number(storeId || userStoreId) || 1;

    return useQuery({
        queryKey: [...notesKey, targetStoreId, isDemo],
        queryFn: async () => {
            if (isDemo) return MOCK_NOTES.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            try {
                const { data, error } = await supabase
                    .from('notes')
                    .select('*, users:users!created_by(name, color), updated_by_user:users!updated_by(name, color)')
                    .eq('store_id', targetStoreId)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Notes fetch error:', error.message);
                    return [];
                }
                return data || [];
            } catch (err) {
                console.error('Notes critical error:', err);
                return [];
            }
        },
    });
}

export function useCreateNote() {
    const queryClient = useQueryClient();
    const user = useStore(s => s.user);

    return useMutation({
        mutationFn: async (content) => {
            const currentUser = useStore.getState().user || user;
            if (currentUser?.isDemo) {
                MOCK_NOTES.push({
                    id: `mock-${Date.now()}`,
                    content,
                    created_at: new Date().toISOString(),
                    created_by: currentUser.id,
                    users: { name: currentUser.name, color: currentUser.color || '#3B82F6' }
                });
                return;
            }

            if (!currentUser || !currentUser.id) {
                throw new Error('User not available for creating a note.');
            }

            const storeId = Number(currentUser.store_id) || 1;
            const { error } = await supabase
                .from('notes')
                .insert([{
                    store_id: storeId,
                    content,
                    created_by: currentUser.id,
                    updated_at: new Date().toISOString()
                }]);
            if (error) throw error;

            logActivity({
                user: currentUser,
                action: 'CREATE',
                entity_type: 'NOTE',
                description: `Created new dashboard note`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notesKey });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}

export function useUpdateNote() {
    const queryClient = useQueryClient();
    const user = useStore(s => s.user);

    return useMutation({
        mutationFn: async ({ id, content }) => {
            const currentUser = useStore.getState().user || user;
            if (currentUser?.isDemo) {
                const note = MOCK_NOTES.find(n => n.id === id);
                if (note) {
                    note.content = content;
                    note.updated_at = new Date().toISOString();
                    note.updated_by = currentUser.id;
                    note.updated_by_user = { name: currentUser.name, color: currentUser.color || '#3B82F6' };
                }
                return;
            }

            const storeId = Number(currentUser?.store_id) || 1;
            const { error } = await supabase
                .from('notes')
                .update({ content, updated_at: new Date().toISOString(), updated_by: currentUser?.id })
                .eq('id', id)
                .eq('store_id', storeId);
            if (error) throw error;

            logActivity({
                user: currentUser,
                action: 'UPDATE',
                entity_type: 'NOTE',
                description: `Updated dashboard note`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notesKey });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}

export function useDeleteNote() {
    const queryClient = useQueryClient();
    const user = useStore(s => s.user);

    return useMutation({
        mutationFn: async (id) => {
            const currentUser = useStore.getState().user || user;
            if (currentUser?.isDemo) {
                MOCK_NOTES = MOCK_NOTES.filter(n => n.id !== id);
                return;
            }

            const storeId = Number(currentUser?.store_id) || 1;
            const { error } = await supabase
                .from('notes')
                .delete()
                .eq('id', id)
                .eq('store_id', storeId);
            if (error) throw error;

            logActivity({
                user: currentUser,
                action: 'DELETE',
                entity_type: 'NOTE',
                description: `Deleted dashboard note`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notesKey });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}