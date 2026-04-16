// src/hooks/useNotes.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

const notesKey = ['notes'];

// Mock data for demo mode
let MOCK_NOTES = [
    { id: 'mock-1', content: 'Follow up with supplier for 5-Gal jugs.', created_at: new Date().toISOString(), created_by: 'mock-id', users: { name: 'Demo Staff A' } },
    { id: 'mock-2', content: 'Check inventory for 500ml PET bottles.', created_at: new Date().toISOString(), created_by: 'mock-id', users: { name: 'Demo Staff B' } },
];

export function useNotes() {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: notesKey.concat([isDemo]),
        queryFn: async () => {
            if (isDemo) return MOCK_NOTES.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            try {
                const { data, error } = await supabase
                    .from('notes')
                    // Join the users table to get the name based on the created_by ID
                    .select('*, users:created_by(name)')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error("Notes fetch error:", error.message);
                    return [];
                }
                return data || [];
            } catch (err) {
                console.error("Notes critical error:", err);
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
            if (user?.isDemo) {
                MOCK_NOTES.push({
                    id: `mock-${Date.now()}`,
                    content,
                    created_at: new Date().toISOString(),
                    created_by: user.id,
                    users: { name: user.name }
                });
                return;
            }

            if (!user || !user.id) {
                throw new Error('User not available for creating a note.');
            }

            const { error } = await supabase.from('notes').insert([{ content, created_by: user.id }]);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKey }),
    });
}

export function useUpdateNote() {
    const queryClient = useQueryClient();
    const isDemo = useStore(s => s.user?.isDemo);

    return useMutation({
        mutationFn: async ({ id, content }) => {
            if (isDemo) {
                const note = MOCK_NOTES.find(n => n.id === id);
                if (note) note.content = content;
                return;
            }
            const { error } = await supabase.from('notes').update({ content, updated_at: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKey }),
    });
}

export function useDeleteNote() {
    const queryClient = useQueryClient();
    const isDemo = useStore(s => s.user?.isDemo);

    return useMutation({
        mutationFn: async (id) => {
            if (isDemo) {
                MOCK_NOTES = MOCK_NOTES.filter(n => n.id !== id);
                return;
            }
            const { error } = await supabase.from('notes').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKey }),
    });
}