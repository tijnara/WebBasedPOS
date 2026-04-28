// src/components/FloatingNotes.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '../hooks/useNotes';
import { Button, Card, CardHeader, CardContent, Textarea } from './ui';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

const StickyNoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

export default function FloatingNotes() {
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [currentContent, setCurrentContent] = useState('');
    const [editingId, setEditingId] = useState(null);
    const containerRef = useRef(null);

    const user = useStore(s => s.user);
    const { data: notes = [], isLoading } = useNotes();
    const createNote = useCreateNote();
    const updateNote = useUpdateNote();
    const deleteNote = useDeleteNote();
    const queryClient = useQueryClient();

    // Track last seen time using localStorage
    const [lastSeenTime, setLastSeenTime] = useState(() => {
        if (typeof window !== 'undefined') {
            return parseInt(localStorage.getItem(`notes_last_seen_${user?.id}`) || '0', 10);
        }
        return 0;
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Realtime subscription for notes so the unread counter stays up to date
    useEffect(() => {
        if (!user || user.isDemo) return;
        const channel = supabase.channel('realtime_notes_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
                queryClient.invalidateQueries({ queryKey: ['notes'] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, queryClient]);

    // Update last seen time when modal is opened
    useEffect(() => {
        if (isOpen && user) {
            const now = Date.now();
            setLastSeenTime(now);
            localStorage.setItem(`notes_last_seen_${user.id}`, now.toString());
        }
    }, [isOpen, user]);

    const handleSave = async () => {
        if (!currentContent.trim() || !user) return;

        if (editingId) {
            await updateNote.mutateAsync({ id: editingId, content: currentContent });
            setEditingId(null);
        } else {
            await createNote.mutateAsync(currentContent);
        }
        setCurrentContent('');
    };

    const handleEdit = (note) => {
        setEditingId(note.id);
        setCurrentContent(note.content);
        setIsOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this note?')) {
            await deleteNote.mutateAsync(id);
            if (editingId === id) {
                setEditingId(null);
                setCurrentContent('');
            }
        }
    };

    if (!mounted) return null;

    // Calculate unread notes within the last 24 hours (not created by current user)
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const unreadCount = notes.filter(note => {
        const noteTime = new Date(note.created_at).getTime();
        return noteTime > lastSeenTime && noteTime > twentyFourHoursAgo && String(note.created_by) !== String(user?.id);
    }).length;

    const floatingUI = (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 2147483647,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end'
            }}
        >
            {isOpen && (
                <Card className="w-[85vw] sm:w-[300px] md:w-[320px] mb-4 shadow-2xl border-0 flex flex-col h-[28rem] md:h-[32rem] max-h-[70vh] bg-white">
                    <CardHeader className="bg-yellow-100 py-3 flex justify-between items-center rounded-t-lg">
                        <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                            <StickyNoteIcon /> Scratchpad
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-yellow-700 hover:text-yellow-900 font-bold p-1">
                            ✕
                        </button>
                    </CardHeader>
                    <CardContent className="p-0 flex flex-col flex-1 overflow-hidden bg-yellow-50/30">
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {isLoading ? (
                                <p className="text-center text-sm text-gray-500">Loading notes...</p>
                            ) : notes.length === 0 ? (
                                <p className="text-center text-sm text-gray-500 mt-10">No notes yet. Add one below!</p>
                            ) : (
                                notes.map(note => (
                                    <div key={note.id} className="bg-white p-3 rounded shadow-sm text-sm group border border-gray-100">
                                        <p className="whitespace-pre-wrap text-gray-800 mb-2 text-base">{note.content}</p>
                                        <div className="flex justify-between items-center mt-2 border-t pt-2">
                                            <span className="text-xs text-gray-500 font-medium">
                                                <span className="font-semibold text-gray-700">
                                                    {note.users?.name || note.created_by || 'Unknown Staff'}
                                                </span>
                                                {' • '}
                                                {note.created_at ? format(new Date(note.created_at), 'MMM d, h:mm a') : 'Just now'}
                                            </span>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEdit(note)} className="text-blue-500 hover:text-blue-700 text-xs font-semibold">Edit</button>
                                                <button onClick={() => handleDelete(note.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100">
                            <Textarea
                                placeholder="Type a note..."
                                value={currentContent}
                                onChange={(e) => setCurrentContent(e.target.value)}
                                className="w-full text-sm mb-3 min-h-[60px] bg-yellow-50 focus:ring-yellow-400 focus:border-yellow-400"
                            />
                            <div className="flex gap-2 justify-end">
                                {editingId && (
                                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setCurrentContent(''); }} className="text-gray-500">Cancel</Button>
                                )}
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-none font-bold"
                                    disabled={!user}
                                >
                                    {editingId ? 'Update' : 'Add'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    height: '48px', width: '48px',
                    backgroundColor: '#facc15',
                    color: '#713f12',
                    borderRadius: '9999px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #fde047',
                    cursor: 'pointer',
                    position: 'relative'
                }}
                aria-label="Toggle Notes"
            >
                <div className="scale-90">
                    <StickyNoteIcon />
                </div>

                {/* Notification Badge */}
                {!isOpen && unreadCount > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        height: '18px',
                        minWidth: '18px',
                        padding: '0 4px',
                        borderRadius: '9px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        animation: 'pulse 2s infinite'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                )}
            </button>
        </div>
    );

    return createPortal(floatingUI, document.body);
}
